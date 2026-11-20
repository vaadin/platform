import { Train, belongsToTrain, escapeRegExp, nextTrain, prereleasePattern, snapshotOf, snapshotTokenRegExp, trainName } from "./version.js";

/**
 * Pure text transforms for moving `main` from X.Y-SNAPSHOT to X.(Y+1)-SNAPSHOT.
 *
 * Every edit is a targeted substitution on the original text, never a parse
 * and re-serialize: re-emitting a pom or versions.json would reformat the
 * whole file and bury the real change in noise.
 */

export interface PropertyChange {
    file: string;
    property: string;
    from: string;
    to: string;
}

/** Replace every whole-token `X.Y-SNAPSHOT` with `X.(Y+1)-SNAPSHOT`. */
export function replaceSnapshotLiteral(text: string, train: Train): { text: string; count: number } {
    let count = 0;
    const to = snapshotOf(nextTrain(train));
    const out = text.replace(snapshotTokenRegExp(train), () => {
        count++;
        return to;
    });
    return { text: out, count };
}

/**
 * Point Vaadin dependency properties that are pinned to a prerelease of the
 * train (`<testbench.version>25.4.0-alpha2</testbench.version>`) at the next
 * SNAPSHOT. Properties already at the train's SNAPSHOT are handled by
 * {@link replaceSnapshotLiteral}; anything else is left alone.
 */
export function bumpPomProperties(text: string, train: Train, file: string): { text: string; changes: PropertyChange[] } {
    const changes: PropertyChange[] = [];
    const to = snapshotOf(nextTrain(train));
    const re = new RegExp(`<([\\w.-]+\\.version)>(\\s*)(${prereleasePattern(train)})(\\s*)</\\1>`, "gi");
    const out = text.replace(re, (_m, property: string, lead: string, from: string, trail: string) => {
        changes.push({ file, property, from, to });
        return `<${property}>${lead}${to}${trail}</${property}>`;
    });
    return { text: out, changes };
}

/**
 * In platform's versions.json, move every Java product on the train to the
 * next SNAPSHOT. Only `javaVersion`/`version` are touched: `jsVersion` is an
 * npm version, where `-SNAPSHOT` is meaningless. `{{version}}` placeholders
 * and products on their own trains (sso-kit 4.x, ...) do not match.
 *
 * Products in `skip` are left as they are: when a repo is not bumped by this
 * job, its X.(Y+1)-SNAPSHOT may never exist, so platform must not point at it.
 */
export function bumpVersionsJson(
    text: string,
    train: Train,
    skip: ReadonlySet<string> = new Set(),
): { text: string; changes: PropertyChange[] } {
    const changes: PropertyChange[] = [];
    const to = snapshotOf(nextTrain(train));
    // `[^{}]*?` keeps the match inside the product's own (innermost) object,
    // so the captured key is the product the value belongs to.
    const re = /("([\w.-]+)"\s*:\s*\{[^{}]*?"(javaVersion|version)"\s*:\s*")([^"]*)(")/g;
    let out = text;
    let changed = true;
    // A product could in principle carry both keys; loop until stable so each
    // occurrence gets its own pass of the non-overlapping regex.
    while (changed) {
        changed = false;
        out = out.replace(re, (m, head: string, product: string, key: string, value: string, tail: string) => {
            if (skip.has(product) || !belongsToTrain(value, train) || value === to) return m;
            changed = true;
            changes.push({ file: "versions.json", property: `${product}.${key}`, from: value, to });
            return `${head}${to}${tail}`;
        });
    }
    return { text: out, changes };
}

/** One per-repo edit that the generic rules cannot find. */
export interface ExtraEdit {
    /** Tracked path suffix identifying the file, e.g. `/CollaborationEngine.java`. */
    pathSuffix: string;
    description: string;
    apply(text: string, train: Train): string;
}

/** `NAME = "X.Y"` -> `NAME = "X.(Y+1)"` for a Java/Kotlin string constant. */
export function trainConstantEdit(pathSuffix: string, constant: string): ExtraEdit {
    return {
        pathSuffix,
        description: `${constant} constant`,
        apply(text, train) {
            const re = new RegExp(`(\\b${escapeRegExp(constant)}\\s*=\\s*")${escapeRegExp(trainName(train))}(")`, "g");
            return text.replace(re, `$1${trainName(nextTrain(train))}$2`);
        },
    };
}

/**
 * The project's own `<version>` from a root pom, ignoring `<parent>`'s. Reads
 * only the header before the first section that can carry other versions.
 */
export function readProjectVersion(pom: string): string | null {
    let head = pom.replace(/<!--[\s\S]*?-->/g, "");
    head = head.replace(/<parent>[\s\S]*?<\/parent>/, "");
    const cut = head.search(/<(properties|modules|dependencies|dependencyManagement|build|profiles|repositories)\b/);
    if (cut >= 0) head = head.slice(0, cut);
    const match = /<version>\s*([^<\s]+)\s*<\/version>/.exec(head);
    return match ? match[1] : null;
}

/** pom.xml, pom-dev.xml, pom-production.xml, ... */
export function isPomFile(path: string): boolean {
    return /(^|\/)pom(-[^/]*)?\.xml$/.test(path);
}

const SKIPPED_FILE = /(^|\/)node_modules\/|(^|\/)(package-lock\.json|pnpm-lock\.yaml|yarn\.lock|[^/]*\.lock)$/;

/** Tracked files the literal replacement should never touch: lock files and vendored node_modules. */
export function isSkippedFile(path: string): boolean {
    return SKIPPED_FILE.test(path);
}

/** Heuristic binary check, the same one git uses: a NUL in the first 8 KiB. */
export function looksBinary(buf: Buffer): boolean {
    return buf.subarray(0, 8192).includes(0);
}
