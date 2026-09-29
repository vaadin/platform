const expect = require('chai').expect;
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const jarVersions = require('../src/jarVersions.js');

describe('Jar pinned versions', function () {
    let tempDirs = [];

    function tempDir(prefix) {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
        tempDirs.push(dir);
        return dir;
    }

    // Writes a jar holding one versions file, the way a component jar does
    function writeJar(dir, name, versions) {
        const content = tempDir('jar-content-');
        const folder = path.join(content, 'META-INF', 'VAADIN', 'versions');
        fs.mkdirSync(folder, { recursive: true });
        fs.writeFileSync(path.join(folder, 'versions.json'), JSON.stringify(versions));
        childProcess.execFileSync('jar', ['cf', path.join(dir, name), '-C', content, 'META-INF']);
    }

    afterEach(function () {
        tempDirs.forEach((dir) => fs.rmSync(dir, { recursive: true, force: true }));
        tempDirs = [];
    });

    it('should add the packages the jars pin', function () {
        const versions = {
            "text-area": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-area"
            }
        };

        const result = jarVersions.withPinnedVersions(versions, {
            "@vaadin/text-field": "25.4.1",
            "@vaadin/text-area": "25.4.1"
        });

        expect(result).to.deep.equal({
            "text-area": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-area"
            },
            "text-field": {
                "jsVersion": "25.4.1",
                "npmName": "@vaadin/text-field"
            }
        });
    });

    it('should split the packages the jars pin between the two npm packages', function () {
        const result = jarVersions.splitPinnedVersions(
            {
                "@vaadin/text-field": "25.4.0",
                "@vaadin/charts": "25.4.0",
                "date-fns": "4.1.0"
            },
            ["@vaadin/charts", "@vaadin/crud"]
        );

        expect(result).to.deep.equal({
            core: { "@vaadin/text-field": "25.4.0" },
            vaadin: { "@vaadin/charts": "25.4.0" }
        });
    });

    it('should count every package as a core one when none is said to be commercial', function () {
        const result = jarVersions.splitPinnedVersions(
            {
                "@vaadin/text-field": "25.4.0",
                "@vaadin/charts": "25.4.0"
            },
            []
        );

        expect(result).to.deep.equal({
            core: {
                "@vaadin/text-field": "25.4.0",
                "@vaadin/charts": "25.4.0"
            },
            vaadin: {}
        });
    });

    it('should collect the artifact ids of the modules a repository builds', function () {
        const root = tempDir('own-artifacts-');
        fs.mkdirSync(path.join(root, 'module'));
        fs.mkdirSync(path.join(root, 'module', 'target'));
        fs.writeFileSync(path.join(root, 'pom.xml'),
            '<project><artifactId>platform-parent</artifactId></project>');
        fs.writeFileSync(path.join(root, 'module', 'pom.xml'),
            '<project><parent><artifactId>platform-parent</artifactId></parent>' +
            '<!-- <artifactId>commented-out</artifactId> -->' +
            '<artifactId>vaadin-core-internal</artifactId></project>');
        fs.writeFileSync(path.join(root, 'module', 'target', 'pom.xml'),
            '<project><artifactId>built-copy</artifactId></project>');

        const ids = jarVersions.collectOwnArtifactIds(root);

        expect([...ids].sort()).to.deep.equal(['platform-parent', 'vaadin-core-internal']);
    });

    it('should not read the jars of the artifacts left out', function () {
        this.timeout(30000);
        const dir = tempDir('jars-');
        writeJar(dir, 'vaadin-core-25.4-SNAPSHOT.jar', {
            button: { jsVersion: '25.4.0', mode: 'lit', npmName: '@vaadin/button' }
        });
        writeJar(dir, 'vaadin-core-internal-25.4-SNAPSHOT.jar', {
            react: {
                'react-components': { jsVersion: '0.0.1', mode: 'react', npmName: '@vaadin/react-components' }
            }
        });
        writeJar(dir, 'vaadin-core-internal-25.3.0.jar', {
            'text-field': { jsVersion: '25.3.0', mode: 'lit', npmName: '@vaadin/text-field' }
        });

        const entries = jarVersions.readPinnedEntries('25.4-SNAPSHOT', dir, new Set(['vaadin-core-internal']));

        // A jar whose artifact id only starts like a left out one is read, and
        // a jar of another version is not read at all
        expect(Object.keys(entries)).to.deep.equal(['@vaadin/button']);
    });

    it('should leave the versions alone when no jar pins a package', function () {
        const versions = {
            "text-field": {
                "jsVersion": "25.4.0",
                "mode": "lit",
                "npmName": "@vaadin/text-field"
            }
        };

        const result = jarVersions.withPinnedVersions(versions, {});

        expect(result).to.deep.equal(versions);
    });
});
