import { parseArgs } from "node:util";
import fs from "node:fs";
import path from "node:path";
import {
    PropertyChange,
    bumpPomProperties,
    bumpVersionsJson,
    withVersionPropertiesMasked,
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
    createLabel,
    findOpenPrMentioning,
    listLabels,
    listTrackedFiles,
    remoteBranchSha,
    revParse,
    shortStat,
} from "./git.js";
import { labelTemplate, targetLabelName } from "./labels.js";
import { EXCLUDED_PRODUCTS, EXTRA_EDITS, MERGE_ORDER } from "./repos.js";
import { Train, nextTrain, parseTrain, snapshotOf, snapshotTokenRegExp, trainName } from "./version.js";
import {
    Repo,
    assertGhAvailable,
    checkoutNewBranchFromBase,
    configureBotIdentity,
    fetchOrigin,
    fetchOriginBestEffort,
    findUniqueBranchName,
    openPullRequest,
    prNumberFromUrl,
    pushBranch,
    readFileFromRef,
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
/** `exists`: a bump PR was already open; it is reported and left untouched. */
export type BumpStatus = "created" | "exists" | "up-to-date" | "dry-run" | "error";

export type LabelStatus = "created" | "exists" | "dry-run" | "skipped" | "error";

export interface Result {
    repo: string;
    version: string;
    next: string;
    branch: { status: BranchStatus; sha: string | null; reason?: string };
    /** The `target/X.Y` label, ensured once the X.Y branch exists. */
    label: { name: string; status: LabelStatus };
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
    /** When false, only the project version moves; dependency versions stay as they are. */
    bumpDependencies: boolean;
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
            "skip-dependencies": { type: "boolean", default: false },
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
        bumpDependencies: !values["skip-dependencies"],
    };
}

interface Edits {
    files: string[];
    properties: PropertyChange[];
    literals: number;
    warnings: string[];
}

/**
 * Apply every version edit to the working tree of `repo`. With
 * `bumpDependencies` false, pom `<*.version>` properties and platform's
 * versions.json are left alone and only the project version moves.
 */
function applyEdits(repo: Repo, train: Train, bumpDependencies: boolean): Edits {
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

        const replaceLiteral = (t: string) => {
            const literal = replaceSnapshotLiteral(t, train);
            edits.literals += literal.count;
            return literal.text;
        };
        text = !bumpDependencies && isPomFile(file) ? withVersionPropertiesMasked(text, replaceLiteral) : replaceLiteral(text);

        if (bumpDependencies && isPomFile(file)) {
            const props = bumpPomProperties(text, train, file);
            text = props.text;
            edits.properties.push(...props.changes);
        }

        if (bumpDependencies && repo.name === "platform" && file === "versions.json") {
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
 * SNAPSHOT and no pom may still mention the old one, except in `<*.version>`
 * properties when dependency upgrades were skipped on purpose.
 */
function assertComplete(repo: Repo, train: Train, bumpDependencies: boolean): void {
    const expected = snapshotOf(nextTrain(train));
    const root = readProjectVersion(fs.readFileSync(path.join(repo.dir, ROOT_POM), "utf8"));
    if (root !== expected) {
        throw new Error(`after editing, ${ROOT_POM} declares ${root ?? "no version"}, expected ${expected}`);
    }
    const leftovers = listTrackedFiles(repo)
        .filter(isPomFile)
        .filter((f) => {
            let text = fs.readFileSync(path.join(repo.dir, f), "utf8");
            if (!bumpDependencies) text = withVersionPropertiesMasked(text, (masked) => masked.replace(/\u0000\d+\u0000/g, ""));
            return snapshotTokenRegExp(train).test(text);
        });
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
        ...(cli.bumpDependencies ? [] : ["- dependency versions were **not** changed (run with dependency upgrades skipped)"]),
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
        `- [ ] Add \`${version}\` to branch lists in workflows, if this repo has any. Known ones: flow \`validation.yml\` / \`update-frontend-dependencies.yml\`, testbench \`bump-dependencies.yml\`.`,
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

/**
 * Make sure the repo has a `target/X.Y` label for marking PRs to pick into the
 * new branch. A failure here is a warning, not a failed run: the branch and the
 * bump matter far more than a label, which can be added by hand.
 */
function ensureTargetLabel(repo: Repo, cli: Cli, result: Result): void {
    const name = result.label.name;
    try {
        const labels = listLabels(repo);
        if (labels.some((l) => l.name.toLowerCase() === name.toLowerCase())) {
            result.label.status = "exists";
        } else if (cli.dryRun) {
            result.label.status = "dry-run";
        } else {
            const { color, description } = labelTemplate(labels, cli.train);
            createLabel(repo, name, color, description);
            result.label.status = "created";
        }
    } catch (err) {
        // A dry run may lack gh credentials; that is not worth a warning.
        if (cli.dryRun) {
            result.label.status = "dry-run";
        } else {
            result.label.status = "error";
            result.warnings.push(`label ${name}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }
    console.log(`  label ${name}: ${result.label.status}`);
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
        label: { name: targetLabelName(cli.train), status: "skipped" },
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
        const declared = readProjectVersion(readFileFromRef(repo, base, ROOT_POM));
        result.bump.from = declared;
        console.log(`${repo.slug}: main is ${declared ?? "?"} at ${base.slice(0, 10)}`);

        // ---------------------------------------------------------- branch --
        const existing = remoteBranchSha(repo, version);
        if (existing) {
            result.branch = { status: "exists", sha: existing };
        } else if (!cli.createBranch) {
            result.branch = { status: "skipped", sha: null, reason: "branch creation disabled" };
        } else if (declared !== current) {
            // Cutting X.Y from a main that is no longer on X.Y would produce a
            // maintenance branch with the wrong version on it.
            result.branch = {
                status: "skipped",
                sha: null,
                reason: `main is ${declared ?? "unversioned"}, not on ${version}; create ${version} by hand from the right commit`,
            };
        } else if (cli.dryRun) {
            result.branch = { status: "dry-run", sha: base };
        } else {
            try {
                createRemoteBranch(repo, version, base);
            } catch (err) {
                // Record it on the branch, not just the run: the push can be
                // refused by a ruleset (e.g. required linear history).
                result.branch = { status: "error", sha: null, reason: "push refused, see error" };
                throw err;
            }
            result.branch = { status: "created", sha: base };
        }
        console.log(`  branch ${version}: ${result.branch.status}${result.branch.reason ? ` (${result.branch.reason})` : ""}`);

        // ----------------------------------------------------------- label --
        if (result.branch.status === "created" || result.branch.status === "exists" || result.branch.status === "dry-run") {
            ensureTargetLabel(repo, cli, result);
        }

        // ------------------------------------------------------------ bump --
        if (declared === next) {
            result.bump.status = "up-to-date";
            console.log(`  main: already ${next}`);
            return 0;
        }
        if (declared !== current) {
            throw new Error(`root ${ROOT_POM} on main declares ${declared ?? "no version"}, expected ${current}`);
        }

        // An open PR moving main to the next SNAPSHOT -- ours from an earlier
        // run, or one a person opened -- is reported and never touched.
        const existingPr = findOpenPrMentioning(repo, MAIN, next, cli.dryRun);
        if (existingPr) {
            result.bump.status = "exists";
            result.pr = { number: existingPr.number, url: existingPr.url };
            console.log(`  main: PR already open, left untouched: ${existingPr.url}`);
            return 0;
        }

        let prBranch: string;
        if (cli.dryRun) {
            checkoutDetached(repo, base);
            prBranch = "(dry run)";
        } else {
            prBranch = findUniqueBranchName(repo, `bot/bump-main-${next}`);
            checkoutNewBranchFromBase(repo, prBranch, MAIN);
        }

        const edits = applyEdits(repo, cli.train, cli.bumpDependencies);
        result.warnings.push(...edits.warnings);
        result.bump.files = edits.files.length;
        result.bump.properties = edits.properties;
        assertComplete(repo, cli.train, cli.bumpDependencies);

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

        pushBranch(repo, prBranch);
        const url = openPullRequest(repo, MAIN, title, body, LABELS);
        result.pr = { number: prNumberFromUrl(url) ?? 0, url };
        result.bump.status = "created";
        console.log(`  PR ${result.bump.status}: ${result.pr.url}`);
        return 0;
    } catch (err) {
        result.error = err instanceof Error ? err.message : String(err);
        // A branch failure stops the run before the bump, so the bump did not happen either.
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
