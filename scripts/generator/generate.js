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
const resultsDir = './results';

const inputVersions = require(versionsFileName);

function getTemplateFilePath(filename) {
    return path.resolve(`${__dirname}/templates/${filename}`);
}

function getResultsFilePath(filename) {
    return path.resolve(`${__dirname}/results/${filename}`);
}

const coreBowerTemplateFileName = getTemplateFilePath('template-vaadin-core-bower.json');
const coreBowerResultFileName = getResultsFilePath('vaadin-core-bower.json');

const vaadinBowerTemplateFileName = getTemplateFilePath('template-vaadin-bower.json');
const vaadinBowerResultFileName = getResultsFilePath('vaadin-bower.json');

const mavenBomTemplateFileName = getTemplateFilePath('template-vaadin-bom.xml');
const mavenBomResultFileName = getResultsFilePath('vaadin-bom.xml');

const releaseNotesTemplateFileName = getTemplateFilePath('template-release-notes.md');
const releaseNotesResultFileName = getResultsFilePath('release-notes.md');

const versions = transformer.transformVersions(inputVersions, argv['platform'], argv['useSnapshots']);

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

writer.writeBower(versions.core, coreBowerTemplateFileName, coreBowerResultFileName);
writer.writeBower(versions.vaadin, vaadinBowerTemplateFileName, vaadinBowerResultFileName);
writer.writeMaven(versions, mavenBomTemplateFileName, mavenBomResultFileName);
writer.writeReleaseNotes(versions, releaseNotesTemplateFileName, releaseNotesResultFileName);
