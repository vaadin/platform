import test from "node:test";
import assert from "node:assert/strict";
import { findSpringBootProperty, PROPERTY_NAME } from "./pom.js";

// Shaped like the real root poms: platform/pom.xml:21, flow/pom.xml:103,
// hilla/pom.xml:87, copilot-internal/pom.xml:25.
const POM = `<project>
    <properties>
        <maven.compiler.target>21</maven.compiler.target>
        <spring.boot.version>4.0.7</spring.boot.version>
        <jakarta.ee.version>11.0.0</jakarta.ee.version>
    </properties>
    <dependencyManagement>
        <dependencies>
            <dependency>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-dependencies</artifactId>
                <version>\${spring.boot.version}</version>
                <type>pom</type>
                <scope>import</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>
</project>
`;

test("reads the declared version", () => {
    assert.equal(findSpringBootProperty(POM, "pom.xml").current, "4.0.7");
});

test("replaces only the declaration, leaving consumers untouched", () => {
    const out = findSpringBootProperty(POM, "pom.xml").replace("4.0.8");

    assert.match(out, /<spring\.boot\.version>4\.0\.8<\/spring\.boot\.version>/);
    assert.doesNotMatch(out, /4\.0\.7/);
    // The ${spring.boot.version} reference must survive verbatim.
    assert.match(out, /<version>\$\{spring\.boot\.version\}<\/version>/);
});

test("changes exactly one line", () => {
    const out = findSpringBootProperty(POM, "pom.xml").replace("4.0.8");
    const before = POM.split("\n");
    const after = out.split("\n");

    assert.equal(before.length, after.length);
    const changed = before.filter((line, i) => line !== after[i]);
    assert.deepEqual(changed, ["        <spring.boot.version>4.0.7</spring.boot.version>"]);
});

test("preserves surrounding whitespace style", () => {
    const spaced = "<properties>\n  <spring.boot.version> 4.0.7 </spring.boot.version>\n</properties>";
    const prop = findSpringBootProperty(spaced, "pom.xml");

    assert.equal(prop.current, "4.0.7");
    assert.match(prop.replace("4.0.8"), /<spring\.boot\.version> 4\.0\.8 <\/spring\.boot\.version>/);
});

test("throws when the property is absent", () => {
    assert.throws(
        () => findSpringBootProperty("<project><properties/></project>", "flow-components/pom.xml"),
        new RegExp(`No <${PROPERTY_NAME.replace(/\./g, "\.")}> declaration found in flow-components/pom\.xml`),
    );
});

test("refuses to guess when there are two declarations", () => {
    const twice = `<project>
    <properties><spring.boot.version>4.0.7</spring.boot.version></properties>
    <profiles><profile><properties><spring.boot.version>3.5.15</spring.boot.version></properties></profile></profiles>
</project>`;

    assert.throws(() => findSpringBootProperty(twice, "pom.xml"), /found 2 \(4\.0\.7, 3\.5\.15\)/);
});

test("ignores a property-reference-only pom", () => {
    // A child pom that only consumes the property must not look like a
    // declaration site.
    const consumer = "<project><dependency><version>${spring.boot.version}</version></dependency></project>";
    assert.throws(() => findSpringBootProperty(consumer, "child/pom.xml"), /No <spring\.boot\.version>/);
});
