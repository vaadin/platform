import { test } from "node:test";
import assert from "node:assert/strict";
import { belongsToTrain, nextTrain, parseTrain, snapshotOf, trainFromBeta1Tag, trainName } from "./version.js";

test("parseTrain accepts major.minor only", () => {
    assert.deepEqual(parseTrain("25.4"), { major: 25, minor: 4 });
    assert.deepEqual(parseTrain(" 26.0 "), { major: 26, minor: 0 });
    for (const bad of ["25", "25.4.0", "25.4-SNAPSHOT", "v25.4", "25.04", ""]) {
        assert.throws(() => parseTrain(bad), /major\.minor/, bad);
    }
});

test("next minor carries past 9", () => {
    assert.equal(snapshotOf(nextTrain(parseTrain("25.9"))), "25.10-SNAPSHOT");
    assert.equal(trainName(nextTrain(parseTrain("25.4"))), "25.5");
});

test("only X.Y.0-beta1 tags yield a train", () => {
    assert.deepEqual(trainFromBeta1Tag("25.4.0-beta1"), { major: 25, minor: 4 });
    for (const tag of ["25.4.0-beta2", "25.4.0-beta10", "25.4.0-alpha1", "25.4.0-rc1", "25.4.0", "25.4.1-beta1"]) {
        assert.equal(trainFromBeta1Tag(tag), null, tag);
    }
});

test("belongsToTrain", () => {
    const t = parseTrain("25.4");
    for (const v of ["25.4.0-alpha1", "25.4.0-beta2", "25.4.0-rc1", "25.4.0-RC3", "25.4-SNAPSHOT"]) {
        assert.equal(belongsToTrain(v, t), true, v);
    }
    for (const v of ["25.4.0", "25.4.1", "25.3.0-beta1", "125.4.0-beta1", "25.40.0-beta1", "4.2.0", "{{version}}"]) {
        assert.equal(belongsToTrain(v, t), false, v);
    }
});
