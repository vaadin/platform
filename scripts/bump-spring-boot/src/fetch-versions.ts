import fs from "node:fs";
import { parseArgs } from "node:util";
import { fetchVersionData } from "./maven.js";

/**
 * Fetch everything the bump needs from Maven Central once, and write it as
 * JSON for `src/index.ts --versions-file`: the Spring Boot version list, and
 * the spring-data-commons version managed by each Spring Boot line's newest
 * stable release.
 *
 * The workflow runs this in a single job ahead of the repo/branch matrix, so
 * Maven Central sees one set of requests per run instead of one per cell, and
 * every cell decides against the same data.
 */
async function main(): Promise<number> {
    const { values } = parseArgs({
        args: process.argv.slice(2),
        options: { out: { type: "string" } },
        strict: true,
        allowPositionals: false,
    });
    if (!values.out) throw new Error("Missing required option --out");

    const data = await fetchVersionData();
    fs.writeFileSync(values.out, JSON.stringify(data, null, 2) + "\n", "utf8");
    console.log(`wrote ${data.springBoot.length} Spring Boot versions to ${values.out}`);
    for (const [line, e] of Object.entries(data.springData)) {
        console.log(`  Spring Boot ${line}.x: ${e.springBoot} -> spring-data-bom ${e.springDataBom} -> spring-data-commons ${e.springDataCommons}`);
    }
    return 0;
}

main().then(
    (code) => process.exit(code),
    (err) => {
        console.error(err instanceof Error ? err.message : String(err));
        process.exit(1);
    },
);
