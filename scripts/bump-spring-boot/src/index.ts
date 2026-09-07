import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import { fetchSpringBootVersions, SPRING_BOOT_METADATA_URL } from "./maven.js";
import { pickLatestPatch, hasOutOfScopeNewer } from "./patch.js";
import { findSpringBootProperty, PROPERTY_NAME } from "./pom.js";
import {
    Repo,
    assertGhAvailable,
    checkoutNewBranchFromBase,
    commitFiles,
    configureBotIdentity,
    fetchOrigin,
    fetchOriginBestEffort,
    findExistingPr,
    findUniqueBranchName,
    forcePushBranch,
    openPullRequest,
    prNumberFromUrl,
    pushBranch,
    readFileFromRef,
    resetBranchToBase,
    updatePullRequest,
} from "./repo.js";

/**
 * Prefix that identifies this job's own rolling PR. Must stay distinct from
 * check-versions' "chore: maintenance version bumps" prefix, or the two jobs
 * would fight over the same PR.
 */
const PR_TITLE_PREFIX = "chore: bump Spring Boot";

const POM_PATH = "pom.xml";
const LABELS = ["dependencies", "automated"];

export type Status = "created" | "updated" | "up-to-date" | "dry-run" | "error";

/** One repo/branch outcome. Serialized to `--result-file` for the run report. */
export interface Result {
    repo: string;
    branch: string;
    status: Status;
    from: string | null;
    to: string | null;
    pr: { number: number; url: string } | null;
    error?: string;
}

interface Cli {
    repo: string;
    branch: string;
    repoDir: string;
    resultFile: string | null;
    dryRun: boolean;
    verbose: boolean;
}

function parseCli(argv: string[]): Cli {
    const { values } = parseArgs({
        args: argv,
        options: {
            repo: { type: "string" },
            branch: { type: "string" },
            "repo-dir": { type: "string" },
            "result-file": { type: "string" },
            "dry-run": { type: "boolean", default: false },
            verbose: { type: "boolean", default: false },
        },
        strict: true,
        allowPositionals: false,
    });

    for (const required of ["repo", "branch", "repo-dir"] as const) {
        if (!values[required]) throw new Error(`Missing required option --${required}`);
    }

    return {
        repo: values.repo as string,
        branch: values.branch as string,
        repoDir: path.resolve(values["repo-dir"] as string),
        resultFile: (values["result-file"] as string | undefined) ?? null,
        dryRun: values["dry-run"] as boolean,
        verbose: values.verbose as boolean,
    };
}

function commitTitle(version: string, branch: string): string {
    return `${PR_TITLE_PREFIX} to ${version} [${branch}]`;
}

function prBody(repo: string, branch: string, from: string, to: string, biggerAvailable: boolean): string {
    const lines = [
        `Bumps \`${PROPERTY_NAME}\` in \`${POM_PATH}\` from **${from}** to **${to}** on \`${branch}\`.`,
        "",
        `This is a **patch-only** bump: ${to} is the newest stable release on the ${from.split(".").slice(0, 2).join(".")}.x line.`,
        "Major and minor upgrades are intentionally out of scope for this job and need human review.",
        "",
        `- Repository: \`vaadin/${repo}\``,
        `- Target branch: \`${branch}\``,
        `- Source of truth: [${PROPERTY_NAME} on Maven Central](${SPRING_BOOT_METADATA_URL})`,
    ];

    if (biggerAvailable) {
        lines.push(
            "",
            "> [!NOTE]",
            "> A newer Spring Boot major/minor release also exists. This PR deliberately does not include it.",
        );
    }

    lines.push(
        "",
        "---",
        "Opened by the `bump-spring-boot` workflow in [vaadin/platform](https://github.com/vaadin/platform/actions/workflows/bump-spring-boot.yml).",
    );
    return lines.join("\n");
}

async function main(): Promise<number> {
    const cli = parseCli(process.argv.slice(2));
    const repo: Repo = { name: cli.repo, slug: `vaadin/${cli.repo}`, dir: cli.repoDir };

    const result: Result = {
        repo: cli.repo,
        branch: cli.branch,
        status: "error",
        from: null,
        to: null,
        pr: null,
    };

    try {
        if (!fs.existsSync(path.join(repo.dir, ".git"))) {
            throw new Error(`Not a git checkout: ${repo.dir}`);
        }

        // A dry run only reads the pom, so it may fall back to a local
        // remote-tracking ref; a real bump must see the true tip of the base.
        if (cli.dryRun) {
            const warning = fetchOriginBestEffort(repo, [cli.branch]);
            if (warning) console.warn(`  warning: ${warning}`);
        } else {
            fetchOrigin(repo, [cli.branch]);
        }

        const source = readFileFromRef(repo, `origin/${cli.branch}`, POM_PATH);
        const property = findSpringBootProperty(source, `${repo.slug}:${cli.branch}/${POM_PATH}`);
        result.from = property.current;

        const available = await fetchSpringBootVersions();
        if (cli.verbose) console.log(`fetched ${available.length} versions from Maven Central`);

        const next = pickLatestPatch(property.current, available);

        if (next === null) {
            result.status = "up-to-date";
            result.to = property.current;
            console.log(`${repo.slug} [${cli.branch}]: up to date (${property.current})`);
            return 0;
        }

        result.to = next;
        console.log(`${repo.slug} [${cli.branch}]: ${property.current} -> ${next}`);

        if (cli.dryRun) {
            result.status = "dry-run";
            console.log("  dry run, no branch or PR created");
            return 0;
        }

        assertGhAvailable(repo.dir);
        configureBotIdentity(repo);

        const title = commitTitle(next, cli.branch);
        const body = prBody(
            repo.name,
            cli.branch,
            property.current,
            next,
            hasOutOfScopeNewer(property.current, available),
        );
        const existing = findExistingPr(repo, cli.branch, PR_TITLE_PREFIX);

        // Rolling PR: reuse this job's open PR for the branch if there is one,
        // resetting its branch to base so the PR stays a single commit rather
        // than accumulating one bump commit per run.
        const branch = existing
            ? existing.headRefName
            : findUniqueBranchName(repo, `bot/spring-boot-${cli.branch}-${new Date().toISOString().slice(0, 10)}`);

        if (existing) {
            resetBranchToBase(repo, branch, cli.branch);
        } else {
            checkoutNewBranchFromBase(repo, branch, cli.branch);
        }

        fs.writeFileSync(path.join(repo.dir, POM_PATH), property.replace(next), "utf8");
        commitFiles(repo, [POM_PATH], title, body);

        if (existing) {
            forcePushBranch(repo, branch);
            updatePullRequest(repo, existing.number, title, body);
            result.status = "updated";
            result.pr = { number: existing.number, url: existing.url };
            console.log(`  updated ${existing.url}`);
        } else {
            pushBranch(repo, branch);
            const url = openPullRequest(repo, cli.branch, title, body, LABELS);
            const number = prNumberFromUrl(url);
            if (number === null) throw new Error(`Could not parse a PR number out of ${JSON.stringify(url)}`);
            result.status = "created";
            result.pr = { number, url };
            console.log(`  created ${url}`);
        }

        return 0;
    } catch (err) {
        result.status = "error";
        result.error = err instanceof Error ? err.message : String(err);
        console.error(`${repo.slug} [${cli.branch}]: ${result.error}`);
        return 1;
    } finally {
        // Written even on failure, so a broken cell shows up in the run report
        // as an error rather than silently vanishing from it.
        if (cli.resultFile) {
            fs.mkdirSync(path.dirname(path.resolve(cli.resultFile)), { recursive: true });
            fs.writeFileSync(cli.resultFile, `${JSON.stringify(result, null, 2)}\n`, "utf8");
        }
    }
}

// Two deliberate choices here:
//
// Set `exitCode` rather than calling process.exit(): exiting while undici
// still holds the HTTPS socket open trips a libuv assertion on Windows
// (`!(handle->flags & UV_HANDLE_CLOSING)`). Letting the loop drain naturally
// is both correct and quiet.
//
// Use .then() rather than top-level await: top-level await is only legal when
// this file is treated as ESM, which depends on package.json being present and
// declaring `"type": "module"`. This repo's .gitignore excludes
// **/package.json broadly, so a missing whitelist entry once made tsx fall
// back to CJS and fail with an opaque esbuild transform error. Avoiding
// top-level await removes that whole failure mode.
main()
    .then((code) => {
        process.exitCode = code;
    })
    .catch((err) => {
        console.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    });
