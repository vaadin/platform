import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readSupportedBranches } from "./supportedBranches.js";
import { SUPPORTED_BRANCHES } from "./licenseChecker.js";

test("the shared file is valid, starts with main and has no duplicates", () => {
    const branches = readSupportedBranches();
    assert.equal(branches[0], "main");
    assert.equal(new Set(branches).size, branches.length);
    for (const b of branches.slice(1)) assert.match(b, /^\d+\.\d+$/, b);
});

test("the license audit uses the shared list", () => {
    assert.deepEqual([...SUPPORTED_BRANCHES], readSupportedBranches());
});

test("rejects a malformed file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "branches-"));
    try {
        for (const body of ['{"branches": []}', '{"branches": ["main", 25.3]}', '{"other": 1}']) {
            const f = path.join(dir, "b.json");
            fs.writeFileSync(f, body);
            assert.throws(() => readSupportedBranches(f), /non-empty array/, body);
        }
    } finally {
        fs.rmSync(dir, { recursive: true, force: true });
    }
});
