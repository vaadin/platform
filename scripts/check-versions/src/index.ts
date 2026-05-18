import { parseArgs } from "node:util";
import {
    iterateModules,
    readVersions,
    writeVersions,
    VERSIONS_JSON_PATH,
    VersionsJson,
} from "./versionsJson.js";
import { fetchMavenVersions } from "./maven.js";
import { fetchNpmVersions } from "./npm.js";
import { hasOutOfScopeNewer, isSnapshotValue, pickMaintenance } from "./semver.js";
import { ARTIFACT_ID_OVERRIDES, SKIP_MODULES, VERSION_BLOCKLIST } from "./artifact-overrides.js";
import {
    assertCleanWorkingTree,
    assertGhAvailable,
    checkoutNewBranchFromBase,
    commitBody,
    commitFiles,
    commitTitle,
    fetchOrigin,
    findExistingPr,
    findUniqueBranchName,
    forcePushBranch,
    openPullRequest,
    pushBranch,
    readFileFromRef,
    resetBranchToBase,
    Update,
    updatePullRequest,
} from "./git.js";

interface Cli {
    dryRun: boolean;
    only: Set<string>;
    modules: Set<string>;
    artifactOverrides: Map<string, string | "skip">;
    versionBlocklist: Map<string, Set<string>>;
    verbose: boolean;
    check: boolean;
    createPr: boolean;
    base: string;
}

function parseCli(argv: string[]): Cli {
    const { values } = parseArgs({
        args: argv,
        options: {
            "dry-run": { type: "boolean", default: false },
            check: { type: "boolean", default: false },
            only: { type: "string", multiple: true, default: [] },
            module: { type: "string", multiple: true, default: [] },
            "artifact-id": { type: "string", multiple: true, default: [] },
            skip: { type: "string", multiple: true, default: [] },
            "skip-version": { type: "string", multiple: true, default: [] },
            "create-pr": { type: "boolean", default: false },
            base: { type: "string", default: "main" },
            verbose: { type: "boolean", default: false },
        },
        strict: true,
        allowPositionals: false,
    });

    const artifactOverrides = new Map<string, string | "skip">();
    for (const entry of (values["artifact-id"] as string[]) ?? []) {
        const eq = entry.indexOf("=");
        if (eq < 0) throw new Error(`--artifact-id expects key=value, got "${entry}"`);
        artifactOverrides.set(entry.slice(0, eq), entry.slice(eq + 1));
    }
    for (const key of (values.skip as string[]) ?? []) artifactOverrides.set(key, "skip");

    const versionBlocklist = new Map<string, Set<string>>();
    for (const [key, versions] of Object.entries(VERSION_BLOCKLIST)) {
        versionBlocklist.set(key, new Set(versions));
    }
    for (const entry of (values["skip-version"] as string[]) ?? []) {
        const eq = entry.indexOf("=");
        if (eq < 0) throw new Error(`--skip-version expects moduleKey=version, got "${entry}"`);
        const key = entry.slice(0, eq);
        const version = entry.slice(eq + 1);
        const set = versionBlocklist.get(key) ?? new Set<string>();
        set.add(version);
        versionBlocklist.set(key, set);
    }

    const createPr = !!values["create-pr"];
    if (createPr && (values["dry-run"] || values.check)) {
        throw new Error("--create-pr cannot be combined with --dry-run / --check.");
    }

    return {
        dryRun: !!values["dry-run"] || !!values.check,
        check: !!values.check,
        only: new Set((values.only as string[]) ?? []),
        modules: new Set((values.module as string[]) ?? []),
        artifactOverrides,
        versionBlocklist,
        verbose: !!values.verbose,
        createPr,
        base: (values.base as string) ?? "main",
    };
}

interface Counters {
    upToDate: number;
    updated: number;
    skippedSnap: number;
    skippedMajor: number;
    skippedPrivate: number;
    skippedListed: number;
    warnNotFound: number;
    errors: number;
}

function isSkipListed(name: string, cli: Cli): boolean {
    return (
        SKIP_MODULES.has(name) ||
        cli.artifactOverrides.get(name) === "skip" ||
        ARTIFACT_ID_OVERRIDES[name] === "skip"
    );
}

const PAD = 14;
const NAME_PAD = 42;
function logLine(tag: string, location: string, detail: string): void {
    console.log(`${tag.padEnd(PAD)}${location.padEnd(NAME_PAD)}${detail}`);
}

function applyVersionBlocklist(
    name: string,
    versions: string[],
    cli: Cli,
): { kept: string[]; dropped: string[] } {
    const blocked = cli.versionBlocklist.get(name);
    if (!blocked || blocked.size === 0) return { kept: versions, dropped: [] };
    const kept: string[] = [];
    const dropped: string[] = [];
    for (const v of versions) (blocked.has(v) ? dropped : kept).push(v);
    return { kept, dropped };
}

function blocklistSuffix(dropped: string[]): string {
    if (dropped.length === 0) return "";
    const sample = dropped.slice(0, 3).join(", ");
    const more = dropped.length > 3 ? `, +${dropped.length - 3} more` : "";
    return ` [blocklist: ${sample}${more}]`;
}

async function checkMaven(
    section: string,
    name: string,
    current: string,
    cli: Cli,
    counters: Counters,
    updates: Update[],
    apply: (newVersion: string) => void,
): Promise<void> {
    const loc = `${section}/${name}`;
    if (isSnapshotValue(current)) {
        counters.skippedSnap++;
        logLine("skip-snap", loc, `javaVersion=${current}`);
        return;
    }
    const result = await fetchMavenVersions(name, cli.artifactOverrides, cli.verbose);
    switch (result.status) {
        case "skip-private":
            counters.skippedPrivate++;
            logLine("skip-private", loc, `override marks "skip" in src/artifact-overrides.ts`);
            return;
        case "error":
            counters.errors++;
            logLine("error", loc, `Maven ${result.message}`);
            return;
        case "not-found":
            counters.warnNotFound++;
            logLine(
                "warn-not-found",
                loc,
                `Maven: 404 on both repos for "${result.artifactId}" — check src/artifact-overrides.ts`,
            );
            return;
        case "ok": {
            const { kept, dropped } = applyVersionBlocklist(name, result.versions, cli);
            const suffix = blocklistSuffix(dropped);
            const pick = pickMaintenance(current, kept);
            if (pick && pick !== current) {
                counters.updated++;
                logLine("update", loc, `javaVersion ${current} → ${pick}${suffix}`);
                apply(pick);
                updates.push({ section, name, field: "javaVersion", from: current, to: pick });
            } else if (hasOutOfScopeNewer(current, kept)) {
                counters.upToDate++;
                logLine("skip-major", loc, `javaVersion ${current} has newer minor/major (out of scope)${suffix}`);
            } else {
                counters.upToDate++;
                logLine("up-to-date", loc, `javaVersion=${current}${suffix}`);
            }
            return;
        }
    }
}

async function checkNpm(
    section: string,
    name: string,
    npmName: string,
    current: string,
    cli: Cli,
    counters: Counters,
    updates: Update[],
    apply: (newVersion: string) => void,
): Promise<void> {
    const loc = `${section}/${name}`;
    if (isSnapshotValue(current)) {
        counters.skippedSnap++;
        logLine("skip-snap", loc, `jsVersion=${current}`);
        return;
    }
    const result = await fetchNpmVersions(npmName, cli.verbose);
    switch (result.status) {
        case "error":
            counters.errors++;
            logLine("error", loc, `npm ${result.message}`);
            return;
        case "not-found":
            counters.warnNotFound++;
            logLine(
                "warn-not-found",
                loc,
                `npm: 404 for "${npmName}" — check npmName in versions.json`,
            );
            return;
        case "ok": {
            const { kept, dropped } = applyVersionBlocklist(name, result.versions, cli);
            const suffix = blocklistSuffix(dropped);
            const pick = pickMaintenance(current, kept);
            if (pick && pick !== current) {
                counters.updated++;
                logLine("update", loc, `jsVersion ${current} → ${pick}${suffix}`);
                apply(pick);
                updates.push({ section, name, field: "jsVersion", from: current, to: pick });
            } else if (hasOutOfScopeNewer(current, kept)) {
                counters.upToDate++;
                logLine("skip-major", loc, `jsVersion ${current} has newer minor/major (out of scope)${suffix}`);
            } else {
                counters.upToDate++;
                logLine("up-to-date", loc, `jsVersion=${current}${suffix}`);
            }
        }
    }
}

async function main(): Promise<void> {
    const cli = parseCli(process.argv.slice(2));

    if (cli.createPr) {
        // Pre-flight before we touch anything: the working tree must be clean
        // so the only diff after the run is versions.json itself, and gh must
        // be authenticated so the final step doesn't strand us mid-flow.
        assertCleanWorkingTree();
        assertGhAvailable();
        // PR target may be any branch (release branches, etc.); always read
        // versions.json from the remote tip of that branch so the proposed
        // diff is against the actual target state, not the local checkout.
        fetchOrigin([cli.base]);
    }

    let data: VersionsJson;
    if (cli.createPr) {
        const raw = readFileFromRef(`origin/${cli.base}`, "versions.json");
        data = JSON.parse(raw) as VersionsJson;
    } else {
        data = readVersions();
    }
    const updates: Update[] = [];
    const counters: Counters = {
        upToDate: 0,
        updated: 0,
        skippedSnap: 0,
        skippedMajor: 0,
        skippedPrivate: 0,
        skippedListed: 0,
        warnNotFound: 0,
        errors: 0,
    };

    const tasks: (() => Promise<void>)[] = [];
    for (const entry of iterateModules(data)) {
        const { section, name, module } = entry;
        if (cli.only.size > 0 && !cli.only.has(section)) continue;
        if (cli.modules.size > 0 && !cli.modules.has(name)) continue;

        if (isSkipListed(name, cli)) {
            const fields: string[] = [];
            if (typeof module.javaVersion === "string") fields.push(`javaVersion=${module.javaVersion}`);
            if (typeof module.jsVersion === "string") fields.push(`jsVersion=${module.jsVersion}`);
            if (fields.length === 0) continue;
            counters.skippedListed++;
            logLine("skip-listed", `${section}/${name}`, `${fields.join(", ")} (in SKIP_MODULES)`);
            continue;
        }

        if (typeof module.javaVersion === "string") {
            const current = module.javaVersion;
            tasks.push(() =>
                checkMaven(section, name, current, cli, counters, updates, (newV) => {
                    module.javaVersion = newV;
                }),
            );
        }
        if (typeof module.jsVersion === "string" && typeof module.npmName === "string") {
            const current = module.jsVersion;
            const npmName = module.npmName;
            tasks.push(() =>
                checkNpm(section, name, npmName, current, cli, counters, updates, (newV) => {
                    module.jsVersion = newV;
                }),
            );
        }
    }

    await runWithConcurrency(tasks, 8);

    console.log("");
    console.log(
        `Summary: ${counters.upToDate} up-to-date, ${counters.updated} updated, ` +
            `${counters.skippedSnap} snapshot, ${counters.skippedListed} skip-listed, ` +
            `${counters.skippedPrivate} private, ${counters.warnNotFound} not-found, ` +
            `${counters.errors} errors`,
    );

    if (counters.updated > 0 && !cli.dryRun) {
        writeVersions(data);
        console.log(`Wrote ${VERSIONS_JSON_PATH}`);
    } else if (counters.updated > 0) {
        console.log(`(dry-run: ${VERSIONS_JSON_PATH} not modified)`);
    }

    if (cli.createPr) {
        if (counters.errors > 0 || counters.warnNotFound > 0) {
            console.error("Refusing to open a PR while errors / warn-not-found remain.");
            process.exit(1);
        }
        if (updates.length === 0) {
            console.log("No updates — nothing to PR.");
        } else {
            const date = new Date().toISOString().slice(0, 10);
            const title = commitTitle(date, cli.base);
            const body = commitBody(updates, cli.base);
            const existing = findExistingPr(cli.base);

            if (existing) {
                console.log(
                    `\nFound open PR #${existing.number} (${existing.url}); updating its branch "${existing.headRefName}" in place.`,
                );
                // Reset the PR's branch to origin/<base> so the new commit is
                // the only one on the branch — reviewers see a single,
                // current delta against the target.
                resetBranchToBase(existing.headRefName, cli.base);
                writeVersions(data);
                commitFiles(["versions.json"], title, body);
                forcePushBranch(existing.headRefName);
                updatePullRequest(existing.number, title, body);
                console.log(`Updated PR: ${existing.url}`);
            } else {
                const branchBase =
                    cli.base === "main" ? `bot/versions-${date}` : `bot/versions-${cli.base}-${date}`;
                const branch = findUniqueBranchName(branchBase);
                console.log(`\nNo open PR found for base "${cli.base}". Creating new PR on branch ${branch}...`);
                checkoutNewBranchFromBase(branch, cli.base);
                writeVersions(data);
                commitFiles(["versions.json"], title, body);
                pushBranch(branch);
                const prUrl = openPullRequest(title, body, cli.base);
                console.log(`Opened PR: ${prUrl}`);
            }
        }
    }

    if (counters.errors > 0 || counters.warnNotFound > 0) process.exit(1);
    if (cli.check && counters.updated > 0) process.exit(2);
}

async function runWithConcurrency(
    tasks: (() => Promise<void>)[],
    limit: number,
): Promise<void> {
    const queue = [...tasks];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length > 0) {
            const next = queue.shift();
            if (next) await next();
        }
    });
    await Promise.all(workers);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
