import { XMLParser } from "fast-xml-parser";
import { ARTIFACT_ID_OVERRIDES } from "./artifact-overrides.js";

const STABLE_BASE = "https://repo.maven.apache.org/maven2/com/vaadin";
const PRERELEASE_BASE =
    "https://tools.vaadin.com/nexus/content/repositories/vaadin-prereleases/com/vaadin";

const USER_AGENT = "vaadin-check-versions/1.0";

const xmlParser = new XMLParser({ ignoreAttributes: true });

export type MavenLookup =
    | { status: "skip-private"; artifactId: null }
    | { status: "not-found"; artifactId: string; tried: string[] }
    | { status: "ok"; artifactId: string; versions: string[]; sources: { stable: boolean; prerelease: boolean } }
    | { status: "error"; artifactId: string; message: string };

export function resolveArtifactId(
    moduleKey: string,
    cliOverrides: Map<string, string | "skip">,
): string | "skip" {
    const fromCli = cliOverrides.get(moduleKey);
    if (fromCli !== undefined) return fromCli;
    const fromBuiltin = ARTIFACT_ID_OVERRIDES[moduleKey];
    if (fromBuiltin !== undefined) return fromBuiltin;
    return moduleKey;
}

async function fetchMetadata(url: string): Promise<string[] | null> {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    const xml = await res.text();
    const parsed = xmlParser.parse(xml) as {
        metadata?: { versioning?: { versions?: { version?: string | string[] } } };
    };
    const v = parsed?.metadata?.versioning?.versions?.version;
    if (!v) return [];
    return Array.isArray(v) ? v : [v];
}

export async function fetchMavenVersions(
    moduleKey: string,
    cliOverrides: Map<string, string | "skip">,
    verbose = false,
): Promise<MavenLookup> {
    const resolved = resolveArtifactId(moduleKey, cliOverrides);
    if (resolved === "skip") return { status: "skip-private", artifactId: null };

    const artifactId = resolved;
    const stableUrl = `${STABLE_BASE}/${artifactId}/maven-metadata.xml`;
    const preUrl = `${PRERELEASE_BASE}/${artifactId}/maven-metadata.xml`;

    let stableVersions: string[] | null = null;
    let preVersions: string[] | null = null;
    try {
        [stableVersions, preVersions] = await Promise.all([
            fetchMetadata(stableUrl),
            fetchMetadata(preUrl),
        ]);
    } catch (err) {
        return { status: "error", artifactId, message: (err as Error).message };
    }

    if (verbose) {
        console.error(
            `  maven stable=${stableVersions ? stableVersions.length : "404"} pre=${preVersions ? preVersions.length : "404"} (${artifactId})`,
        );
    }

    const hasStable = stableVersions !== null && stableVersions.length > 0;
    const hasPre = preVersions !== null && preVersions.length > 0;
    if (!hasStable && !hasPre) {
        return { status: "not-found", artifactId, tried: [stableUrl, preUrl] };
    }

    const union = Array.from(new Set([...(stableVersions ?? []), ...(preVersions ?? [])]));
    return {
        status: "ok",
        artifactId,
        versions: union,
        sources: { stable: hasStable, prerelease: hasPre },
    };
}
