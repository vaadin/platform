import semver from "semver";

export function isSnapshotValue(value: string): boolean {
    return value === "{{version}}" || value.endsWith("-SNAPSHOT");
}

function coerceParse(v: string): semver.SemVer | null {
    try {
        return semver.parse(v, { loose: true });
    } catch {
        return null;
    }
}

/**
 * Compare two prerelease versions sharing the same X.Y.Z base.
 *
 * Vaadin uses a non-dotted prerelease format like `alpha12`, which semver
 * treats as a single string identifier and sorts lexically — so `alpha12`
 * incorrectly compares less than `alpha9`. We split the identifier into
 * a letters-prefix + integer-suffix and compare label first
 * (alpha < beta < rc), then number numerically. Falls back to semver
 * compare for anything that doesn't match that shape.
 */
const LABEL_RANK: Record<string, number> = { alpha: 0, beta: 1, rc: 2 };

function splitLabelNumber(pre: readonly (string | number)[]): { label: string; num: number } | null {
    if (pre.length !== 1) return null;
    const first = pre[0];
    if (typeof first !== "string") return null;
    const m = /^([a-z]+)(\d+)$/i.exec(first);
    if (!m) return null;
    return { label: m[1].toLowerCase(), num: parseInt(m[2], 10) };
}

function comparePrerelease(a: semver.SemVer, b: semver.SemVer): number {
    const aSplit = splitLabelNumber(a.prerelease);
    const bSplit = splitLabelNumber(b.prerelease);
    if (aSplit && bSplit) {
        const aRank = LABEL_RANK[aSplit.label] ?? 100;
        const bRank = LABEL_RANK[bSplit.label] ?? 100;
        if (aRank !== bRank) return aRank - bRank;
        if (aRank === 100) {
            // Unknown labels — compare lexically as a fallback.
            const cmp = aSplit.label.localeCompare(bSplit.label);
            if (cmp !== 0) return cmp;
        }
        return aSplit.num - bSplit.num;
    }
    return semver.compare(a, b);
}

/**
 * Pick a maintenance-only upgrade for `current` within `candidates`.
 *
 * Rules (confirmed with user):
 * - Stable current: stay on same major.minor, pick highest stable patch.
 * - Prerelease current:
 *     1. If any stable X.Y.Z exists in the same major.minor, pick the
 *        highest stable patch (this may bump Z, e.g. 25.2.0-alpha12 -> 25.2.1).
 *     2. Otherwise pick the highest prerelease tag for the same X.Y.Z base.
 *     3. Otherwise null.
 * - Never bump major or minor.
 */
export function pickMaintenance(current: string, candidates: string[]): string | null {
    const cur = coerceParse(current);
    if (!cur) return null;

    const parsed = candidates
        .map((c) => ({ raw: c, sv: coerceParse(c) }))
        .filter((x): x is { raw: string; sv: semver.SemVer } => x.sv !== null);

    const sameMinor = parsed.filter(
        (x) => x.sv.major === cur.major && x.sv.minor === cur.minor,
    );

    const stableSameMinor = sameMinor
        .filter((x) => x.sv.prerelease.length === 0)
        .filter((x) => semver.gte(x.sv, cur))
        .sort((a, b) => semver.rcompare(a.sv, b.sv))[0];

    const curIsPrerelease = cur.prerelease.length > 0;
    if (!curIsPrerelease) {
        // Stable -> only return if strictly greater (avoid no-op "update")
        if (stableSameMinor && semver.gt(stableSameMinor.sv, cur)) return stableSameMinor.raw;
        return null;
    }

    if (stableSameMinor) return stableSameMinor.raw;

    const sameBasePre = sameMinor
        .filter((x) => x.sv.patch === cur.patch && x.sv.prerelease.length > 0)
        .filter((x) => comparePrerelease(x.sv, cur) > 0)
        .sort((a, b) => comparePrerelease(b.sv, a.sv))[0];

    return sameBasePre?.raw ?? null;
}

/**
 * True iff a newer *stable* release exists in a different major.minor than
 * `current`. Prereleases of a future minor don't count — they're typically
 * in-progress work on the prerelease Nexus, not actionable upgrade targets,
 * and reporting them as `skip-major` is noise (e.g. current=25.0.0 stable
 * with only 25.1.0-alpha1 available upstream is effectively up-to-date).
 */
export function hasOutOfScopeNewer(current: string, candidates: string[]): boolean {
    const cur = coerceParse(current);
    if (!cur) return false;
    return candidates.map(coerceParse).some(
        (sv) =>
            sv !== null &&
            sv.prerelease.length === 0 &&
            semver.gt(sv, cur) &&
            (sv.major !== cur.major || sv.minor !== cur.minor),
    );
}
