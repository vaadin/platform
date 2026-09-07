import semver from "semver";

/**
 * Pick the newest patch release on the same major.minor line as `current`.
 *
 * Deliberately narrow: this job exists to keep maintenance branches on their
 * own Spring Boot line, so anything that changes major or minor is out of
 * scope and needs human review.
 *
 * Two filters matter, and both have bitten this in practice:
 *
 *  - Same major.minor only. Branches sit on different lines (25.x -> 4.x,
 *    24.x -> 3.5.x, 23.x -> 2.7.x), so the branch's current value is the
 *    anchor, never "whatever is newest overall".
 *  - Stable only. `spring-boot-starter-parent`'s maven-metadata.xml reports
 *    `<latest>`/`<release>` as `4.2.0-M1` at the time of writing -- a
 *    milestone of a different minor. Trusting either field would bump every
 *    branch onto a prerelease of the wrong line.
 *
 * @returns the version to move to, or `null` when already up to date.
 */
export function pickLatestPatch(current: string, candidates: string[]): string | null {
    const cur = semver.parse(current);
    if (!cur) throw new Error(`Not a parseable semver version: ${JSON.stringify(current)}`);

    // A prerelease current value means someone pinned a milestone by hand;
    // picking a "newer stable patch" for them would silently undo that choice.
    if (cur.prerelease.length > 0) return null;

    const best = candidates
        .map((v) => semver.parse(v))
        .filter((sv): sv is semver.SemVer => sv !== null)
        .filter((sv) => sv.major === cur.major && sv.minor === cur.minor)
        .filter((sv) => sv.prerelease.length === 0)
        .sort(semver.rcompare)[0];

    return best && semver.gt(best, cur) ? best.version : null;
}

/**
 * Whether a newer major/minor exists beyond what `pickLatestPatch` will take.
 * Purely informational -- surfaced in the PR body so a human knows a bigger
 * upgrade is waiting, without this job ever attempting it.
 */
export function hasOutOfScopeNewer(current: string, candidates: string[]): boolean {
    const cur = semver.parse(current);
    if (!cur) return false;
    return candidates.some((v) => {
        const sv = semver.parse(v);
        if (!sv || sv.prerelease.length > 0) return false;
        return sv.major > cur.major || (sv.major === cur.major && sv.minor > cur.minor);
    });
}
