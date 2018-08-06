const path = require('path');
const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));

const writer = require('./src/writer');
const transformer = require('./src/transformer');
const pomLookup = require('./src/pomLookup');

function determinePlatformVersion() {
    if (argv['platform']) {
        return argv['platform'];
    }

    console.log('Got no platform version specified in the parameter, using the parent pom file to determine it.');
    console.log('Specify the parameter as \'--platform=11.12.13\' to override the behavior.');

    const parentProjectVersion = pomLookup.getPlatformParentVersion();
    if (!parentProjectVersion) {
        console.error('Failed to find platform version. Either specify it as a script parameter or locate the parent pom correctly.');
        process.exit(1);
    }
    return parentProjectVersion;
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

const vaadinBowerTemplateFileName = getTemplateFilePath('template-vaadin-bower.json');
const vaadinBowerResultFileName = getResultsFilePath('vaadin-bower.json');

const mavenBomTemplateFileName = getTemplateFilePath('template-vaadin-bom.xml');
const mavenBomResultFileName = getResultsFilePath('vaadin-bom.xml');

const mavenSpringBomTemplateFileName = getTemplateFilePath('template-vaadin-spring-bom.xml');
const mavenSpringBomResultFileName = getResultsFilePath('vaadin-spring-bom.xml');

const releaseNotesTemplateFileName = getTemplateFilePath('template-release-notes.md');
const releaseNotesResultFileName = getResultsFilePath('release-notes.md');

const versions = transformer.transformVersions(inputVersions, determinePlatformVersion(), argv['useSnapshots']);

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

writer.writeBower(versions.core, coreBowerTemplateFileName, coreBowerResultFileName);
writer.writeBower(versions.vaadin, vaadinBowerTemplateFileName, vaadinBowerResultFileName);
writer.writeMaven(versions, mavenBomTemplateFileName, mavenBomResultFileName, pomLookup.getTransitiveWebJarsVersions(versions));
writer.writeMaven(versions, mavenSpringBomTemplateFileName, mavenSpringBomResultFileName);
writer.writeReleaseNotes(versions, releaseNotesTemplateFileName, releaseNotesResultFileName);
