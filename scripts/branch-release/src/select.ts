import { parseArgs } from "node:util";
import fs from "node:fs";
import { selectRepos } from "./repos.js";
import { Train, parseTrain, trainFromBeta1Tag, trainName } from "./version.js";

/**
 * Resolve which repos a run covers. Used by the workflow's resolve-matrix job
 * and by `dispatch-branch-release.sh --local`.
 *
 *   tsx src/select.ts --versions-file ../../versions.json (--version 25.4 | --tag 25.4.0-beta1) [--repos a,b]
 *
 * Prints one JSON object on stdout:
 *   { "version": "25.4", "repos": [...], "unmapped": [...], "excluded": [...] }
 *
 * `--repos` narrows the selection; naming a repo that is not on the train is an
 * error rather than a silent no-op.
 */
function main(): number {
    const { values } = parseArgs({
        options: {
            "versions-file": { type: "string" },
            version: { type: "string" },
            tag: { type: "string" },
            repos: { type: "string" },
        },
        strict: true,
    });

    const versionsFile = values["versions-file"];
    if (!versionsFile) throw new Error("--versions-file is required");

    let train: Train;
    if (values.version) {
        train = parseTrain(values.version);
    } else if (values.tag) {
        const fromTag = trainFromBeta1Tag(values.tag);
        if (!fromTag) throw new Error(`Tag "${values.tag}" is not an X.Y.0-beta1 release`);
        train = fromTag;
    } else {
        throw new Error("one of --version or --tag is required");
    }

    const selection = selectRepos(JSON.parse(fs.readFileSync(versionsFile, "utf8")), train);

    let repos = selection.repos;
    const requested = (values.repos ?? "")
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    if (requested.length > 0) {
        const unknown = requested.filter((r) => !repos.includes(r));
        if (unknown.length > 0) {
            throw new Error(`Not on the ${trainName(train)} train: ${unknown.join(", ")} (train: ${repos.join(", ")})`);
        }
        repos = repos.filter((r) => requested.includes(r));
    }

    console.log(JSON.stringify({ version: trainName(train), ...selection, repos }));
    return 0;
}

try {
    process.exitCode = main();
} catch (err) {
    console.error(`error: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
}
