const REGISTRY = "https://registry.npmjs.org";
const USER_AGENT = "vaadin-check-versions/1.0";

export type NpmLookup =
    | { status: "ok"; versions: string[] }
    | { status: "not-found" }
    | { status: "error"; message: string };

export async function fetchNpmVersions(npmName: string, verbose = false): Promise<NpmLookup> {
    const url = `${REGISTRY}/${encodeURIComponent(npmName).replace("%40", "@")}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (res.status === 404) return { status: "not-found" };
        if (!res.ok) return { status: "error", message: `HTTP ${res.status}` };
        const json = (await res.json()) as { error?: string; versions?: Record<string, unknown> };
        if (json.error || !json.versions) return { status: "not-found" };
        const versions = Object.keys(json.versions);
        if (verbose) console.error(`  npm versions=${versions.length} (${npmName})`);
        return { status: "ok", versions };
    } catch (err) {
        return { status: "error", message: (err as Error).message };
    }
}
