import semver from "semver";
import { iterateModules, VersionsJson } from "./versionsJson.js";
import { isSnapshotValue } from "./semver.js";

/**
 * Stability invariant: in any given branch, the platform anchor modules
 * (flow, hilla, copilot) establish the minimum stability tier that the rest of
 * versions.json must meet. A maintenance release like 24.10.6 must not ship
 * with any module still on alpha/beta/rc — see e.g. the situation where
 * vaadin-spring-bom-24.10.6 went out with mpr.v8.version=7.1.0-alpha1 while
 * flow/hilla/copilot were all on stable 24.10.x.
 *
 * Tier ordering: alpha < beta < rc < stable. The floor is MIN(tier of each
 * anchor present in versions.json). Every other module's tier must be >= the
 * floor. Snapshots ({{version}} or *-SNAPSHOT) and unparseable versions are
 * skipped, since they aren't real release values.
 */

export type StabilityTier = "alpha" | "beta" | "rc" | "stable";

const TIER_RANK: Record<StabilityTier, number> = {
    alpha: 0,
    beta: 1,
    rc: 2,
    stable: 3,
};

const ANCHORS: readonly string[] = ["flow", "hilla", "copilot"];

export interface Violation {
    section: string;
    name: string;
    field: "javaVersion" | "jsVersion";
    version: string;
    tier: StabilityTier;
}

export interface AnchorInfo {
    name: string;
    version: string;
    tier: StabilityTier;
}

export interface StabilityReport {
    anchors: AnchorInfo[];
    floor: StabilityTier | null;
    violations: Violation[];
}

/**
 * Classify a version string into a stability tier. Returns null for snapshots,
 * unparseable values, and prereleases with unknown labels (e.g. -SNAPSHOT-foo).
 * Mirrors the label-extraction shape used by comparePrerelease in semver.ts.
 */
export function classifyTier(version: string): StabilityTier | null {
    if (isSnapshotValue(version)) return null;
    let sv: semver.SemVer | null;
    try {
        sv = semver.parse(version, { loose: true });
    } catch {
        return null;
    }
    if (!sv) return null;
    if (sv.prerelease.length === 0) return "stable";
    if (sv.prerelease.length !== 1) return null;
    const first = sv.prerelease[0];
    if (typeof first !== "string") return null;
    const m = /^([a-z]+)\d+$/i.exec(first);
    if (!m) return null;
    const label = m[1].toLowerCase();
    if (label === "alpha" || label === "beta" || label === "rc") return label;
    return null;
}

function minTier(tiers: StabilityTier[]): StabilityTier | null {
    if (tiers.length === 0) return null;
    return tiers.reduce<StabilityTier>(
        (acc, t) => (TIER_RANK[t] < TIER_RANK[acc] ? t : acc),
        tiers[0],
    );
}

/**
 * Scan the in-memory versions.json and report any module whose tier falls
 * below the anchor floor. Anchors are flow/hilla/copilot wherever they appear
 * (the loop just matches by module name across all sections).
 */
export function checkStability(data: VersionsJson): StabilityReport {
    const anchors: AnchorInfo[] = [];
    for (const { name, module } of iterateModules(data)) {
        if (!ANCHORS.includes(name)) continue;
        if (typeof module.javaVersion !== "string") continue;
        const tier = classifyTier(module.javaVersion);
        if (tier === null) continue;
        anchors.push({ name, version: module.javaVersion, tier });
    }

    const floor = minTier(anchors.map((a) => a.tier));
    if (floor === null) return { anchors, floor: null, violations: [] };

    const floorRank = TIER_RANK[floor];
    const violations: Violation[] = [];
    for (const { section, name, module } of iterateModules(data)) {
        if (ANCHORS.includes(name)) continue;
        for (const field of ["javaVersion", "jsVersion"] as const) {
            const v = module[field];
            if (typeof v !== "string") continue;
            const tier = classifyTier(v);
            if (tier === null) continue;
            if (TIER_RANK[tier] < floorRank) {
                violations.push({ section, name, field, version: v, tier });
            }
        }
    }
    return { anchors, floor, violations };
}

/**
 * Markdown rendered into both the PR body section and the sticky PR comment.
 * Returns the section content WITHOUT the marker — callers prepend the marker.
 * Returns "" when there are no violations.
 */
export function renderStabilityMarkdown(report: StabilityReport): string {
    if (report.violations.length === 0 || report.floor === null) return "";
    const lines: string[] = [];
    lines.push("## Stability check warnings");
    lines.push("");
    lines.push(
        `Anchors **flow / hilla / copilot** establish a stability floor of **\`${report.floor}\`** on this branch:`,
    );
    lines.push("");
    for (const a of report.anchors) {
        lines.push(`- \`${a.name}\` = \`${a.version}\` (${a.tier})`);
    }
    lines.push("");
    lines.push(
        `The following ${report.violations.length === 1 ? "module is" : "modules are"} below that floor and should be bumped to a \`${report.floor}\` (or higher) release before merging:`,
    );
    lines.push("");
    for (const v of report.violations) {
        lines.push(
            `- \`${v.section}/${v.name}\`: ${v.field} \`${v.version}\` — currently **${v.tier}**, needs **${report.floor}**`,
        );
    }
    lines.push("");
    lines.push(
        "_Shipping a maintenance release with a prerelease module breaks downstream stability expectations (see e.g. `vaadin-spring-bom-24.10.6` shipping `mpr.v8.version=7.1.0-alpha1`)._",
    );
    return lines.join("\n");
}
