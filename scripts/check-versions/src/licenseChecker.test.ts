import { strict as assert } from "node:assert";
import { test } from "node:test";
import {
    auditBranch,
    BranchInput,
    isActionable,
    licenseCheckerVersionFromPom,
    renderAudit,
    requiredMajor,
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
    const merged = {
        branch: "test",
        pinned: "3.1.2",
        flowVersion: "25.2.9",
        flowLicenseChecker: "3.1.2",
        available: AVAILABLE,
        ...overrides,
    };
    // Default to the line the flow pin under test actually requires, so a
    // case only has to spell out requiredMajor when that is the point.
    return { requiredMajor: requiredMajor(merged.flowVersion), ...merged };
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

test("bom pin older than flow's, and both behind the required line", () => {
    const audit = auditBranch(
        input({ branch: "24.9", pinned: "2.3.0", flowVersion: "24.9.26", flowLicenseChecker: "2.3.1" }),
    );
    assert.deepEqual(kinds(audit), ["behind-flow", "stale"]);
    // Staleness is measured from flow's 2.3.1, not from the lower bom pin.
    assert.match(audit.findings[1].message, /patch update from 2\.3\.1/);
});

test("consistent but stale branch reports only the available update", () => {
    const audit = auditBranch(
        input({ branch: "25.0", pinned: "3.0.3", flowVersion: "25.0.15", flowLicenseChecker: "3.0.3" }),
    );
    assert.deepEqual(kinds(audit), ["stale"]);
    assert.equal(audit.latestInMajor, "3.1.2");
    assert.match(audit.findings[0].message, /minor update from 3\.0\.3, same major line/);
});

test("requiredMajor: 1.x is never required, flow 24.10 is where 3.x starts", () => {
    assert.equal(requiredMajor("25.4-SNAPSHOT"), 3);
    assert.equal(requiredMajor("25.0.15"), 3);
    assert.equal(requiredMajor("24.10-SNAPSHOT"), 3);
    assert.equal(requiredMajor("24.10.12"), 3);
    assert.equal(requiredMajor("24.9.26"), 2);
    assert.equal(requiredMajor("24.4.17"), 2);
    assert.equal(requiredMajor("23.7.0-beta5"), 2);
    // The 14 line ships flow 2.x, which must not read as "license-checker 2.x
    // because the majors happen to match" — it lands on 2.x for being older
    // than 24.10, same as every other pre-24.10 line.
    assert.equal(requiredMajor("2.13.7"), 2);
    // Derived from the flow pin, not the branch name, so a branch name never
    // reaches this function. An unusable pin falls back to the newest line.
    assert.equal(requiredMajor("{{version}}"), 3);
    assert.equal(requiredMajor(""), 3);
});

test("a 1.x pin is reported as wrong-major, pointing at the required line", () => {
    const audit = auditBranch(
        input({ branch: "24.8", pinned: "1.13.5", flowVersion: "24.8.16", flowLicenseChecker: "1.13.5" }),
    );
    assert.deepEqual(kinds(audit), ["wrong-major"]);
    // 1.13.6 exists upstream but is never the target — the branch has to
    // leave the 1.x line entirely.
    assert.equal(audit.latestInMajor, "2.3.2");
    assert.match(audit.findings[0].message, /must use the 2\.x line \(2\.3\.2\)/);
    assert.match(audit.findings[0].message, /vaadin-bom pins 1\.13\.5 and flow 24\.8\.16 builds against 1\.13\.5/);
});

test("wrong-major names only the path that is off the line", () => {
    const audit = auditBranch(
        input({ branch: "24.5", pinned: "2.3.2", flowVersion: "24.5.17", flowLicenseChecker: "1.13.4" }),
    );
    assert.deepEqual(kinds(audit), ["wrong-major"]);
    assert.match(audit.findings[0].message, /^flow 24\.5\.17 builds against 1\.13\.4/);
});

test("a 3.x pin on a 2.x branch is wrong-major too", () => {
    const audit = auditBranch(
        input({ branch: "23.6", pinned: "3.1.2", flowVersion: "23.6.14", flowLicenseChecker: "2.3.2" }),
    );
    assert.deepEqual(kinds(audit), ["wrong-major"]);
    assert.match(audit.findings[0].message, /vaadin-bom pins 3\.1\.2 — this branch must use the 2\.x line/);
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
    assert.match(out, /ok {3}25\.2 {4}bom=3\.1\.2 {2}flow=25\.2\.9 -> 3\.1\.2 {2}must-use=3\.x \(3\.1\.2\)/);
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
