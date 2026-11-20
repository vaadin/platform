import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_LABEL_COLOR, labelTemplate, targetLabelName } from "./labels.js";
import { parseTrain } from "./version.js";

const T = parseTrain("25.4");

test("label name", () => {
    assert.equal(targetLabelName(T), "target/25.4");
});

test("copies colour and description from the newest target/<version> label", () => {
    const labels = [
        { name: "target/main", color: "5B2208", description: "main" },
        { name: "target/25.3", color: "EFBA34", description: "Pick to 25.3" },
        { name: "target/25.10", color: "123456", description: null },
        { name: "target/9.9", color: "000000", description: null },
        { name: "bug", color: "ff0000", description: null },
    ];
    // 25.10 > 25.3 numerically, not lexically.
    assert.deepEqual(labelTemplate(labels, T), { color: "123456", description: "" });
    assert.deepEqual(labelTemplate(labels.filter((l) => l.name !== "target/25.10"), T), {
        color: "efba34",
        description: "Pick to 25.4",
    });
});

test("falls back to the default colour", () => {
    assert.deepEqual(labelTemplate([{ name: "target/main", color: "5B2208", description: null }], T), {
        color: DEFAULT_LABEL_COLOR,
        description: "",
    });
    assert.deepEqual(labelTemplate([], T), { color: DEFAULT_LABEL_COLOR, description: "" });
});
