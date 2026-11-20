import { test } from "node:test";
import assert from "node:assert/strict";
import {
    bumpPomProperties,
    bumpVersionsJson,
    isPomFile,
    isSkippedFile,
    readProjectVersion,
    supportedBranchesEdit,
    replaceSnapshotLiteral,
    trainConstantEdit,
    withVersionPropertiesMasked,
} from "./bump.js";
import { parseTrain } from "./version.js";

const T = parseTrain("25.4");

test("replaceSnapshotLiteral replaces whole tokens only", () => {
    const input = [
        "<version>25.4-SNAPSHOT</version>",
        "vaadinVersion=25.4-SNAPSHOT",
        'FALLBACK_VERSION = "25.4-SNAPSHOT"',
        "<version>125.4-SNAPSHOT</version>",
        "<version>1.25.4-SNAPSHOT</version>",
        "<version>25.40-SNAPSHOT</version>",
        "<version>25.4-SNAPSHOTS</version>",
    ].join("\r\n");
    const { text, count } = replaceSnapshotLiteral(input, T);
    assert.equal(count, 3);
    assert.equal(
        text,
        [
            "<version>25.5-SNAPSHOT</version>",
            "vaadinVersion=25.5-SNAPSHOT",
            'FALLBACK_VERSION = "25.5-SNAPSHOT"',
            "<version>125.4-SNAPSHOT</version>",
            "<version>1.25.4-SNAPSHOT</version>",
            "<version>25.40-SNAPSHOT</version>",
            "<version>25.4-SNAPSHOTS</version>",
        ].join("\r\n"),
    );
});

test("bumpPomProperties moves train prereleases to the next SNAPSHOT", () => {
    const pom = `<properties>
        <flow.version>25.4.0-beta1</flow.version>
        <testbench.version>25.4.0-alpha2</testbench.version>
        <hilla.version> 25.4.0-rc1 </hilla.version>
        <spring.boot.version>4.1.1</spring.boot.version>
        <old.version>25.3.0-beta1</old.version>
        <released.version>25.4.0</released.version>
        <snap.version>25.4-SNAPSHOT</snap.version>
    </properties>`;
    const { text, changes } = bumpPomProperties(pom, T, "pom.xml");
    assert.match(text, /<flow\.version>25\.5-SNAPSHOT<\/flow\.version>/);
    assert.match(text, /<testbench\.version>25\.5-SNAPSHOT<\/testbench\.version>/);
    assert.match(text, /<hilla\.version> 25\.5-SNAPSHOT <\/hilla\.version>/);
    assert.match(text, /<spring\.boot\.version>4\.1\.1</);
    assert.match(text, /<old\.version>25\.3\.0-beta1</);
    assert.match(text, /<released\.version>25\.4\.0</);
    assert.match(text, /<snap\.version>25\.4-SNAPSHOT</, "SNAPSHOTs are the literal rule's job");
    assert.deepEqual(
        changes.map((c) => `${c.property}:${c.from}`),
        ["flow.version:25.4.0-beta1", "testbench.version:25.4.0-alpha2", "hilla.version:25.4.0-rc1"],
    );
});

test("withVersionPropertiesMasked moves the project version but not dependency properties", () => {
    const pom = `<project>
    <version>25.4-SNAPSHOT</version>
    <properties>
        <flow.version>25.4-SNAPSHOT</flow.version>
        <testbench.version>25.4.0-beta2</testbench.version>
    </properties>
    <dependency><version>25.4-SNAPSHOT</version></dependency>
</project>`;
    let count = 0;
    const out = withVersionPropertiesMasked(pom, (t) => {
        const r = replaceSnapshotLiteral(t, T);
        count = r.count;
        return r.text;
    });
    assert.equal(count, 2);
    assert.equal(
        out,
        pom
            .replace("<version>25.4-SNAPSHOT</version>\n    <properties>", "<version>25.5-SNAPSHOT</version>\n    <properties>")
            .replace("<dependency><version>25.4-SNAPSHOT</version>", "<dependency><version>25.5-SNAPSHOT</version>"),
    );
    assert.match(out, /<flow\.version>25\.4-SNAPSHOT<\/flow\.version>/);
});

test("bumpVersionsJson touches only Java versions on the train and keeps formatting", () => {
    const input = `{
    "core": {
        "flow": {
            "javaVersion": "25.4.0-beta1"
        },
        "flow-components": {
            "javaVersion": "{{version}}"
        },
        "hilla": {
            "javaVersion": "25.4-SNAPSHOT"
        },
        "vaadin-router": {
            "jsVersion": "2.0.1",
            "npmName": "@vaadin/router"
        }
    },
    "kits": {
        "azure-kit": {
            "version": "25.4.0-alpha3"
        },
        "sso-kit-starter": {
            "javaVersion": "4.2.0",
            "jsVersion": "4.2.0"
        },
        "web": {
            "jsVersion": "25.4.0-beta1"
        }
    },
    "platform": "{{version}}"
}
`;
    const { text, changes } = bumpVersionsJson(input, T);
    assert.deepEqual(
        changes.map((c) => `${c.property}:${c.from}`),
        ["flow.javaVersion:25.4.0-beta1", "hilla.javaVersion:25.4-SNAPSHOT", "azure-kit.version:25.4.0-alpha3"],
    );
    const expected = input
        .replace('"javaVersion": "25.4.0-beta1"', '"javaVersion": "25.5-SNAPSHOT"')
        .replace('"javaVersion": "25.4-SNAPSHOT"', '"javaVersion": "25.5-SNAPSHOT"')
        .replace('"version": "25.4.0-alpha3"', '"version": "25.5-SNAPSHOT"');
    assert.equal(text, expected);
    assert.doesNotThrow(() => JSON.parse(text));
});

test("bumpVersionsJson leaves skipped products alone", () => {
    const input = `{ "vaadin": { "vaadin-feature-pack": { "javaVersion": "25.4.0-beta1" }, "flow": { "javaVersion": "25.4.0-beta1" } } }`;
    const { text, changes } = bumpVersionsJson(input, T, new Set(["vaadin-feature-pack"]));
    assert.deepEqual(changes.map((c) => c.property), ["flow.javaVersion"]);
    assert.match(text, /"vaadin-feature-pack": \{ "javaVersion": "25\.4\.0-beta1" \}/);
});

test("trainConstantEdit bumps the collaboration-kit constant", () => {
    const edit = trainConstantEdit("/CollaborationEngine.java", "COLLABORATION_ENGINE_VERSION");
    const src = 'static final String COLLABORATION_ENGINE_VERSION = "25.4";\nString OTHER = "25.4";';
    assert.equal(edit.apply(src, T), 'static final String COLLABORATION_ENGINE_VERSION = "25.5";\nString OTHER = "25.4";');
});

test("supportedBranchesEdit adds the branch after main once, keeping formatting", () => {
    const edit = supportedBranchesEdit("/.github/supported-branches.json");
    const src = '{\r\n  "$comment": "x",\r\n  "branches": ["main", "25.3", "24.10"]\r\n}\r\n';
    const out = edit.apply(src, T);
    assert.equal(out, '{\r\n  "$comment": "x",\r\n  "branches": ["main", "25.4", "25.3", "24.10"]\r\n}\r\n');
    assert.equal(edit.apply(out, T), out, "idempotent");
    assert.equal(edit.apply('{"branches": ["main"]}', T), '{"branches": ["main", "25.4"]}');
});

test("readProjectVersion ignores the parent and later sections", () => {
    const pom = `<?xml version="1.0"?>
<project>
    <!-- <version>1.0</version> -->
    <parent>
        <groupId>com.vaadin</groupId>
        <artifactId>vaadin-parent</artifactId>
        <version>3.0.0</version>
    </parent>
    <artifactId>flow-project</artifactId>
    <version>25.4-SNAPSHOT</version>
    <properties><x.version>9</x.version></properties>
</project>`;
    assert.equal(readProjectVersion(pom), "25.4-SNAPSHOT");
    assert.equal(readProjectVersion("<project><parent><version>1</version></parent><dependencies><version>2</version></dependencies></project>"), null);
});

test("file classification", () => {
    for (const f of ["pom.xml", "flow-tests/x/pom-production.xml", "pom-dev-mode.xml"]) assert.equal(isPomFile(f), true, f);
    for (const f of ["pom.xml.bak", "src/pommes.xml", "notpom.xml/a.txt"]) assert.equal(isPomFile(f), false, f);
    for (const f of [
        "package-lock.json",
        "a/pnpm-lock.yaml",
        "yarn.lock",
        "x/node_modules/y/package.json",
        "gradle.lock",
        ".github/workflows/pr-snapshot.yml",
        ".github/workflows/README.md",
    ]) {
        assert.equal(isSkippedFile(f), true, f);
    }
    for (const f of ["package.json", "gradle.properties", "build/pom.xml", ".github/supported-branches.json", "x/.github/workflows/a.yml"]) {
        assert.equal(isSkippedFile(f), false, f);
    }
});
