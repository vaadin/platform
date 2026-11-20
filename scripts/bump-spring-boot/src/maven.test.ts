import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { isRetryableStatus, parseRetryAfter, parseVersions, readVersionsFile, retryDelayMs } from "./maven.js";

test("retries throttling, outages and CDN 404s, not other client errors", () => {
    for (const s of [404, 408, 429, 500, 502, 503]) assert.equal(isRetryableStatus(s), true, String(s));
    for (const s of [400, 401, 403, 410]) assert.equal(isRetryableStatus(s), false, String(s));
});

test("parses Retry-After as seconds or an HTTP date", () => {
    assert.equal(parseRetryAfter("7"), 7000);
    const now = Date.parse("2026-11-20T07:00:00Z");
    assert.equal(parseRetryAfter("Fri, 20 Nov 2026 07:00:10 GMT", now), 10_000);
    assert.equal(parseRetryAfter("Fri, 20 Nov 2026 06:59:00 GMT", now), 0);
    assert.equal(parseRetryAfter(null), null);
    assert.equal(parseRetryAfter("soon"), null);
});

test("backs off with bounded jitter, and Retry-After wins", () => {
    assert.equal(retryDelayMs(1, null, () => 0), 2000);
    assert.equal(retryDelayMs(1, null, () => 1), 3000);
    assert.equal(retryDelayMs(3, null, () => 0), 15_000);
    assert.equal(retryDelayMs(9, null, () => 0), 30_000, "stays on the last step");
    assert.equal(retryDelayMs(1, 8000, () => 0), 8000);
    assert.equal(retryDelayMs(1, 3_600_000, () => 0), 60_000, "capped");
});

test("parseVersions handles one or many <version> elements", () => {
    const xml = (vs: string[]) =>
        `<metadata><versioning><versions>${vs.map((v) => `<version>${v}</version>`).join("")}</versions></versioning></metadata>`;
    assert.deepEqual(parseVersions(xml(["4.1.0", "4.2.0-RC2"])), ["4.1.0", "4.2.0-RC2"]);
    assert.deepEqual(parseVersions(xml(["4.1"])), ["4.1"]);
    assert.throws(() => parseVersions("<metadata/>"), /No versions/);
});

test("readVersionsFile accepts only a non-empty string array", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bump-sb-"));
    const write = (name: string, body: string) => {
        const f = path.join(dir, name);
        fs.writeFileSync(f, body);
        return f;
    };
    try {
        assert.deepEqual(readVersionsFile(write("ok.json", '["4.2.0","4.1.3"]')), ["4.2.0", "4.1.3"]);
        assert.throws(() => readVersionsFile(write("empty.json", "[]")), /non-empty/);
        assert.throws(() => readVersionsFile(write("nums.json", "[4.2]")), /non-empty/);
        assert.throws(() => readVersionsFile(write("bad.json", "[")), /Could not read/);
        assert.throws(() => readVersionsFile(path.join(dir, "missing.json")), /Could not read/);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
