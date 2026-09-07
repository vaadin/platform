import { XMLParser } from "fast-xml-parser";

const METADATA_URL =
    "https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml";

const USER_AGENT = "vaadin-bump-spring-boot/1.0";

const parser = new XMLParser({ ignoreAttributes: true });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch the metadata with a short retry.
 *
 * The workflow fans out one process per repo/branch cell, so a dozen requests
 * hit Maven Central at once; a single transient `fetch failed` should not turn
 * an otherwise-fine cell into a red job. `Connection: close` keeps undici from
 * pooling the socket, which would otherwise hold the event loop open after the
 * one request this process makes.
 */
async function fetchMetadataXml(attempts: number): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(METADATA_URL, {
                headers: { "User-Agent": USER_AGENT, Connection: "close" },
            });
            if (!res.ok) {
                throw new Error(`HTTP ${res.status} ${res.statusText}`);
            }
            return await res.text();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                const backoffMs = 500 * 2 ** (attempt - 1);
                console.warn(
                    `  warning: fetching Spring Boot versions failed (attempt ${attempt}/${attempts}), ` +
                        `retrying in ${backoffMs}ms: ${err instanceof Error ? err.message : String(err)}`,
                );
                await sleep(backoffMs);
            }
        }
    }

    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed to fetch ${METADATA_URL} after ${attempts} attempts: ${detail}`);
}

/** Public URL the PR body cites as the source of truth. */
export const SPRING_BOOT_METADATA_URL = METADATA_URL;

/**
 * Every published `spring-boot-starter-parent` version, in whatever order
 * Maven Central lists them. Callers filter; this only fetches and parses.
 *
 * `spring-boot-starter-parent` is used rather than `spring-boot` itself
 * because it is the artifact whose release cadence defines a Spring Boot
 * release, and it is what the repos' BOM imports resolve against.
 */
export async function fetchSpringBootVersions(attempts = 3): Promise<string[]> {
    const xml = await fetchMetadataXml(attempts);
    const parsed = parser.parse(xml);
    const raw = parsed?.metadata?.versioning?.versions?.version;
    if (raw === undefined || raw === null) {
        throw new Error(`No versions found in metadata at ${METADATA_URL}`);
    }

    // fast-xml-parser collapses a single <version> element to a scalar, and
    // coerces numeric-looking values, so normalize to string[] both ways.
    const list = (Array.isArray(raw) ? raw : [raw]).map((v) => String(v));
    if (list.length === 0) {
        throw new Error(`Empty version list in metadata at ${METADATA_URL}`);
    }
    return list;
}
