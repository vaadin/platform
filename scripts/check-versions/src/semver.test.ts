import { strict as assert } from "node:assert";
import { test } from "node:test";
import { hasOutOfScopeNewer, pickMaintenance } from "./semver.js";

test("stable: same minor, highest patch", () => {
    assert.equal(
        pickMaintenance("16.0.1", ["16.0.1", "16.0.2", "16.1.0", "17.0.0"]),
        "16.0.2",
    );
});

test("prerelease: stable in same minor wins", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha12", [
            "25.2.0-alpha11",
            "25.2.0-alpha12",
            "25.2.0-alpha13",
            "25.2.0",
        ]),
        "25.2.0",
    );
});

test("prerelease: no stable -> highest prerelease for same base", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha12", [
            "25.2.0-alpha11",
            "25.2.0-alpha12",
            "25.2.0-alpha13",
        ]),
        "25.2.0-alpha13",
    );
});

test("prerelease: stable patch in same minor allowed (Z bump ok); minor bump rejected", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha12", ["25.2.1", "25.3.0"]),
        "25.2.1",
    );
});

test("prerelease: no in-scope upgrade", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha12", ["25.3.0-alpha1"]),
        null,
    );
});

test("stable: no upgrade returns null (avoid no-op)", () => {
    assert.equal(pickMaintenance("16.0.1", ["16.0.1"]), null);
});

test("stable: major/minor bumps ignored", () => {
    assert.equal(
        pickMaintenance("3.1.1", ["3.1.0", "3.1.1", "3.2.0", "4.0.0"]),
        null,
    );
});

test("prerelease: alpha -> beta within same X.Y.Z allowed", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha12", ["25.2.0-alpha12", "25.2.0-beta1"]),
        "25.2.0-beta1",
    );
});

test("prerelease: alphaN numeric ordering — alpha12 > alpha9 (not lex)", () => {
    // Real registry data for @vaadin/a11y-base: alpha1..alpha12 all exist.
    // The picker must return null (alpha12 is already the highest), not "downgrade" to alpha9.
    const candidates = Array.from({ length: 12 }, (_, i) => `25.2.0-alpha${i + 1}`);
    assert.equal(pickMaintenance("25.2.0-alpha12", candidates), null);
});

test("prerelease: alphaN numeric ordering — picks highest alpha by integer suffix", () => {
    assert.equal(
        pickMaintenance("25.2.0-alpha9", [
            "25.2.0-alpha9",
            "25.2.0-alpha10",
            "25.2.0-alpha11",
            "25.2.0-alpha12",
        ]),
        "25.2.0-alpha12",
    );
});

test("hasOutOfScopeNewer: stable newer minor counts", () => {
    assert.equal(hasOutOfScopeNewer("25.0.0", ["25.0.0", "25.1.0"]), true);
});

test("hasOutOfScopeNewer: prerelease of newer minor does NOT count", () => {
    // vaadin-feature-pack case: current 25.0.0 stable, only 25.1.0-alpha1 upstream.
    // The alpha is in-progress work — should not be flagged as skip-major.
    assert.equal(hasOutOfScopeNewer("25.0.0", ["25.0.0", "25.1.0-alpha1"]), false);
});

test("hasOutOfScopeNewer: prerelease of newer major does NOT count", () => {
    assert.equal(hasOutOfScopeNewer("3.1.1", ["3.1.1", "25.1.0-rc1"]), false);
});

test("hasOutOfScopeNewer: stable newer major counts", () => {
    assert.equal(hasOutOfScopeNewer("3.1.1", ["3.1.1", "4.0.0"]), true);
});
