import { Train, trainName } from "./version.js";

/** The colour most train repos already use for their `target/*` labels. */
export const DEFAULT_LABEL_COLOR = "7fe88f";

export interface Label {
    name: string;
    color: string;
    description: string | null;
}

/** `target/25.4` */
export function targetLabelName(train: Train): string {
    return `target/${trainName(train)}`;
}

function versionKey(name: string): number[] | null {
    const match = /^target\/(\d+)\.(\d+)$/.exec(name);
    return match ? [Number(match[1]), Number(match[2])] : null;
}

/**
 * Colour and description for a new `target/X.Y` label, copied from the newest
 * existing `target/<major.minor>` label so the repo's labels stay consistent.
 * `target/main` and other non-version labels are ignored. A description
 * mentioning the old branch is rewritten to the new one.
 */
export function labelTemplate(existing: readonly Label[], train: Train): { color: string; description: string } {
    let best: { label: Label; key: number[] } | null = null;
    for (const label of existing) {
        const key = versionKey(label.name);
        if (!key) continue;
        if (!best || key[0] > best.key[0] || (key[0] === best.key[0] && key[1] > best.key[1])) best = { label, key };
    }
    if (!best) return { color: DEFAULT_LABEL_COLOR, description: "" };
    const oldBranch = `${best.key[0]}.${best.key[1]}`;
    const description = (best.label.description ?? "").split(oldBranch).join(trainName(train));
    return { color: best.label.color.replace(/^#/, "").toLowerCase(), description };
}
