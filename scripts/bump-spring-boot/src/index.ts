import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import {
    fetchVersionData,
    readVersionsFile,
    springDataBomUrl,
    SPRING_BOOT_METADATA_URL,
    VersionData,
} from "./maven.js";
import { pickLatestPatch, hasOutOfScopeNewer } from "./patch.js";
import { findOptionalProperty, findProperty, PROPERTY_NAME, SPRING_DATA_COMMONS_PROPERTY, SUPPORTED_PROPERTIES } from "./pom.js";
import {
    Repo,
    assertGhAvailable,
    checkoutNewBranchFromBase,
    commitFiles,
    configureBotIdentity,
    branchExistsOnOrigin,
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

export type Status = "created" | "updated" | "up-to-date" | "dry-run" | "skipped" | "error";

/** One property's bump within a repo/branch. */
export interface Change {
    property: string;
    from: string;
    to: string;
}

/** One repo/branch outcome. Serialized to `--result-file` for the run report. */
export interface Result {
    repo: string;
    branch: string;
    status: Status;
    /**
     * Human-readable summaries for the run report. A plain version when the
     * pom declares only spring.boot.version; otherwise each property is named,
     * e.g. "spring-data-commons 4.2.0-RC1".
     */
    from: string | null;
    to: string | null;
    pr: { number: number; url: string } | null;
    error?: string;
    /** Why a `skipped` cell had nothing to do. */
    reason?: string;
}

/** Mark a cell as not applicable (no such branch, or nothing to bump on it). */
function skip(result: Result, reason: string): number {
    result.status = "skipped";
    result.reason = reason;
    console.log(`vaadin/${result.repo} [${result.branch}]: skipped, ${reason}`);
    return 0;
}

/** A supported property as declared on the branch, plus the version to move it to (or null). */
interface Plan {
    property: string;
    current: string;
    next: string | null;
    /** A newer major/minor exists that this job deliberately does not take. */
    biggerAvailable: boolean;
    /** Extra PR-body line explaining where `next` came from. */
    source: string;
}

/**
 * Decide the next version for one property.
 *
 * spring.boot.version: newest stable patch of its own line.
 * spring-data-commons.version: the version managed by the newest stable
 * Spring Boot release of the matching line, so a repo that declares it
 * directly (flow-components) moves in step with Spring Boot.
 */
function plan(property: string, current: string, data: VersionData): Plan {
    if (property === PROPERTY_NAME) {
        return {
            property,
            current,
            next: pickLatestPatch(current, data.springBoot),
            biggerAvailable: hasOutOfScopeNewer(current, data.springBoot),
            source: `[spring-boot-starter-parent on Maven Central](${SPRING_BOOT_METADATA_URL})`,
        };
    }
    if (property === SPRING_DATA_COMMONS_PROPERTY) {
        const entries = Object.values(data.springData);
        const managed = entries.map((e) => e.springDataCommons);
        const next = pickLatestPatch(current, managed);
        const entry = next ? entries.find((e) => e.springDataCommons === next) : undefined;
        return {
            property,
            current,
            next,
            biggerAvailable: hasOutOfScopeNewer(current, managed),
            source: entry
                ? `managed by Spring Boot ${entry.springBoot} via [spring-data-bom ${entry.springDataBom}](${springDataBomUrl(entry.springDataBom)})`
                : "",
        };
    }
    throw new Error(`Unsupported property ${property}`);
}

/** Report summary: a bare version for the Boot-only case the report always showed, otherwise named. */
function summarize(changes: { property: string; version: string }[]): string {
    if (changes.length === 1 && changes[0].property === PROPERTY_NAME) return changes[0].version;
    return changes.map((c) => `${c.property === PROPERTY_NAME ? "spring-boot" : c.property.replace(/\.version$/, "")} ${c.version}`).join(", ");
}

interface Cli {
    repo: string;
    branch: string;
    repoDir: string;
    resultFile: string | null;
    versionsFile: string | null;
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
            "versions-file": { type: "string" },
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
        versionsFile: (values["versions-file"] as string | undefined) ?? null,
        dryRun: values["dry-run"] as boolean,
        verbose: values.verbose as boolean,
    };
}

/**
 * Every title starts with PR_TITLE_PREFIX, which is how the next run finds
 * this job's rolling PR for the branch.
 */
function commitTitle(changes: Change[], branch: string): string {
    const boot = changes.find((c) => c.property === PROPERTY_NAME);
    const others = changes
        .filter((c) => c.property !== PROPERTY_NAME)
        .map((c) => `${c.property.replace(/\.version$/, "")} to ${c.to}`);
    const head = boot
        ? [`${PR_TITLE_PREFIX} to ${boot.to}`, ...others].join(" and ")
        : `${PR_TITLE_PREFIX}'s ${others.join(" and ")}`;
    return `${head} [${branch}]`;
}

function prBody(repo: string, branch: string, plans: Plan[]): string {
    const bumps = plans.filter((p) => p.next !== null);
    const lines = [
        `Bumps on \`${branch}\` in \`${POM_PATH}\`:`,
        "",
        "| property | from | to | source |",
        "| --- | --- | --- | --- |",
        ...bumps.map((p) => `| \`${p.property}\` | ${p.current} | **${p.next}** | ${p.source} |`),
        "",
        "This is a **patch-only** bump: each version stays on its own major.minor line.",
        "Major and minor upgrades are intentionally out of scope for this job and need human review.",
        "`spring-data-commons` follows the version Spring Boot's BOM manages, so it moves in step with Spring Boot.",
        "",
        `- Repository: \`vaadin/${repo}\``,
        `- Target branch: \`${branch}\``,
    ];

    if (bumps.some((p) => p.biggerAvailable)) {
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

        // Every repo is run against the same shared branch list
        // (.github/supported-branches.json), but not every repo has every
        // branch: hilla and copilot-internal start at 24.x, for example.
        // That is expected, so it is a skip rather than a failure.
        if (!branchExistsOnOrigin(repo, cli.branch)) {
            return skip(result, `vaadin/${cli.repo} has no ${cli.branch} branch`);
        }

        // A dry run only reads the pom, so it may fall back to a local
        // remote-tracking ref; a real bump must see the true tip of the base.
        if (cli.dryRun) {
            const warning = fetchOriginBestEffort(repo, [cli.branch]);
            if (warning) console.warn(`  warning: ${warning}`);
        } else {
            fetchOrigin(repo, [cli.branch]);
        }

        const pomLabel = `${repo.slug}:${cli.branch}/${POM_PATH}`;
        const source = readFileFromRef(repo, `origin/${cli.branch}`, POM_PATH);
        const declared = SUPPORTED_PROPERTIES.map((name) => findOptionalProperty(source, name, pomLabel)).filter(
            (p) => p !== null,
        );
        if (declared.length === 0) {
            // Older lines predate Spring Boot in that repo (e.g. 14.14).
            return skip(result, `${POM_PATH} declares neither ${SUPPORTED_PROPERTIES.join(" nor ")}`);
        }
        result.from = summarize(declared.map((p) => ({ property: p.name, version: p.current })));

        // The workflow fetches once and hands every cell the same data, so
        // Maven Central is not hit once per repo/branch (that got us HTTP 429).
        const data = cli.versionsFile ? readVersionsFile(cli.versionsFile) : await fetchVersionData();
        if (cli.verbose) {
            const from = cli.versionsFile ?? "Maven Central";
            console.log(`read ${data.springBoot.length} Spring Boot versions from ${from}`);
        }

        const plans = declared.map((p) => plan(p.name, p.current, data));
        const changes: Change[] = plans
            .filter((p) => p.next !== null)
            .map((p) => ({ property: p.property, from: p.current, to: p.next as string }));

        if (changes.length === 0) {
            result.status = "up-to-date";
            result.to = result.from;
            console.log(`${repo.slug} [${cli.branch}]: up to date (${result.from})`);
            return 0;
        }

        // Unchanged properties keep their current version in the summary.
        result.to = summarize(plans.map((p) => ({ property: p.property, version: p.next ?? p.current })));
        for (const c of changes) console.log(`${repo.slug} [${cli.branch}]: ${c.property} ${c.from} -> ${c.to}`);

        if (cli.dryRun) {
            result.status = "dry-run";
            console.log("  dry run, no branch or PR created");
            return 0;
        }

        assertGhAvailable(repo.dir);
        configureBotIdentity(repo);

        const title = commitTitle(changes, cli.branch);
        const body = prBody(repo.name, cli.branch, plans);
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

        // Apply one property at a time, re-locating each declaration in the
        // already-edited source.
        const updated = changes.reduce((src, c) => findProperty(src, c.property, pomLabel).replace(c.to), source);
        fs.writeFileSync(path.join(repo.dir, POM_PATH), updated, "utf8");
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
