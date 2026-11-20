import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import {
    isRetryableStatus,
    newestStablePerLine,
    parseManagedVersion,
    parseRetryAfter,
    parseSpringDataBomVersion,
    parseVersions,
    readVersionsFile,
    retryDelayMs,
} from "./maven.js";

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

test("parseVersions handles one or many <version> elements and keeps them strings", () => {
    const xml = (vs: string[]) =>
        `<metadata><versioning><versions>${vs.map((v) => `<version>${v}</version>`).join("")}</versions></versioning></metadata>`;
    assert.deepEqual(parseVersions(xml(["4.1.0", "4.2.0-RC2"])), ["4.1.0", "4.2.0-RC2"]);
    assert.deepEqual(parseVersions(xml(["4.10"])), ["4.10"], "must not be coerced to the number 4.1");
    assert.throws(() => parseVersions("<metadata/>"), /No versions/);
});

test("newestStablePerLine keeps the newest stable release of each 3.x+ line", () => {
    const lines = newestStablePerLine(["2.7.18", "3.5.15", "3.5.16", "4.1.3", "4.2.0-RC2", "4.2.0", "4.3.0-M1"]);
    assert.deepEqual(Object.fromEntries(lines), { "3.5": "3.5.16", "4.1": "4.1.3", "4.2": "4.2.0" });
});

// Trimmed from the real spring-boot-dependencies-4.2.0.pom and spring-data-bom-2026.1.0.pom.
const BOOT_DEPS = `<project>
  <properties>
    <spring-batch.version>6.1.0</spring-batch.version>
    <spring-data-bom.version>2026.1.0</spring-data-bom.version>
  </properties>
</project>`;

const DATA_BOM = `<project>
  <version>2026.1.0</version>
  <properties><commons.version>4.2.0</commons.version></properties>
  <dependencyManagement><dependencies>
    <dependency><groupId>org.springframework.data</groupId><artifactId>spring-data-commons</artifactId><version>4.2.0</version></dependency>
    <dependency><groupId>org.springframework.data</groupId><artifactId>spring-data-jpa</artifactId><version>4.2.0</version></dependency>
  </dependencies></dependencyManagement>
</project>`;

test("reads the Spring Data train pinned by spring-boot-dependencies", () => {
    assert.equal(parseSpringDataBomVersion(BOOT_DEPS), "2026.1.0");
    assert.throws(() => parseSpringDataBomVersion("<project><properties/></project>"), /no spring-data-bom/);
});

test("reads the spring-data-commons version managed by spring-data-bom", () => {
    assert.equal(parseManagedVersion(DATA_BOM, "spring-data-commons"), "4.2.0");
    assert.equal(parseManagedVersion(DATA_BOM.replace(">4.2.0</version></dependency>", ">${commons.version}</version></dependency>"), "spring-data-commons"), "4.2.0");
    assert.equal(parseManagedVersion(DATA_BOM.replace(">4.2.0</version></dependency>", ">${project.version}</version></dependency>"), "spring-data-commons"), "2026.1.0");
    assert.throws(() => parseManagedVersion(DATA_BOM, "spring-data-nope"), /manages no version/);
});

test("readVersionsFile accepts only the shape fetch-versions writes", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bump-sb-"));
    const write = (name: string, body: unknown) => {
        const f = path.join(dir, name);
        fs.writeFileSync(f, typeof body === "string" ? body : JSON.stringify(body));
        return f;
    };
    const good = {
        springBoot: ["4.2.0", "4.1.3"],
        springData: { "4.2": { springBoot: "4.2.0", springDataBom: "2026.1.0", springDataCommons: "4.2.0" } },
    };
    try {
        assert.deepEqual(readVersionsFile(write("ok.json", good)), good);
        assert.throws(() => readVersionsFile(write("old.json", ["4.2.0"])), /shape/, "the old bare-array format");
        assert.throws(() => readVersionsFile(write("empty.json", { ...good, springBoot: [] })), /shape/);
        assert.throws(
            () => readVersionsFile(write("entry.json", { ...good, springData: { "4.2": { springBoot: "4.2.0" } } })),
            /shape/,
        );
        assert.throws(() => readVersionsFile(write("bad.json", "[")), /Could not read/);
        assert.throws(() => readVersionsFile(path.join(dir, "missing.json")), /Could not read/);
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
