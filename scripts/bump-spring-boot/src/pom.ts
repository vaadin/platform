export const PROPERTY_NAME = "spring.boot.version";

// Deliberately a targeted string replace rather than an XML round-trip.
// Re-emitting the document with fast-xml-parser would reformat the entire pom
// (it has no builder wired up in this repo anyway), turning a one-line bump
// into an unreviewable diff.
const DECLARATION = /(<spring\.boot\.version>)(\s*[^<\s][^<]*?\s*)(<\/spring\.boot\.version>)/g;

export interface PomProperty {
    /** The version currently declared. */
    current: string;
    /** The pom source with the declaration rewritten to `next`. */
    replace(next: string): string;
}

/**
 * Locate the `spring.boot.version` declaration in a pom's source.
 *
 * All four target repos declare it exactly once, in the root pom, with every
 * other reference being `${spring.boot.version}` (37 consumers in flow alone).
 * That invariant is what makes a one-line replace safe -- so it is asserted
 * rather than assumed. Failing loudly here is much cheaper than silently
 * editing one of two declarations, or none at all: hilla's Gradle test builds
 * read this property out of the root pom with XmlSlurper and throw a
 * GradleException when it is missing.
 */
export function findSpringBootProperty(source: string, pomPath: string): PomProperty {
    const matches = [...source.matchAll(DECLARATION)];

    if (matches.length === 0) {
        throw new Error(`No <${PROPERTY_NAME}> declaration found in ${pomPath}`);
    }
    if (matches.length > 1) {
        const found = matches.map((m) => m[2].trim()).join(", ");
        throw new Error(
            `Expected exactly one <${PROPERTY_NAME}> declaration in ${pomPath}, found ${matches.length} (${found}). ` +
                `Refusing to guess which one to bump.`,
        );
    }

    const current = matches[0][2].trim();

    return {
        current,
        replace(next: string): string {
            // Preserve the original inner whitespace so the diff stays to the
            // version characters themselves.
            const replaced = source.replace(DECLARATION, (_all, open, inner, close) =>
                `${open}${inner.replace(current, next)}${close}`,
            );
            if (replaced === source) {
                throw new Error(`Replacing <${PROPERTY_NAME}> ${current} -> ${next} in ${pomPath} changed nothing`);
            }
            return replaced;
        },
    };
}
