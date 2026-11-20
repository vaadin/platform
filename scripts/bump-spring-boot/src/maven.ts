import fs from "node:fs";
import semver from "semver";
import { XMLParser } from "fast-xml-parser";

const CENTRAL = "https://repo.maven.apache.org/maven2";

const METADATA_URL = `${CENTRAL}/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml`;

const USER_AGENT = "vaadin-bump-spring-boot/1.0";

// parseTagValue: false keeps every value a string. Otherwise a version such as
// "4.10" would be coerced to the number 4.1.
const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Public URL the PR body cites as the source of truth. */
export const SPRING_BOOT_METADATA_URL = METADATA_URL;

/** URL of the spring-boot-dependencies BOM for one Spring Boot release. */
export function springBootDependenciesUrl(bootVersion: string): string {
    return `${CENTRAL}/org/springframework/boot/spring-boot-dependencies/${bootVersion}/spring-boot-dependencies-${bootVersion}.pom`;
}

/** URL of the spring-data-bom for one Spring Data release train. */
export function springDataBomUrl(bomVersion: string): string {
    return `${CENTRAL}/org/springframework/data/spring-data-bom/${bomVersion}/spring-data-bom-${bomVersion}.pom`;
}

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
 * GET a Maven Central file, retrying throttling and transient failures.
 *
 * In CI everything is fetched exactly once per workflow run (the
 * `fetch-versions` job) and shared with every repo/branch cell via
 * `--versions-file`. Fanning the requests out per cell is what got the job
 * rate-limited (HTTP 429) by Maven Central. `Connection: close` keeps undici
 * from pooling the socket, which would otherwise hold the event loop open.
 */
async function fetchText(url: string, attempts: number): Promise<string> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            const res = await fetch(url, {
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
                    `  warning: fetching ${url} failed (attempt ${attempt}/${attempts}), ` +
                        `retrying in ${waitMs}ms: ${err instanceof Error ? err.message : String(err)}`,
                );
                await sleep(waitMs);
            }
        }
    }

    const detail = lastError instanceof Error ? lastError.message : String(lastError);
    throw new Error(`Failed to fetch ${url}: ${detail}`);
}

/** Wrap fast-xml-parser's "one element collapses to a scalar" behavior. */
const asArray = <T>(v: T | T[] | undefined | null): T[] => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/** Extract the version list from maven-metadata.xml. */
export function parseVersions(xml: string): string[] {
    const parsed = parser.parse(xml);
    const list = asArray(parsed?.metadata?.versioning?.versions?.version).map((v) => String(v));
    if (list.length === 0) {
        throw new Error(`No versions found in metadata at ${METADATA_URL}`);
    }
    return list;
}

/** The `spring-data-bom.version` property a spring-boot-dependencies BOM pins. */
export function parseSpringDataBomVersion(bootDependenciesPom: string): string {
    const version = parser.parse(bootDependenciesPom)?.project?.properties?.["spring-data-bom.version"];
    if (!version) throw new Error("spring-boot-dependencies declares no spring-data-bom.version property");
    return String(version).trim();
}

/**
 * The version a BOM manages for `artifactId`. Resolves `${project.version}`
 * and plain `${property}` references against the BOM itself.
 */
export function parseManagedVersion(bomPom: string, artifactId: string): string {
    const project = parser.parse(bomPom)?.project;
    const dependency = asArray<{ artifactId?: string; version?: string }>(
        project?.dependencyManagement?.dependencies?.dependency,
    ).find((d) => String(d.artifactId) === artifactId);
    if (!dependency?.version) throw new Error(`BOM manages no version for ${artifactId}`);

    const raw = String(dependency.version).trim();
    const ref = /^\$\{(.+)\}$/.exec(raw);
    if (!ref) return raw;
    const resolved = ref[1] === "project.version" ? project?.version : project?.properties?.[ref[1]];
    if (!resolved) throw new Error(`Could not resolve ${raw} for ${artifactId} in the BOM`);
    return String(resolved).trim();
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
    return parseVersions(await fetchText(METADATA_URL, attempts));
}

/** What the newest stable Spring Boot release of one line manages for Spring Data. */
export interface SpringDataEntry {
    /** Newest stable Spring Boot release on the line, e.g. `4.2.0`. */
    springBoot: string;
    /** The Spring Data release train it pins, e.g. `2026.1.0`. */
    springDataBom: string;
    /** The spring-data-commons version that train manages, e.g. `4.2.0`. */
    springDataCommons: string;
}

/** Everything the bump needs from Maven Central, fetched once per run. */
export interface VersionData {
    springBoot: string[];
    /** Keyed by Spring Boot `major.minor` line, e.g. `"4.2"`. */
    springData: Record<string, SpringDataEntry>;
}

/** Oldest Spring Boot major whose Spring Data mapping is resolved. */
const MIN_SPRING_DATA_MAJOR = 3;

/** The newest stable release of every Spring Boot line from `MIN_SPRING_DATA_MAJOR` up. */
export function newestStablePerLine(versions: string[]): Map<string, string> {
    const newest = new Map<string, semver.SemVer>();
    for (const v of versions) {
        const sv = semver.parse(v);
        if (!sv || sv.prerelease.length > 0 || sv.major < MIN_SPRING_DATA_MAJOR) continue;
        const line = `${sv.major}.${sv.minor}`;
        const prev = newest.get(line);
        if (!prev || semver.gt(sv, prev)) newest.set(line, sv);
    }
    return new Map([...newest].map(([line, sv]) => [line, sv.version]));
}

/**
 * Fetch the Spring Boot version list, then, for the newest stable release of
 * each line, the spring-data-commons version its BOM manages. Requests run
 * one after another (about 20 in total), never in parallel.
 *
 * Spring Data is taken from Spring Boot's BOM rather than from Spring Data's
 * own newest release: Boot pins one exact Spring Data release train, so this
 * keeps a repo that declares spring-data-commons directly (flow-components)
 * on exactly what the matching Boot release ships with.
 */
export async function fetchVersionData(attempts = 5): Promise<VersionData> {
    const springBoot = await fetchSpringBootVersions(attempts);
    const springData: Record<string, SpringDataEntry> = {};
    for (const [line, boot] of newestStablePerLine(springBoot)) {
        const bom = parseSpringDataBomVersion(await fetchText(springBootDependenciesUrl(boot), attempts));
        const commons = parseManagedVersion(await fetchText(springDataBomUrl(bom), attempts), "spring-data-commons");
        springData[line] = { springBoot: boot, springDataBom: bom, springDataCommons: commons };
    }
    return { springBoot, springData };
}

const isStringArray = (v: unknown): v is string[] =>
    Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string");

const isEntry = (v: unknown): v is SpringDataEntry =>
    typeof v === "object" &&
    v !== null &&
    ["springBoot", "springDataBom", "springDataCommons"].every(
        (k) => typeof (v as Record<string, unknown>)[k] === "string",
    );

/**
 * Read a file written by `src/fetch-versions.ts`. Validated strictly, since a
 * truncated or wrong artifact must fail the cell rather than read as "no newer
 * version".
 */
export function readVersionsFile(file: string): VersionData {
    let data: unknown;
    try {
        data = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
        throw new Error(`Could not read versions file ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
    const d = data as Partial<VersionData> | null;
    if (
        typeof d !== "object" ||
        d === null ||
        !isStringArray(d.springBoot) ||
        typeof d.springData !== "object" ||
        d.springData === null ||
        !Object.values(d.springData).every(isEntry)
    ) {
        throw new Error(`Versions file ${file} does not have the shape written by fetch-versions.ts`);
    }
    return { springBoot: d.springBoot, springData: d.springData };
}
