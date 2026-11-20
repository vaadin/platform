import { test } from "node:test";
import assert from "node:assert/strict";
import { MERGE_ORDER, PRODUCT_REPOS, selectRepos } from "./repos.js";
import { parseTrain } from "./version.js";

// Trimmed copy of platform's versions.json as of the 25.4.0-beta1 release.
const VERSIONS = {
    core: {
        "browserless-test": { javaVersion: "25.4.0-beta1" },
        flow: { javaVersion: "25.4.0-beta1" },
        "flow-components": { javaVersion: "{{version}}" },
        hilla: { javaVersion: "25.4.0-beta1" },
        "mpr-v7": { javaVersion: "25.4.0-beta1" },
        "mpr-v8": { javaVersion: "25.4.0-beta1" },
        "vaadin-router": { jsVersion: "2.0.1", npmName: "@vaadin/router" },
    },
    kits: {
        "appsec-kit-starter": { javaVersion: "4.1.1" },
        copilot: { javaVersion: "25.4.0-beta2" },
        "observability-kit-starter": { javaVersion: "25.4.0-beta1" },
        "sso-kit-starter": { javaVersion: "4.2.0", jsVersion: "4.2.0" },
        "vaadin-collaboration-engine": { javaVersion: "25.4.0-beta1" },
        "brand-new-kit": { javaVersion: "25.4.0-beta1" },
    },
    platform: "{{version}}",
    vaadin: {
        "vaadin-core": { jsVersion: "{{version}}", npmName: "@vaadin/vaadin-core" },
        "vaadin-designer": { pro: true },
        "vaadin-feature-pack": { javaVersion: "25.4.0-beta1" },
        "vaadin-license-checker": { javaVersion: "3.1.5" },
        "vaadin-testbench": { javaVersion: "25.4.0-beta2", pro: true },
    },
};

test("selects the train's repos, platform first, mpr once", () => {
    const sel = selectRepos(VERSIONS, parseTrain("25.4"));
    assert.equal(sel.repos[0], "platform");
    assert.deepEqual([...sel.repos].sort(), [
        "browserless-test",
        "collaboration-kit",
        "copilot-internal",
        "flow",
        "flow-components",
        "hilla",
        "multiplatform-runtime-internal",
        "observability-kit",
        "platform",
        "testbench",
    ]);
});

test("reports unmapped and excluded products instead of dropping them", () => {
    const sel = selectRepos(VERSIONS, parseTrain("25.4"));
    assert.deepEqual(sel.unmapped, ["brand-new-kit"]);
    assert.deepEqual(
        sel.excluded.map((e) => e.product),
        ["vaadin-core", "vaadin-feature-pack"],
    );
});

test("another train selects only platform and {{version}} products", () => {
    const sel = selectRepos(VERSIONS, parseTrain("25.5"));
    assert.deepEqual(sel.repos, ["platform", "flow-components"]);
});

test("every mapped repo appears in the merge order exactly once", () => {
    const ordered = MERGE_ORDER.flat();
    for (const repo of new Set([...Object.values(PRODUCT_REPOS), "platform"])) {
        assert.equal(ordered.filter((r) => r === repo).length, 1, repo);
    }
});
