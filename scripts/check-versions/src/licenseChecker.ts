/**
 * Cross-branch audit of the license checker version.
 *
 * Two different license-checker versions are in play for every platform
 * release, and they are resolved through two completely separate paths:
 *
 *  1. **Runtime** — `versions.json` -> `vaadin-license-checker.javaVersion`
 *     ends up as a `dependencyManagement` pin in `vaadin-bom`, so it decides
 *     which `com.vaadin:license-checker` an application gets on its classpath.
 *  2. **Build time** — `vaadin-maven-plugin` / the Gradle plugin depend on
 *     flow, and the license check that runs during `build-frontend` uses the
 *     license-checker that the *pinned flow release* depends on. A plugin's
 *     dependencies are not affected by the project's `dependencyManagement`,
 *     so the `vaadin-bom` pin cannot change it — and neither can a user
 *     pinning `license-checker` in their own pom.
 *
 * When those two drift apart, a license-checker fix can be "released" in the
 * BOM while every production build still runs the old checker. That is how
 * a platform release can ship with, say, a 2.3.2 pin in `versions.json` while
 * `mvn package` keeps failing with an offline-key error that 2.3.2 fixed.
 *
 * This module reports, per branch:
 *  - whether both paths are on the license-checker major line the branch has
 *    to use (see {@link requiredMajor} — 1.x is not allowed anywhere),
 *  - the `versions.json` pin vs. the license-checker of the pinned flow
 *    release (they must match),
 *  - whether that version is the newest release of that major line.
 *
 * Usage:
 *   npx tsx src/licenseChecker.ts                  # audit the supported branches
 *   npx tsx src/licenseChecker.ts --branch 24.8    # audit specific branches
 *   npx tsx src/licenseChecker.ts --worktree       # audit versions.json on disk
 */
import { parseArgs } from "node:util";
import { XMLParser } from "fast-xml-parser";
import semver from "semver";
import { fetchMavenVersions, fetchPom } from "./maven.js";
import { fetchOrigin, readFileFromRef } from "./git.js";
import { isSnapshotValue } from "./semver.js";
import { iterateModules, readVersions, VersionsJson } from "./versionsJson.js";

/** `versions.json` key holding the runtime license-checker pin. */
export const LICENSE_CHECKER_KEY = "vaadin-license-checker";

/** `versions.json` key holding the flow version the platform release ships. */
export const FLOW_KEY = "flow";

/** Maven artifact whose `dependencyManagement` decides flow's license-checker. */
const FLOW_PARENT_ARTIFACT_ID = "flow-project";

/**
 * Platform branches this audit covers, newest first.
 *
 * The first block is the maintained set — the same list the `check-versions`
 * workflow fans out to, keep the two in sync. The second block is the older
 * minors that are superseded inside their generation but still ship to
 * customers on extended support, so a license checker that cannot validate
 * their keys still matters there. Branches older than those are frozen:
 * add one here while a security release is being prepared for it.
 */
export const SUPPORTED_BRANCHES: readonly string[] = [
    // Maintained — mirrors .github/workflows/check-versions.yml
    "main",
    "25.3",
    "25.2",
    "25.1",
    "24.10",
    "24.9",
    "23.7",
    "23.6",
    "14.14",
    // Superseded minors still used under extended support
    "25.0",
    "24.8",
    "24.7",
    "24.6",
    "24.5",
    "24.4",
];

/**
 * The license-checker major line a platform release has to use, derived from
 * the flow version it ships.
 *
 * 1.x must not be used anywhere any more: its newest release is from
 * December 2025 and the offline-key fixes released as 2.3.2 and 3.1.2 were
 * never backported to it. Flow 24.10 is where the 3.x line starts; anything
 * older — 24.9 and down, and the 23 and 14 lines' flow 23.x / 2.x — uses
 * 2.x. That is the split 24.9 and 24.10 already ship.
 *
 * Keyed off the flow pin rather than the branch name, so it is also right
 * for a backport branch, a bot branch or a detached HEAD, where the name
 * says nothing about the line. An unparseable pin (a `{{version}}`
 * placeholder, say) falls back to the newest line.
 */
export function requiredMajor(flowVersion: string): number {
    const match = /^(\d+)\.(\d+)/.exec(flowVersion);
    if (!match) return 3;
    const [major, minor] = [parseInt(match[1], 10), parseInt(match[2], 10)];
    if (major > 24) return 3;
    if (major === 24 && minor >= 10) return 3;
    return 2;
}

export type FindingKind =
    /** A version off the major line this branch must use — a 1.x pin, typically. */
    | "wrong-major"
    /** BOM pin is newer than the checker flow's plugins run — the fix is not in the build. */
    | "ahead-of-flow"
    /** BOM pin is older than flow's — the BOM downgrades the checker at runtime. */
    | "behind-flow"
    /** A newer license-checker exists in the major line this branch uses. */
    | "stale"
    /** Flow pin is a snapshot / unpublished, so its license-checker is unknown. */
    | "unresolved-flow";

export interface Finding {
    kind: FindingKind;
    message: string;
}

export interface BranchInput {
    branch: string;
    /** `vaadin-license-checker.javaVersion` from that branch's versions.json. */
    pinned: string;
    /** `flow.javaVersion` from that branch's versions.json. */
    flowVersion: string;
    /** license-checker that the pinned flow release depends on, null if unknown. */
    flowLicenseChecker: string | null;
    /** Every license-checker version published upstream. */
    available: readonly string[];
    /** Major line this branch must be on, see {@link requiredMajor}. */
    requiredMajor: number;
}

export interface BranchAudit extends BranchInput {
    /** Newest stable license-checker of the required major line, null if none. */
    latestInMajor: string | null;
    findings: Finding[];
}

function parse(version: string): semver.SemVer | null {
    try {
        return semver.parse(version, { loose: true });
    } catch {
        return null;
    }
}

/**
 * Newest stable release sharing `major`. Prereleases are ignored: a platform
 * branch must never be pinned to a license-checker beta.
 */
function latestStableInMajor(available: readonly string[], major: number): string | null {
    return (
        available
            .map((raw) => ({ raw, sv: parse(raw) }))
            .filter((x): x is { raw: string; sv: semver.SemVer } => x.sv !== null)
            .filter((x) => x.sv.major === major && x.sv.prerelease.length === 0)
            .sort((a, b) => semver.rcompare(a.sv, b.sv))[0]?.raw ?? null
    );
}

/**
 * Compare the two resolution paths and the upstream release line for a single
 * branch. Pure — all lookups are done by the caller.
 */
export function auditBranch(input: BranchInput): BranchAudit {
    const findings: Finding[] = [];
    const pinnedSv = parse(input.pinned);
    const latestInMajor = latestStableInMajor(input.available, input.requiredMajor);

    // A version off the required major line makes the rest of the report
    // moot: both paths have to move to the newest release of that line, so
    // report that one target instead of a patch update within a dead line.
    const offLine = [
        { label: `vaadin-bom pins ${input.pinned}`, sv: pinnedSv },
        input.flowLicenseChecker === null
            ? null
            : {
                  label: `flow ${input.flowVersion} builds against ${input.flowLicenseChecker}`,
                  sv: parse(input.flowLicenseChecker),
              },
    ].filter((x): x is { label: string; sv: semver.SemVer } => !!x?.sv && x.sv.major !== input.requiredMajor);
    if (offLine.length > 0) {
        findings.push({
            kind: "wrong-major",
            message: `${offLine.map((x) => x.label).join(" and ")} — this branch must use the ${input.requiredMajor}.x line (${latestInMajor ?? "no stable release"})`,
        });
        return { ...input, latestInMajor, findings };
    }

    if (input.flowLicenseChecker === null) {
        findings.push({
            kind: "unresolved-flow",
            message: `flow ${input.flowVersion} is not published — cannot tell which license-checker the build-time check uses`,
        });
    } else if (input.flowLicenseChecker !== input.pinned) {
        const flowSv = parse(input.flowLicenseChecker);
        const bomIsNewer = pinnedSv && flowSv && semver.gt(pinnedSv, flowSv);
        findings.push(
            bomIsNewer
                ? {
                      kind: "ahead-of-flow",
                      message: `vaadin-bom pins ${input.pinned} but flow ${input.flowVersion} builds against ${input.flowLicenseChecker} — the build-time license check still runs ${input.flowLicenseChecker}`,
                  }
                : {
                      kind: "behind-flow",
                      message: `vaadin-bom pins ${input.pinned}, downgrading the ${input.flowLicenseChecker} that flow ${input.flowVersion} depends on`,
                  },
        );
    }

    // Staleness is judged against whichever of the two paths is furthest
    // ahead: bumping only the laggard would still leave the release behind.
    const candidates = [input.pinned, input.flowLicenseChecker ?? input.pinned]
        .map((raw) => ({ raw, sv: parse(raw) }))
        .filter((x): x is { raw: string; sv: semver.SemVer } => x.sv !== null)
        .sort((a, b) => semver.rcompare(a.sv, b.sv));
    const newestInUse = candidates[0];
    const latestSv = latestInMajor ? parse(latestInMajor) : null;
    if (newestInUse && latestSv && semver.gt(latestSv, newestInUse.sv)) {
        findings.push({
            kind: "stale",
            message:
                latestSv.minor === newestInUse.sv.minor
                    ? `license-checker ${latestInMajor} is available (patch update from ${newestInUse.raw})`
                    : `license-checker ${latestInMajor} is available (minor update from ${newestInUse.raw}, same major line)`,
        });
    }

    return { ...input, latestInMajor, findings };
}

/** True when the audit found something that needs a change in a branch. */
export function isActionable(audit: BranchAudit): boolean {
    return audit.findings.some((f) => f.kind !== "unresolved-flow");
}

export function renderAudit(audits: readonly BranchAudit[]): string {
    const lines: string[] = [];
    const width = Math.max(...audits.map((a) => a.branch.length), 6);
    for (const audit of audits) {
        const status = audit.findings.length === 0 ? "ok" : isActionable(audit) ? "FAIL" : "note";
        lines.push(
            `${status.padEnd(4)} ${audit.branch.padEnd(width)}  bom=${audit.pinned}  flow=${audit.flowVersion} -> ${audit.flowLicenseChecker ?? "?"}  must-use=${audit.requiredMajor}.x (${audit.latestInMajor ?? "?"})`,
        );
        for (const finding of audit.findings) {
            lines.push(`       ${finding.kind}: ${finding.message}`);
        }
    }
    return lines.join("\n");
}

const xmlParser = new XMLParser({ ignoreAttributes: true });

interface PomDependency {
    groupId?: string;
    artifactId?: string;
    version?: string;
}

function asArray<T>(value: T | T[] | undefined): T[] {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
}

/**
 * Read the `license-checker` version managed by `com.vaadin:flow-project`,
 * the parent pom of every flow module. That is the version the maven/gradle
 * plugins — and therefore the build-time license check — resolve to.
 */
export function licenseCheckerVersionFromPom(pom: string): string | null {
    const parsed = xmlParser.parse(pom) as {
        project?: {
            dependencyManagement?: { dependencies?: { dependency?: PomDependency | PomDependency[] } };
            dependencies?: { dependency?: PomDependency | PomDependency[] };
        };
    };
    const dependencies = [
        ...asArray(parsed.project?.dependencyManagement?.dependencies?.dependency),
        ...asArray(parsed.project?.dependencies?.dependency),
    ];
    const match = dependencies.find(
        (d) => d.groupId === "com.vaadin" && d.artifactId === "license-checker" && d.version,
    );
    return match?.version ? String(match.version) : null;
}

async function fetchFlowLicenseChecker(flowVersion: string): Promise<string | null> {
    if (isSnapshotValue(flowVersion)) return null;
    const pom = await fetchPom(FLOW_PARENT_ARTIFACT_ID, flowVersion);
    return pom === null ? null : licenseCheckerVersionFromPom(pom);
}

function findModuleVersion(data: VersionsJson, name: string): string | null {
    for (const entry of iterateModules(data)) {
        if (entry.name === name && typeof entry.module.javaVersion === "string") {
            return entry.module.javaVersion;
        }
    }
    return null;
}

function readVersionsJsonOf(branch: string): VersionsJson | null {
    if (branch === "WORKTREE") return readVersions();
    for (const ref of [`origin/${branch}`, branch]) {
        try {
            return JSON.parse(readFileFromRef(ref, "versions.json")) as VersionsJson;
        } catch {
            // Try the next candidate ref.
        }
    }
    return null;
}

interface Cli {
    branches: string[];
    worktree: boolean;
    fetch: boolean;
}

function parseCli(argv: string[]): Cli {
    const { values } = parseArgs({
        args: argv,
        options: {
            branch: { type: "string", multiple: true, default: [] },
            worktree: { type: "boolean", default: false },
            fetch: { type: "boolean", default: false },
            help: { type: "boolean", default: false },
        },
        allowPositionals: false,
    });
    if (values.help) {
        console.log(
            [
                "Usage: tsx src/licenseChecker.ts [options]",
                "",
                "  --branch <name>   Audit this branch, repeatable (default: the supported branches)",
                "  --worktree        Audit the versions.json in the working tree instead",
                "  --fetch           git fetch the audited branches from origin first",
                "  --help            Print this help",
                "",
                "Exits 1 when a branch needs a license-checker change.",
            ].join("\n"),
        );
        process.exit(0);
    }
    return {
        branches: values.branch as string[],
        worktree: values.worktree as boolean,
        fetch: values.fetch as boolean,
    };
}

async function main(): Promise<void> {
    const cli = parseCli(process.argv.slice(2));
    const branches = cli.worktree
        ? ["WORKTREE"]
        : cli.branches.length > 0
          ? cli.branches
          : [...SUPPORTED_BRANCHES];

    if (cli.fetch && !cli.worktree) {
        fetchOrigin(branches);
    }

    const lookup = await fetchMavenVersions(LICENSE_CHECKER_KEY, new Map());
    if (lookup.status !== "ok") {
        console.error(`Cannot list license-checker releases: ${lookup.status}`);
        process.exit(1);
    }

    const audits: BranchAudit[] = [];
    const unreadable: string[] = [];
    for (const branch of branches) {
        const data = readVersionsJsonOf(branch);
        if (!data) {
            unreadable.push(branch);
            continue;
        }
        const pinned = findModuleVersion(data, LICENSE_CHECKER_KEY);
        const flowVersion = findModuleVersion(data, FLOW_KEY);
        if (!pinned || !flowVersion) {
            unreadable.push(branch);
            continue;
        }
        audits.push(
            auditBranch({
                branch,
                pinned,
                flowVersion,
                flowLicenseChecker: await fetchFlowLicenseChecker(flowVersion),
                available: lookup.versions,
                requiredMajor: requiredMajor(flowVersion),
            }),
        );
    }

    console.log(renderAudit(audits));
    for (const branch of unreadable) {
        console.log(`skip ${branch}: no versions.json with both ${LICENSE_CHECKER_KEY} and ${FLOW_KEY}`);
    }

    const actionable = audits.filter(isActionable);
    console.log("");
    console.log(
        `Summary: ${audits.length - actionable.length} ok, ${actionable.length} needing a change, ${unreadable.length} skipped`,
    );
    if (actionable.length > 0) process.exit(1);
}

// Only run the CLI when executed directly, so the unit tests can import the
// pure helpers above without triggering network calls.
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
    await main();
}
