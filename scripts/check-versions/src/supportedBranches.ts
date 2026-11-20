import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** The single list of supported platform branches, shared with every workflow. */
export const SUPPORTED_BRANCHES_FILE = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "..",
    ".github",
    "supported-branches.json",
);

/** Read `.github/supported-branches.json`, failing loudly on a missing or malformed file. */
export function readSupportedBranches(file = SUPPORTED_BRANCHES_FILE): string[] {
    const data = JSON.parse(fs.readFileSync(file, "utf8")) as { branches?: unknown };
    const branches = data.branches;
    if (!Array.isArray(branches) || branches.length === 0 || !branches.every((b) => typeof b === "string" && b)) {
        throw new Error(`${file}: "branches" must be a non-empty array of branch names`);
    }
    return branches;
}
