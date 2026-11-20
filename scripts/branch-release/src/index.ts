import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import {
    PropertyChange,
    bumpPomProperties,
    bumpVersionsJson,
    isPomFile,
    isSkippedFile,
    looksBinary,
    readProjectVersion,
    replaceSnapshotLiteral,
} from "./bump.js";
import {
    checkoutDetached,
    commitAllTracked,
    createRemoteBranch,
    discardWorkingTreeChanges,
    listTrackedFiles,
    remoteBranchSha,
    revParse,
    shortStat,
} from "./git.js";
import { BRANCH_ONLY_REPOS, EXCLUDED_PRODUCTS, EXTRA_EDITS, MERGE_ORDER } from "./repos.js";
import { Train, belongsToTrain, nextTrain, parseTrain, snapshotOf, snapshotTokenRegExp, trainName } from "./version.js";
import {
    Repo,
    assertGhAvailable,
    checkoutNewBranchFromBase,
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
} from "../../bump-spring-boot/src/repo.js";

/**
 * One repo's share of the beta1 branch cut:
 *
 *   1. create the `X.Y` maintenance branch from `main`, and
 *   2. open (or refresh) a PR moving `main` to `X.(Y+1)-SNAPSHOT`.
 *
 * Both start from the same commit of `main`, so nothing that lands during the
 * run can end up on one side only. See ../README.md.
 */

const MAIN = "main";
const ROOT_POM = "pom.xml";
const LABELS = ["automated"];
/** Files bigger than this are never version-bearing sources; skip reading them. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type BranchStatus = "created" | "exists" | "dry-run" | "skipped" | "error";
/** `skipped`: a branch-only repo, which never gets a bump PR. */
export type BumpStatus = "created" | "updated" | "up-to-date" | "dry-run" | "skipped" | "error";

export interface Result {
    repo: string;
    version: string;
    next: string;
    branch: { status: BranchStatus; sha: string | null; reason?: string };
    bump: {
        status: BumpStatus;
        from: string | null;
        to: string;
        files: number;
        properties: PropertyChange[];
    };
    pr: { number: number; url: string } | null;
    warnings: string[];
    error?: string;
}

interface Cli {
    repo: string;
    train: Train;
    repoDir: string;
    resultFile?: string;
    dryRun: boolean;
    createBranch: boolean;
}

function parseCli(): Cli {
    const { values } = parseArgs({
        options: {
            repo: { type: "string" },
            version: { type: "string" },
            "repo-dir": { type: "string" },
            "result-file": { type: "string" },
            "dry-run": { type: "boolean", default: false },
            "no-branch": { type: "boolean", default: false },
        },
        strict: true,
    });
    if (!values.repo) throw new Error("--repo is required");
    if (!values.version) throw new Error("--version is required (major.minor, e.g. 25.4)");
    if (!values["repo-dir"]) throw new Error("--repo-dir is required");
    return {
        repo: values.repo,
        train: parseTrain(values.version),
        repoDir: path.resolve(values["repo-dir"]),
        resultFile: values["result-file"],
        dryRun: values["dry-run"] ?? false,
        createBranch: !values["no-branch"],
    };
}

interface Edits {
    files: string[];
    properties: PropertyChange[];
    literals: number;
    warnings: string[];
}

/** Apply every version edit to the working tree of `repo`. */
function applyEdits(repo: Repo, train: Train): Edits {
    const edits: Edits = { files: [], properties: [], literals: 0, warnings: [] };
    const extras = EXTRA_EDITS[repo.name] ?? [];
    const extrasHit = new Set<string>();

    for (const file of listTrackedFiles(repo)) {
        if (isSkippedFile(file)) continue;
        const abs = path.join(repo.dir, file);
        let stat: fs.Stats;
        try {
            stat = fs.lstatSync(abs);
        } catch {
            continue; // deleted in the working tree, or a sparse/odd path
        }
        if (!stat.isFile() || stat.size > MAX_FILE_BYTES) continue;
        const buf = fs.readFileSync(abs);
        if (looksBinary(buf)) continue;

        const original = buf.toString("utf8");
        let text = original;

        const literal = replaceSnapshotLiteral(text, train);
        text = literal.text;
        edits.literals += literal.count;

        if (isPomFile(file)) {
            const props = bumpPomProperties(text, train, file);
            text = props.text;
            edits.properties.push(...props.changes);
        }

        if (repo.name === "platform" && file === "versions.json") {
            const versions = bumpVersionsJson(text, train, new Set(Object.keys(EXCLUDED_PRODUCTS)));
            text = versions.text;
            edits.properties.push(...versions.changes);
        }

        for (const extra of extras) {
            if (!`/${file}`.endsWith(extra.pathSuffix)) continue;
            const after = extra.apply(text, train);
            if (after !== text) extrasHit.add(extra.pathSuffix);
            text = after;
        }

        if (text !== original) {
            fs.writeFileSync(abs, text, "utf8");
            edits.files.push(file);
        }
    }

    for (const extra of extras) {
        if (!extrasHit.has(extra.pathSuffix)) {
            edits.warnings.push(`expected ${extra.description} in *${extra.pathSuffix} but changed nothing; check it by hand`);
        }
    }
    return edits;
}

/**
 * Refuse to commit a half bump: the root pom must now declare the next
 * SNAPSHOT and no pom may still mention the old one.
 */
function assertComplete(repo: Repo, train: Train): void {
    const expected = snapshotOf(nextTrain(train));
    const root = readProjectVersion(fs.readFileSync(path.join(repo.dir, ROOT_POM), "utf8"));
    if (root !== expected) {
        throw new Error(`after editing, ${ROOT_POM} declares ${root ?? "no version"}, expected ${expected}`);
    }
    const leftovers = listTrackedFiles(repo)
        .filter(isPomFile)
        .filter((f) => snapshotTokenRegExp(train).test(fs.readFileSync(path.join(repo.dir, f), "utf8")));
    if (leftovers.length > 0) {
        throw new Error(`${snapshotOf(train)} is still present in: ${leftovers.slice(0, 10).join(", ")}`);
    }
}

function prBody(cli: Cli, edits: Edits, stat: string, branchNote: string): string {
    const version = trainName(cli.train);
    const next = snapshotOf(nextTrain(cli.train));
    const lines = [
        `Moves \`main\` to \`${next}\` after the \`${version}.0-beta1\` platform release. ${branchNote}`,
        "",
        `- project version \`${snapshotOf(cli.train)}\` → \`${next}\` (${edits.literals} occurrence(s))`,
        `- ${stat || "no diff stat"}`,
    ];

    if (edits.properties.length > 0) {
        lines.push("", "### Dependency versions moved to the next SNAPSHOT", "", "| file | property | from | to |", "| --- | --- | --- | --- |");
        for (const c of edits.properties) lines.push(`| \`${c.file}\` | \`${c.property}\` | ${c.from} | ${c.to} |`);
    }

    if (edits.warnings.length > 0) {
        lines.push("", "### ⚠️ Needs a look", "");
        for (const w of edits.warnings) lines.push(`- ${w}`);
    }

    const order = MERGE_ORDER.map((group, i) => `${i + 1}. ${group.map((r) => (r === cli.repo ? `**${r}**` : r)).join(", ")}`);
    lines.push(
        "",
        "### Merge order",
        "",
        `Downstream builds resolve upstream \`${next}\` artifacts, which only exist once the upstream bump is merged and its snapshot is published. Until then, CI here may fail to resolve them. Merge in this order:`,
        "",
        ...order,
        "",
        "### Follow-ups not done by this PR",
        "",
        `- [ ] Add \`${version}\` to branch lists in workflows, if this repo has any. Known ones: platform \`check-versions.yml\` / \`bump-spring-boot.yml\`, flow \`validation.yml\` / \`update-frontend-dependencies.yml\`, testbench \`bump-dependencies.yml\`.`,
        "",
        "<details><summary>Changed files</summary>",
        "",
        ...edits.files.slice(0, 400).map((f) => `- \`${f}\``),
        ...(edits.files.length > 400 ? [`- … and ${edits.files.length - 400} more`] : []),
        "",
        "</details>",
        "",
        "Generated by `scripts/branch-release` in vaadin/platform.",
    );
    return lines.join("\n");
}

/** `version` from a package.json, or null. */
function packageVersion(source: string): string | null {
    const version = (JSON.parse(source) as { version?: unknown }).version;
    return typeof version === "string" ? version : null;
}

async function main(): Promise<number> {
    const cli = parseCli();
    const repo: Repo = { name: cli.repo, slug: `vaadin/${cli.repo}`, dir: cli.repoDir };
    const version = trainName(cli.train);
    const current = snapshotOf(cli.train);
    const next = snapshotOf(nextTrain(cli.train));
    const title = `chore: bump main to ${next}`;

    const result: Result = {
        repo: cli.repo,
        version,
        next,
        branch: { status: "skipped", sha: null },
        bump: { status: "error", from: null, to: next, files: 0, properties: [] },
        pr: null,
        warnings: [],
    };

    try {
        if (!cli.dryRun) {
            assertGhAvailable(repo.dir);
            configureBotIdentity(repo);
            fetchOrigin(repo, [MAIN]);
        } else {
            const warning = fetchOriginBestEffort(repo, [MAIN]);
            if (warning) result.warnings.push(warning);
        }

        const base = revParse(repo, `origin/${MAIN}`);
        const branchOnly = BRANCH_ONLY_REPOS.has(repo.name);
        // npm meta-package repos carry the release version in package.json;
        // everything else is a Maven build with the SNAPSHOT in the root pom.
        const declared = branchOnly
            ? packageVersion(readFileFromRef(repo, base, "package.json"))
            : readProjectVersion(readFileFromRef(repo, base, ROOT_POM));
        // Only cut X.Y from a main that is still on X.Y. Otherwise the
        // maintenance branch would start with the wrong version on it.
        const onTrain = branchOnly ? declared !== null && belongsToTrain(declared, cli.train) : declared === current;
        result.bump.from = declared;
        console.log(`${repo.slug}: main is ${declared ?? "?"} at ${base.slice(0, 10)}${branchOnly ? " (branch only)" : ""}`);

        // ---------------------------------------------------------- branch --
        const existing = remoteBranchSha(repo, version);
        if (existing) {
            result.branch = { status: "exists", sha: existing };
        } else if (!cli.createBranch) {
            result.branch = { status: "skipped", sha: null, reason: "branch creation disabled" };
        } else if (!onTrain) {
            result.branch = {
                status: "skipped",
                sha: null,
                reason: `main is ${declared ?? "unversioned"}, not on ${version}; create ${version} by hand from the right commit`,
            };
        } else if (cli.dryRun) {
            result.branch = { status: "dry-run", sha: base };
        } else {
            createRemoteBranch(repo, version, base);
            result.branch = { status: "created", sha: base };
        }
        console.log(`  branch ${version}: ${result.branch.status}${result.branch.reason ? ` (${result.branch.reason})` : ""}`);

        // ------------------------------------------------------------ bump --
        if (branchOnly) {
            result.bump.status = "skipped";
            result.bump.to = declared ?? next;
            console.log("  main: branch-only repo, no bump");
            return 0;
        }
        if (declared === next) {
            result.bump.status = "up-to-date";
            console.log(`  main: already ${next}`);
            return 0;
        }
        if (declared !== current) {
            throw new Error(`root ${ROOT_POM} on main declares ${declared ?? "no version"}, expected ${current}`);
        }

        const existingPr = cli.dryRun ? null : findExistingPr(repo, MAIN, title);
        let prBranch: string;
        if (cli.dryRun) {
            checkoutDetached(repo, base);
            prBranch = "(dry run)";
        } else if (existingPr) {
            prBranch = existingPr.headRefName;
            resetBranchToBase(repo, prBranch, MAIN);
        } else {
            prBranch = findUniqueBranchName(repo, `bot/bump-main-${next}`);
            checkoutNewBranchFromBase(repo, prBranch, MAIN);
        }

        const edits = applyEdits(repo, cli.train);
        result.warnings.push(...edits.warnings);
        result.bump.files = edits.files.length;
        result.bump.properties = edits.properties;
        assertComplete(repo, cli.train);

        const stat = shortStat(repo);
        console.log(`  main: ${current} -> ${next}, ${stat}`);
        for (const c of edits.properties) console.log(`    ${c.file}: ${c.property} ${c.from} -> ${c.to}`);
        for (const w of edits.warnings) console.log(`    warning: ${w}`);

        if (cli.dryRun) {
            discardWorkingTreeChanges(repo);
            result.bump.status = "dry-run";
            return 0;
        }

        const branchNote =
            result.branch.status === "created"
                ? `The \`${version}\` maintenance branch was created from ${base.slice(0, 10)}, the same commit this PR starts from.`
                : result.branch.status === "exists"
                  ? `The \`${version}\` branch already existed and was left untouched.`
                  : `The \`${version}\` branch was not created: ${result.branch.reason ?? "skipped"}.`;
        const body = prBody(cli, edits, stat, branchNote);
        commitAllTracked(repo, title, `Branch ${version} cut from ${base}.`);

        if (existingPr) {
            forcePushBranch(repo, prBranch);
            updatePullRequest(repo, existingPr.number, title, body);
            result.pr = { number: existingPr.number, url: existingPr.url };
            result.bump.status = "updated";
        } else {
            pushBranch(repo, prBranch);
            const url = openPullRequest(repo, MAIN, title, body, LABELS);
            result.pr = { number: prNumberFromUrl(url) ?? 0, url };
            result.bump.status = "created";
        }
        console.log(`  PR ${result.bump.status}: ${result.pr.url}`);
        return 0;
    } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        if (result.bump.status !== "up-to-date") result.bump.status = "error";
        console.error(`${repo.slug}: ${result.error}`);
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

// .then() rather than top-level await, and exitCode rather than exit(): see
// the note at the bottom of scripts/bump-spring-boot/src/index.ts.
main()
    .then((code) => {
        process.exitCode = code;
    })
    .catch((err) => {
        console.error(err instanceof Error ? err.message : String(err));
        process.exitCode = 1;
    });
