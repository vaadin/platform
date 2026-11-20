/**
 * A release train, `major.minor`, e.g. 25.4. All version strings this job
 * reads or writes are derived from one of these, so the arithmetic lives in
 * exactly one place.
 */
export interface Train {
    readonly major: number;
    readonly minor: number;
}

/** Parse `X.Y`. Anything else (a patch, a qualifier, leading zeros) is rejected. */
export function parseTrain(value: string): Train {
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(value.trim());
    if (!match) throw new Error(`Expected a major.minor version such as 25.4, got "${value}"`);
    return { major: Number(match[1]), minor: Number(match[2]) };
}

/**
 * Derive the train from a platform release tag. Only `X.Y.0-beta1` qualifies:
 * that is the release that cuts the maintenance branch. Returns null for any
 * other tag so the caller can decide whether that is an error.
 */
export function trainFromBeta1Tag(tag: string): Train | null {
    const match = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.0-beta1$/.exec(tag.trim());
    return match ? { major: Number(match[1]), minor: Number(match[2]) } : null;
}

export function nextTrain(train: Train): Train {
    return { major: train.major, minor: train.minor + 1 };
}

/** `25.4` -- also the name of the maintenance branch. */
export function trainName(train: Train): string {
    return `${train.major}.${train.minor}`;
}

/** `25.4-SNAPSHOT` */
export function snapshotOf(train: Train): string {
    return `${trainName(train)}-SNAPSHOT`;
}

export function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches the train's SNAPSHOT as a whole token: `25.4-SNAPSHOT` but neither
 * `125.4-SNAPSHOT`, `1.25.4-SNAPSHOT` nor `25.40-SNAPSHOT`.
 */
export function snapshotTokenRegExp(train: Train): RegExp {
    return new RegExp(`(?<![\\w.])${escapeRegExp(snapshotOf(train))}(?![\\w.])`, "g");
}

/** A prerelease of the train, `X.Y.0-alpha1`/`-beta2`/`-rc1` (case-insensitive qualifier). */
export function prereleasePattern(train: Train): string {
    return `${escapeRegExp(trainName(train))}\\.0-(?:alpha|beta|rc)\\d+`;
}

/** True when `value` belongs to the train: a prerelease of it or its SNAPSHOT. */
export function belongsToTrain(value: string, train: Train): boolean {
    return new RegExp(`^(?:${prereleasePattern(train)}|${escapeRegExp(snapshotOf(train))})$`, "i").test(value);
}
