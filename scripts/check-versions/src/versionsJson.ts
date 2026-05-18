import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const VERSIONS_JSON_PATH = path.resolve(here, "..", "..", "..", "versions.json");

export type Module = Record<string, unknown> & {
    javaVersion?: string;
    jsVersion?: string;
    npmName?: string;
    mode?: string;
    pro?: boolean;
};

export type VersionsJson = Record<string, unknown>;

export function readVersions(file = VERSIONS_JSON_PATH): VersionsJson {
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw) as VersionsJson;
}

function sortedReplacer(_key: string, value: unknown): unknown {
    if (value && typeof value === "object" && !Array.isArray(value)) {
        const obj = value as Record<string, unknown>;
        return Object.keys(obj)
            .sort()
            .reduce<Record<string, unknown>>((acc, k) => {
                acc[k] = obj[k];
                return acc;
            }, {});
    }
    return value;
}

/** Mirrors scripts/updateVersions.py: sort_keys=True, indent=4, trailing newline. */
export function writeVersions(data: VersionsJson, file = VERSIONS_JSON_PATH): void {
    fs.writeFileSync(file, JSON.stringify(data, sortedReplacer, 4) + "\n");
}

export interface ModuleEntry {
    section: string;
    name: string;
    module: Module;
}

export function* iterateModules(data: VersionsJson): Generator<ModuleEntry> {
    for (const [section, value] of Object.entries(data)) {
        if (!value || typeof value !== "object" || Array.isArray(value)) continue;
        const sectionObj = value as Record<string, unknown>;
        for (const [name, mod] of Object.entries(sectionObj)) {
            if (!mod || typeof mod !== "object" || Array.isArray(mod)) continue;
            yield { section, name, module: mod as Module };
        }
    }
}
