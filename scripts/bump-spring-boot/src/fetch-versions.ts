import fs from "node:fs";
import { parseArgs } from "node:util";
import { fetchSpringBootVersions } from "./maven.js";

/**
 * Fetch the Spring Boot version list from Maven Central once and write it as
 * a JSON array, for `src/index.ts --versions-file`.
 *
 * The workflow runs this in a single job ahead of the repo/branch matrix, so
 * Maven Central sees one request per run instead of one per cell, and every
 * cell decides against the same list.
 */
async function main(): Promise<number> {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: { out: { type: "string" } },
        strict: true,
        allowPositionals: false,
    });
    if (!values.out) throw new Error("Missing required option --out");

    const versions = await fetchSpringBootVersions();
    fs.writeFileSync(values.out, JSON.stringify(versions, null, 2) + "\n", "utf8");
    console.log(`wrote ${versions.length} Spring Boot versions to ${values.out}`);
    return 0;
}

main().then(
    (code) => process.exit(code),
    (err) => {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    },
);
