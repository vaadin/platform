/**
 * Maps versions.json module key to Maven artifactId.
 * Add an entry here whenever a module's Maven artifactId differs from
 * its versions.json key.
 *
 *   string  -> use as artifactId at com/vaadin/<value>
 *   "skip"  -> deprecated alias for SKIP_MODULES below; kept for back-compat
 */
export const ARTIFACT_ID_OVERRIDES: Record<string, string | "skip"> = {
    "flow-cdi": "vaadin-cdi",
    "vaadin-license-checker": "license-checker",
    "vaadin-collaboration-engine": "collaboration-engine",
    "swing-kit": "vaadin-swing-kit-flow",
    "vaadin-feature-pack": "vaadin-feature-pack-flow",
    "vaadin-testbench": "vaadin-testbench-core",
};

/**
 * Modules whose version checking should be skipped entirely.
 *
 * Use this when a module:
 *   - Is pinned for a reason (compatibility, downstream constraint, ongoing
 *     bug investigation) and should NOT auto-bump even within its maintenance
 *     line.
 *   - Lives on a private/authenticated Maven repo we can't reach.
 *   - Is being held back deliberately for the current platform release.
 *
 * Effect: both the Maven AND npm checks for that module are skipped, the line
 * is reported as `skip-listed`, and the module's `javaVersion` / `jsVersion`
 * in `versions.json` is left untouched.
 *
 * Same effect at the command line: `--skip <moduleKey>` (repeatable).
 */
export const SKIP_MODULES: ReadonlySet<string> = new Set<string>([
    // Add module keys here, one per line, with a brief comment explaining why.
    // Example:
    // "vaadin-quarkus",   // pinned to 3.1.1 until quarkus 4.x upgrade lands
]);

/**
 * Per-module blocklist of specific upstream versions.
 *
 * Use this when an individual published release is known-bad / withdrawn /
 * intentionally avoided, but the rest of the module's release line should
 * still be checked normally.
 *
 *   key   = versions.json module key (e.g. "kubernetes-kit-starter")
 *   value = list of upstream version strings to remove from the candidate
 *           pool before the maintenance picker runs.
 *
 * Effect: matching versions are filtered out of the Maven/npm response *as
 * if they had never been published*. The picker never sees them. Any line
 * the script proposes is reported with a "(blocklisted N)" suffix when at
 * least one upstream version was filtered for that module.
 *
 * Same effect at the command line: `--skip-version <moduleKey>=<version>`
 * (repeatable).
 */
export const VERSION_BLOCKLIST: Record<string, readonly string[]> = {
    // Add per-module entries here. Examples:
    "kubernetes-kit-starter": ["25.1.0-rc1"],   // known-bad RC, skip
    "sso-kit-starter": ["25.1.0-rc1"],   // known-bad RC, skip
    // "flow":                   ["25.2.0-alpha9"], // withdrawn release
};
