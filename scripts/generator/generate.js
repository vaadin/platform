const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const writer = require('./src/writer');
const transformer = require('./src/transformer');

if (!argv['platform']) {
    console.log('Specify platform version as \'--platform=11.12.13\'');
    process.exit(1);
}

if (!argv['versions']) {
    console.log('Specify product version file as \'--versions=versions.json\'');
    process.exit(1);
}

const versionsFileName = path.resolve(argv['versions']);
const resultsDir = path.resolve(`${__dirname}/results`);

const inputVersions = require(versionsFileName);

function getTemplateFilePath(filename) {
    return path.resolve(`${__dirname}/templates/${filename}`);
}

function getResultsFilePath(filename) {
    return path.resolve(`${__dirname}/results/${filename}`);
}

const coreBowerTemplateFileName = getTemplateFilePath('template-vaadin-core-bower.json');
const coreBowerResultFileName = getResultsFilePath('vaadin-core-bower.json');

const corePackageTemplateFileName = getTemplateFilePath('template-vaadin-core-package.json');
const corePackageResultFileName = getResultsFilePath('vaadin-core-package.json');

const vaadinBowerTemplateFileName = getTemplateFilePath('template-vaadin-bower.json');
const vaadinBowerResultFileName = getResultsFilePath('vaadin-bower.json');

const vaadinPackageTemplateFileName = getTemplateFilePath('template-vaadin-package.json');
const vaadinPackageResultFileName = getResultsFilePath('vaadin-package.json');

const mavenBomTemplateFileName = getTemplateFilePath('template-vaadin-bom.xml');
const mavenBomResultFileName = getResultsFilePath('vaadin-bom.xml');

const mavenSpringBomTemplateFileName = getTemplateFilePath('template-vaadin-spring-bom.xml');
const mavenSpringBomResultFileName = getResultsFilePath('vaadin-spring-bom.xml');

const mavenPlatformTestTemplateFileName = getTemplateFilePath('template-vaadin-platform-test-pom.xml');
const mavenPlatformTestResultFileName = getResultsFilePath('vaadin-platform-test-pom.xml');

const releaseNotesTemplateFileName = getTemplateFilePath('template-release-notes.md');
const releaseNotesResultFileName = getResultsFilePath('release-notes.md');

const versions = transformer.transformVersions(inputVersions, argv['platform'], argv['useSnapshots']);

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

writer.writeBower(versions.core, coreBowerTemplateFileName, coreBowerResultFileName);
writer.writePackageJson(versions.core, corePackageTemplateFileName, corePackageResultFileName);
writer.writeBower(versions.vaadin, vaadinBowerTemplateFileName, vaadinBowerResultFileName);
writer.writePackageJson(versions.vaadin, vaadinPackageTemplateFileName, vaadinPackageResultFileName);
writer.writeMaven(versions, mavenBomTemplateFileName, mavenBomResultFileName);
writer.writeMaven(versions, mavenSpringBomTemplateFileName, mavenSpringBomResultFileName);
writer.writeMaven(versions, mavenPlatformTestTemplateFileName, mavenPlatformTestResultFileName);
writer.writeReleaseNotes(versions, releaseNotesTemplateFileName, releaseNotesResultFileName);
