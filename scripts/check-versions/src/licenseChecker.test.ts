import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
    auditBranch,
    BranchInput,
    isActionable,
    licenseCheckerVersionFromPom,
    renderAudit,
} from "./licenseChecker.js";

/** Every license-checker release line the platform branches sit on. */
const AVAILABLE = [
    "1.12.13",
    "1.12.14",
    "1.13.2",
    "1.13.3",
    "1.13.4",
    "1.13.5",
    "1.13.6",
    "2.3.0",
    "2.3.1",
    "2.3.2",
    "3.0.1",
    "3.0.3",
    "3.1.0",
    "3.1.2",
    "3.2.0-beta1",
];

function input(overrides: Partial<BranchInput>): BranchInput {
    return {
        branch: "test",
        pinned: "3.1.2",
        flowVersion: "25.2.9",
        flowLicenseChecker: "3.1.2",
        available: AVAILABLE,
        ...overrides,
    };
}

function kinds(audit: { findings: { kind: string }[] }): string[] {
    return audit.findings.map((f) => f.kind);
}

test("branch pinning the newest checker of its major line is clean", () => {
    const audit = auditBranch(input({ branch: "25.2" }));
    assert.deepEqual(kinds(audit), []);
    assert.equal(isActionable(audit), false);
});

test("bom pin newer than the flow release it ships (the 23.6.14 offline key case)", () => {
    const audit = auditBranch(
        input({ branch: "23.6", pinned: "2.3.2", flowVersion: "23.6.14", flowLicenseChecker: "2.3.1" }),
    );
    assert.deepEqual(kinds(audit), ["ahead-of-flow"]);
    assert.match(audit.findings[0].message, /build-time license check still runs 2\.3\.1/);
    // 2.3.2 is the newest 2.x, so the branch is only waiting for a flow release.
    assert.equal(audit.latestInMajor, "2.3.2");
});

test("bom pin older than flow's, and both behind the major line", () => {
    const audit = auditBranch(
        input({ branch: "24.5", pinned: "1.13.2", flowVersion: "24.5.17", flowLicenseChecker: "1.13.4" }),
    );
    assert.deepEqual(kinds(audit), ["behind-flow", "stale"]);
    // Staleness is measured from flow's 1.13.4, not from the lower bom pin.
    assert.match(audit.findings[1].message, /patch update from 1\.13\.4/);
});

test("consistent but stale branch reports only the available update", () => {
    const audit = auditBranch(
        input({ branch: "24.8", pinned: "1.13.5", flowVersion: "24.8.16", flowLicenseChecker: "1.13.5" }),
    );
    assert.deepEqual(kinds(audit), ["stale"]);
    assert.equal(audit.latestInMajor, "1.13.6");
});

test("a newer major is never proposed as the update target", () => {
    const audit = auditBranch(
        input({ branch: "24.4", pinned: "1.12.14", flowVersion: "24.4.17", flowLicenseChecker: "1.12.14" }),
    );
    assert.deepEqual(kinds(audit), ["stale"]);
    assert.equal(audit.latestInMajor, "1.13.6");
    assert.match(audit.findings[0].message, /minor update from 1\.12\.14, same major line/);
});

test("prereleases are never proposed as the update target", () => {
    const audit = auditBranch(
        input({ branch: "25.1", pinned: "3.1.2", flowVersion: "25.1.17", flowLicenseChecker: "3.1.2" }),
    );
    assert.equal(audit.latestInMajor, "3.1.2");
    assert.deepEqual(kinds(audit), []);
});

test("snapshot flow pin is reported but is not actionable", () => {
    const audit = auditBranch(
        input({ branch: "24.9", pinned: "2.3.2", flowVersion: "24.9-SNAPSHOT", flowLicenseChecker: null }),
    );
    assert.deepEqual(kinds(audit), ["unresolved-flow"]);
    assert.equal(isActionable(audit), false);
});

test("a stale snapshot branch is still actionable", () => {
    const audit = auditBranch(
        input({ branch: "24.9", pinned: "2.3.0", flowVersion: "24.9-SNAPSHOT", flowLicenseChecker: null }),
    );
    assert.deepEqual(kinds(audit), ["unresolved-flow", "stale"]);
    assert.equal(isActionable(audit), true);
});

test("renderAudit prints both resolution paths and the findings", () => {
    const out = renderAudit([
        auditBranch(input({ branch: "25.2" })),
        auditBranch(
            input({ branch: "23.6", pinned: "2.3.2", flowVersion: "23.6.14", flowLicenseChecker: "2.3.1" }),
        ),
    ]);
    assert.match(out, /ok {3}25\.2 {4}bom=3\.1\.2 {2}flow=25\.2\.9 -> 3\.1\.2/);
    assert.match(out, /FAIL 23\.6 {4}bom=2\.3\.2 {2}flow=23\.6\.14 -> 2\.3\.1/);
    assert.match(out, /ahead-of-flow:/);
});

test("licenseCheckerVersionFromPom reads the flow-project dependencyManagement pin", () => {
    const pom = `<?xml version="1.0"?>
        <project>
          <dependencyManagement>
            <dependencies>
              <dependency>
                <groupId>com.vaadin</groupId>
                <artifactId>flow-server</artifactId>
                <version>24.8.16</version>
              </dependency>
              <dependency>
                <groupId>com.vaadin</groupId>
                <artifactId>license-checker</artifactId>
                <version>1.13.5</version>
              </dependency>
            </dependencies>
          </dependencyManagement>
        </project>`;
    assert.equal(licenseCheckerVersionFromPom(pom), "1.13.5");
});

test("licenseCheckerVersionFromPom returns null when nothing manages the checker", () => {
    const pom = `<project><dependencies><dependency>
          <groupId>com.vaadin</groupId><artifactId>flow-server</artifactId><version>24.8.16</version>
        </dependency></dependencies></project>`;
    assert.equal(licenseCheckerVersionFromPom(pom), null);
});
