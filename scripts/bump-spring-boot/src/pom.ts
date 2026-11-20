export const PROPERTY_NAME = "spring.boot.version";

/** Spring Data Commons, declared directly by flow-components (no spring.boot.version there). */
export const SPRING_DATA_COMMONS_PROPERTY = "spring-data-commons.version";

/** Every property this job knows how to bump, in the order they are reported. */
export const SUPPORTED_PROPERTIES = [PROPERTY_NAME, SPRING_DATA_COMMONS_PROPERTY] as const;
export type SupportedProperty = (typeof SUPPORTED_PROPERTIES)[number];

export interface PomProperty {
    /** The property name, e.g. `spring.boot.version`. */
    name: string;
    /** The version currently declared. */
    current: string;
    /** The pom source with the declaration rewritten to `next`. */
    replace(next: string): string;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Deliberately a targeted string replace rather than an XML round-trip.
// Re-emitting the document with fast-xml-parser would reformat the entire pom
// (it has no builder wired up in this repo anyway), turning a one-line bump
// into an unreviewable diff.
function declarationPattern(name: string): RegExp {
    const tag = escapeRegExp(name);
    return new RegExp(`(<${tag}>)(\\s*[^<\\s][^<]*?\\s*)(</${tag}>)`, "g");
}

/**
 * Locate the single declaration of property `name` in a pom's source, or
 * return `null` when the pom does not declare it at all.
 *
 * Every target repo declares each property it uses exactly once, in the root
 * pom, with every other reference being `${name}`. That invariant is what
 * makes a one-line replace safe -- so two declarations are an error rather
 * than a guess.
 */
export function findOptionalProperty(source: string, name: string, pomPath: string): PomProperty | null {
    const pattern = declarationPattern(name);
    const matches = [...source.matchAll(pattern)];

    if (matches.length === 0) return null;
    if (matches.length > 1) {
        const found = matches.map((m) => m[2].trim()).join(", ");
        throw new Error(
            `Expected exactly one <${name}> declaration in ${pomPath}, found ${matches.length} (${found}). ` +
                `Refusing to guess which one to bump.`,
        );
    }

    const current = matches[0][2].trim();

    return {
        name,
        current,
        replace(next: string): string {
            // Preserve the original inner whitespace so the diff stays to the
            // version characters themselves.
            const replaced = source.replace(pattern, (_all, open, inner, close) =>
                `${open}${inner.replace(current, next)}${close}`,
            );
            if (replaced === source) {
                throw new Error(`Replacing <${name}> ${current} -> ${next} in ${pomPath} changed nothing`);
            }
            return replaced;
        },
    };
}

/** Like `findOptionalProperty`, but a missing declaration is an error. */
export function findProperty(source: string, name: string, pomPath: string): PomProperty {
    const property = findOptionalProperty(source, name, pomPath);
    if (!property) throw new Error(`No <${name}> declaration found in ${pomPath}`);
    return property;
}

/**
 * Locate the `spring.boot.version` declaration. Failing loudly when it is
 * missing matters for hilla, whose Gradle test builds read this property out
 * of the root pom with XmlSlurper and throw a GradleException without it.
 */
export function findSpringBootProperty(source: string, pomPath: string): PomProperty {
    return findProperty(source, PROPERTY_NAME, pomPath);
}
