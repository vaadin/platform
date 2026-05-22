import { strict as assert } from "node:assert";
import { test } from "node:test";
import { checkStability, classifyTier, renderStabilityMarkdown } from "./stability.js";
import { VersionsJson } from "./versionsJson.js";

function build(modules: Record<string, Record<string, string>>): VersionsJson {
    // Place everything in a single `core` section — the iterator doesn't care
    // which section a module is in, only its name.
    return { core: modules };
}

test("classifyTier: stable releases", () => {
    assert.equal(classifyTier("24.10.6"), "stable");
    assert.equal(classifyTier("16.0.1"), "stable");
    assert.equal(classifyTier("7.1.0"), "stable");
});

test("classifyTier: prereleases", () => {
    assert.equal(classifyTier("25.2.0-alpha1"), "alpha");
    assert.equal(classifyTier("25.2.0-alpha12"), "alpha");
    assert.equal(classifyTier("25.2.0-beta3"), "beta");
    assert.equal(classifyTier("25.2.0-rc1"), "rc");
});

test("classifyTier: snapshots and junk", () => {
    assert.equal(classifyTier("{{version}}"), null);
    assert.equal(classifyTier("25.2.0-SNAPSHOT"), null);
    assert.equal(classifyTier("not-a-version"), null);
});

test("anchors all stable, alpha module flagged", () => {
    const data = build({
        flow: { javaVersion: "24.10.6" },
        hilla: { javaVersion: "24.10.6" },
        copilot: { javaVersion: "24.10.5" },
        "mpr-v8": { javaVersion: "7.1.0-alpha1" },
        accordion: { javaVersion: "24.10.6" },
    });
    const r = checkStability(data);
    assert.equal(r.floor, "stable");
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].name, "mpr-v8");
    assert.equal(r.violations[0].tier, "alpha");
    assert.equal(r.violations[0].field, "javaVersion");
});

test("anchors all alpha, alpha modules are fine", () => {
    const data = build({
        flow: { javaVersion: "25.2.0-alpha13" },
        hilla: { javaVersion: "25.2.0-alpha9" },
        copilot: { javaVersion: "25.2.0-alpha8" },
        accordion: { jsVersion: "25.2.0-alpha13" },
    });
    const r = checkStability(data);
    assert.equal(r.floor, "alpha");
    assert.equal(r.violations.length, 0);
});

test("anchors mixed (floor = weakest tier)", () => {
    // floor is beta (the strongest among the three would be stable, but MIN
    // takes the weakest — beta).
    const data = build({
        flow: { javaVersion: "25.2.0" },
        hilla: { javaVersion: "25.2.0-beta1" },
        copilot: { javaVersion: "25.2.0" },
        "kit-a": { javaVersion: "25.2.0-alpha2" }, // below beta -> violation
        "kit-b": { javaVersion: "25.2.0-beta3" },  // at beta -> ok
        "kit-c": { javaVersion: "25.2.0-rc1" },    // above beta -> ok
    });
    const r = checkStability(data);
    assert.equal(r.floor, "beta");
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].name, "kit-a");
});

test("anchors all stable, independent stable version line passes", () => {
    // flow-cdi lives on its own version line; 15.2.2 is stable, so even
    // when anchors are stable it should not be flagged.
    const data = build({
        flow: { javaVersion: "24.10.6" },
        hilla: { javaVersion: "24.10.6" },
        copilot: { javaVersion: "24.10.6" },
        "flow-cdi": { javaVersion: "15.2.2" },
        "vaadin-testbench": { javaVersion: "9.6.0" },
    });
    const r = checkStability(data);
    assert.equal(r.violations.length, 0);
});

test("snapshot and {{version}} values are skipped", () => {
    const data = build({
        flow: { javaVersion: "24.10.6" },
        hilla: { javaVersion: "24.10.6" },
        copilot: { javaVersion: "24.10.6" },
        accordion: { javaVersion: "{{version}}", jsVersion: "24.10.6" },
        weird: { javaVersion: "1.0.0-SNAPSHOT" },
    });
    const r = checkStability(data);
    assert.equal(r.violations.length, 0);
});

test("only one anchor present (14.14 case)", () => {
    // 14.14 has only `flow`, no hilla or copilot. Floor follows whatever is
    // present.
    const data = build({
        flow: { javaVersion: "2.13.5" },
        "some-module": { javaVersion: "2.13.5-alpha1" },
    });
    const r = checkStability(data);
    assert.equal(r.anchors.length, 1);
    assert.equal(r.floor, "stable");
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].name, "some-module");
});

test("no anchors at all -> floor is null, no violations", () => {
    const data = build({
        "some-module": { javaVersion: "1.0.0-alpha1" },
    });
    const r = checkStability(data);
    assert.equal(r.floor, null);
    assert.equal(r.violations.length, 0);
});

test("jsVersion is also checked", () => {
    const data = build({
        flow: { javaVersion: "24.10.6" },
        hilla: { javaVersion: "24.10.6" },
        copilot: { javaVersion: "24.10.6" },
        accordion: { jsVersion: "24.10.6-alpha1", javaVersion: "{{version}}" },
    });
    const r = checkStability(data);
    assert.equal(r.violations.length, 1);
    assert.equal(r.violations[0].field, "jsVersion");
});

test("renderStabilityMarkdown: empty when no violations", () => {
    const md = renderStabilityMarkdown({ anchors: [], floor: null, violations: [] });
    assert.equal(md, "");
});

test("renderStabilityMarkdown: includes anchors, violations, and floor", () => {
    const md = renderStabilityMarkdown({
        anchors: [
            { name: "flow", version: "24.10.6", tier: "stable" },
            { name: "hilla", version: "24.10.6", tier: "stable" },
            { name: "copilot", version: "24.10.5", tier: "stable" },
        ],
        floor: "stable",
        violations: [
            {
                section: "core",
                name: "mpr-v8",
                field: "javaVersion",
                version: "7.1.0-alpha1",
                tier: "alpha",
            },
        ],
    });
    assert.match(md, /Stability check warnings/);
    assert.match(md, /flow.*24\.10\.6/);
    assert.match(md, /mpr-v8.*7\.1\.0-alpha1/);
    assert.match(md, /stable/);
});
