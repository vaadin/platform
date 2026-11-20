import { ExtraEdit, supportedBranchesEdit, trainConstantEdit } from "./bump.js";
import { Train, belongsToTrain } from "./version.js";

/**
 * versions.json product key -> GitHub repo under `vaadin/`. The keys are Maven
 * artifact-ish names and rarely match the repo, so this cannot be derived.
 * Several products may share a repo (mpr-v7/mpr-v8 are modules of one build).
 */
export const PRODUCT_REPOS: Readonly<Record<string, string>> = {
    "browserless-test": "browserless-test",
    flow: "flow",
    "flow-components": "flow-components",
    hilla: "hilla",
    "mpr-v7": "multiplatform-runtime-internal",
    "mpr-v8": "multiplatform-runtime-internal",
    copilot: "copilot-internal",
    "observability-kit-starter": "observability-kit",
    "vaadin-collaboration-engine": "collaboration-kit",
    "vaadin-testbench": "testbench",
    "vaadin-core": "vaadin-core",
};

/**
 * Repos that come along with a product but are not named in versions.json:
 * `vaadin/vaadin` (the `@vaadin/vaadin` npm meta-package) is released in
 * lockstep with `vaadin/vaadin-core`.
 */
export const COMPANION_REPOS: Readonly<Record<string, readonly string[]>> = {
    "vaadin-core": ["vaadin"],
};

/**
 * npm meta-package repos: their package.json version is written by the release
 * process itself, so `main` never carries a SNAPSHOT. This job only cuts the
 * X.Y branch there; no bump PR.
 */
export const BRANCH_ONLY_REPOS: ReadonlySet<string> = new Set(["vaadin-core", "vaadin"]);

/**
 * Products on the train that this job deliberately does not branch or bump,
 * with the reason shown in the report.
 */
export const EXCLUDED_PRODUCTS: Readonly<Record<string, string>> = {
    "vaadin-feature-pack": "feature-pack-internal is branched and bumped by hand",
};

/** Edits the generic literal/property rules cannot find, keyed by repo. */
export const EXTRA_EDITS: Readonly<Record<string, readonly ExtraEdit[]>> = {
    "collaboration-kit": [trainConstantEdit("/CollaborationEngine.java", "COLLABORATION_ENGINE_VERSION")],
    // The shared branch list read by check-versions, bump-spring-boot and the
    // license-checker audit: the new maintenance branch joins it with the bump.
    platform: [supportedBranchesEdit("/.github/supported-branches.json")],
};

/**
 * Order the bump PRs should be merged in (branch-only repos get no PR): a downstream repo's CI resolves the
 * upstream X.(Y+1)-SNAPSHOT, which only exists once upstream's bump is merged
 * and its snapshot published.
 */
export const MERGE_ORDER: readonly (readonly string[])[] = [
    ["flow"],
    ["flow-components", "hilla", "testbench"],
    ["browserless-test", "copilot-internal", "collaboration-kit", "observability-kit", "multiplatform-runtime-internal"],
    ["platform"],
];

export interface Selection {
    /** Repos to process, `platform` first, de-duplicated. */
    repos: string[];
    /** Products on the train with no repo mapping -- surfaced, never dropped silently. */
    unmapped: string[];
    /** Products on the train skipped on purpose, with the reason. */
    excluded: { product: string; reason: string }[];
}

type VersionsJson = Record<string, unknown>;

/**
 * Pick the repos on the train from platform's versions.json: every product
 * whose version is a prerelease or SNAPSHOT of `X.Y`, or the `{{version}}`
 * placeholder (released with platform itself). Platform is always included.
 */
export function selectRepos(versions: VersionsJson, train: Train): Selection {
    const onTrain: string[] = [];
    for (const [section, entries] of Object.entries(versions)) {
        if (section === "platform" || entries === null || typeof entries !== "object") continue;
        for (const [product, raw] of Object.entries(entries as Record<string, unknown>)) {
            if (raw === null || typeof raw !== "object") continue;
            const entry = raw as Record<string, unknown>;
            const values = ["javaVersion", "version", "jsVersion"]
                .map((k) => entry[k])
                .filter((v): v is string => typeof v === "string");
            if (values.some((v) => v === "{{version}}" || belongsToTrain(v, train))) onTrain.push(product);
        }
    }

    const repos = ["platform"];
    const unmapped: string[] = [];
    const excluded: { product: string; reason: string }[] = [];
    for (const product of onTrain.sort()) {
        if (EXCLUDED_PRODUCTS[product]) {
            excluded.push({ product, reason: EXCLUDED_PRODUCTS[product] });
            continue;
        }
        const repo = PRODUCT_REPOS[product];
        if (!repo) {
            unmapped.push(product);
            continue;
        }
        for (const r of [repo, ...(COMPANION_REPOS[product] ?? [])]) {
            if (!repos.includes(r)) repos.push(r);
        }
    }
    return { repos, unmapped, excluded };
}
