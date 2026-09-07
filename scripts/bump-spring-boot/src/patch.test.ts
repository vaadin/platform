import test from "node:test";
import assert from "node:assert/strict";
import { pickLatestPatch, hasOutOfScopeNewer } from "./patch.js";

// Mirrors the real Maven Central listing for spring-boot-starter-parent,
// including the 4.2.0-M1 milestone that `<latest>` and `<release>` point at.
const CENTRAL = [
    "2.7.17",
    "2.7.18",
    "3.4.9",
    "3.5.14",
    "3.5.15",
    "3.5.16",
    "4.0.0-M1",
    "4.0.0-RC1",
    "4.0.0",
    "4.0.7",
    "4.0.8",
    "4.1.0-RC1",
    "4.1.0",
    "4.1.1",
    "4.2.0-M1",
];

test("bumps to the newest patch on the same minor line", () => {
    assert.equal(pickLatestPatch("4.1.0", CENTRAL), "4.1.1");
    assert.equal(pickLatestPatch("4.0.7", CENTRAL), "4.0.8");
});

test("returns null when already on the newest patch", () => {
    assert.equal(pickLatestPatch("4.1.1", CENTRAL), null);
    assert.equal(pickLatestPatch("4.0.8", CENTRAL), null);
});

test("never crosses a minor boundary", () => {
    // 4.2.0-M1 exists and is what maven-metadata.xml calls <latest>.
    assert.equal(pickLatestPatch("4.1.1", [...CENTRAL, "4.2.0"]), null);
    assert.equal(pickLatestPatch("4.0.8", CENTRAL), null, "must not jump 4.0.x -> 4.1.x");
});

test("never crosses a major boundary", () => {
    assert.equal(pickLatestPatch("3.5.16", CENTRAL), null, "must not jump 3.5.x -> 4.x");
    assert.equal(pickLatestPatch("2.7.18", CENTRAL), null, "must not jump 2.7.x -> 3.x");
});

test("never selects a prerelease", () => {
    assert.equal(pickLatestPatch("4.0.0", ["4.0.0", "4.0.1-M1", "4.0.1-RC1"]), null);
    assert.equal(pickLatestPatch("4.0.0", ["4.0.0", "4.0.1-M1", "4.0.1"]), "4.0.1");
});

test("resolves the older maintenance lines against their own minor", () => {
    assert.equal(pickLatestPatch("3.5.15", CENTRAL), "3.5.16");
    assert.equal(pickLatestPatch("2.7.17", CENTRAL), "2.7.18");
});

test("never moves backwards", () => {
    assert.equal(pickLatestPatch("4.1.5", CENTRAL), null);
});

test("leaves a hand-pinned prerelease alone", () => {
    assert.equal(pickLatestPatch("4.0.0-M1", CENTRAL), null);
});

test("ignores unparseable candidates instead of failing", () => {
    assert.equal(pickLatestPatch("4.1.0", ["4.1.1", "not-a-version", ""]), "4.1.1");
});

test("throws on an unparseable current version", () => {
    assert.throws(() => pickLatestPatch("banana", CENTRAL), /parseable semver/);
});

test("hasOutOfScopeNewer reports bigger upgrades without selecting them", () => {
    assert.equal(hasOutOfScopeNewer("4.1.1", CENTRAL), false, "4.2.0-M1 is a prerelease");
    assert.equal(hasOutOfScopeNewer("4.1.1", [...CENTRAL, "4.2.0"]), true);
    assert.equal(hasOutOfScopeNewer("3.5.16", CENTRAL), true, "4.x exists");
    assert.equal(hasOutOfScopeNewer("4.0.8", CENTRAL), true, "4.1.x exists");
});
