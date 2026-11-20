import fs from "node:fs";
import { XMLParser } from "fast-xml-parser";

const METADATA_URL =
    "https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml";

const USER_AGENT = "vaadin-bump-spring-boot/1.0";

const parser = new XMLParser({ ignoreAttributes: true });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Public URL the PR body cites as the source of truth. */
export const SPRING_BOOT_METADATA_URL = METADATA_URL;

/** Base delays between attempts; jitter is added on top. */
const BACKOFF_MS = [2_000, 5_000, 15_000, 30_000];

/** Never wait longer than this for one retry, whatever Retry-After says. */
const MAX_WAIT_MS = 60_000;

/**
 * HTTP statuses worth retrying. 429/5xx are throttling and outages. 404 is
 * included because Maven Central's CDN has been seen returning it for this
 * metadata file under load; the file itself is never actually absent.
 * Any other 4xx is a real error and fails immediately.
 */
export function isRetryableStatus(status: number): boolean {
    return status === 404 || status === 408 || status === 429 || status >= 500;
}

/**
 * Milliseconds to wait as requested by a `Retry-After` header, or `null`
 * when the header is absent or unparseable. Accepts both delta-seconds and
 * an HTTP date.
 */
export function parseRetryAfter(header: string | null, now = Date.now()): number | null {
    if (!header) return null;
    const trimmed = header.trim();
    if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;
    const date = Date.parse(trimmed);
    return Number.isNaN(date) ? null : Math.max(0, date - now);
}

/** Delay before retry number `attempt` (1-based): Retry-After wins, else backoff plus jitter. */
export function retryDelayMs(attempt: number, retryAfterMs: number | null, random = Math.random): number {
    if (retryAfterMs !== null) return Math.min(MAX_WAIT_MS, retryAfterMs);
    const base = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
    // Up to +50% jitter so parallel callers do not retry in lockstep.
    return Math.min(MAX_WAIT_MS, Math.round(base * (1 + random() * 0.5)));
}

class HttpError extends Error {
    constructor(
        readonly status: number,
        statusText: string,
        readonly retryAfterMs: number | null,
    ) {
        super(`HTTP ${status} ${statusText}`);
    }
}

/**
 * Fetch the metadata, retrying throttling and transient failures.
 *
 * In CI this runs exactly once per workflow run (the `fetch-versions` job)
 * and the result is shared with every repo/branch cell via `--versions-file`.
 * Fanning the request out per cell is what got the job rate-limited (HTTP
 * 429) by Maven Central. `Connection: close` keeps undici from pooling the
 * socket, which would otherwise hold the event loop open after the request.
 */
async function fetchMetadataXml(attempts: number): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(METADATA_URL, {
                headers: { "User-Agent": USER_AGENT, Connection: "close" },
            });
            if (!res.ok) {
                throw new HttpError(res.status, res.statusText, parseRetryAfter(res.headers.get("retry-after")));
            }
            return await res.text();
        } catch (err) {
            lastError = err;
            if (err instanceof HttpError && !isRetryableStatus(err.status)) break;
            if (attempt < attempts) {
                const waitMs = retryDelayMs(attempt, err instanceof HttpError ? err.retryAfterMs : null);
                console.warn(
                    `  warning: fetching Spring Boot versions failed (attempt ${attempt}/${attempts}), ` +
                        `retrying in ${waitMs}ms: ${err instanceof Error ? err.message : String(err)}`,
                );
                await sleep(waitMs);
            }
        }
    }

    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed to fetch ${METADATA_URL}: ${detail}`);
}

/**
 * Extract the version list from maven-metadata.xml.
 *
 * fast-xml-parser collapses a single <version> element to a scalar, and
 * coerces numeric-looking values, so normalize to string[] both ways.
 */
export function parseVersions(xml: string): string[] {
    const parsed = parser.parse(xml);
    const raw = parsed?.metadata?.versioning?.versions?.version;
    if (raw === undefined || raw === null) {
        throw new Error(`No versions found in metadata at ${METADATA_URL}`);
    }
    const list = (Array.isArray(raw) ? raw : [raw]).map((v) => String(v));
    if (list.length === 0) {
        throw new Error(`Empty version list in metadata at ${METADATA_URL}`);
    }
    return list;
}

/**
 * Every published `spring-boot-starter-parent` version, in whatever order
 * Maven Central lists them. Callers filter; this only fetches and parses.
 *
 * `spring-boot-starter-parent` is used rather than `spring-boot` itself
 * because it is the artifact whose release cadence defines a Spring Boot
 * release, and it is what the repos' BOM imports resolve against.
 */
export async function fetchSpringBootVersions(attempts = 5): Promise<string[]> {
    return parseVersions(await fetchMetadataXml(attempts));
}

/**
 * Read a version list written by `src/fetch-versions.ts`: a non-empty JSON
 * array of strings. Validated strictly, since a truncated or wrong artifact
 * must fail the cell rather than read as "no newer version".
 */
export function readVersionsFile(file: string): string[] {
    let data: unknown;
    try {
        data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        throw new Error(`Could not read versions file ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (!Array.isArray(data) || data.length === 0 || !data.every((v) => typeof v === "string")) {
        throw new Error(`Versions file ${file} is not a non-empty JSON array of strings`);
    }
    return data;
}
