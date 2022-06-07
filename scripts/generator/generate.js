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

const corePackageTemplateFileName = getTemplateFilePath('template-vaadin-core-package.json');
const corePackageResultFileName = getResultsFilePath('vaadin-core-package.json');

const vaadinPackageTemplateFileName = getTemplateFilePath('template-vaadin-package.json');
const vaadinPackageResultFileName = getResultsFilePath('vaadin-package.json');

const mavenBomTemplateFileName = getTemplateFilePath('template-vaadin-bom.xml');
const mavenBomResultFileName = getResultsFilePath('vaadin-bom.xml');

const mavenSpringBomTemplateFileName = getTemplateFilePath('template-vaadin-spring-bom.xml');
const mavenSpringBomResultFileName = getResultsFilePath('vaadin-spring-bom.xml');

const releaseNotesTemplateFileName = getTemplateFilePath('template-release-notes.md');
const releaseNotesResultFileName = getResultsFilePath('release-notes.md');

const releaseNotesMaintenanceTemplateFileName = getTemplateFilePath('template-release-notes-maintenance.md');
const releaseNotesMaintenanceResultFileName = getResultsFilePath('release-notes-maintenance.md');

const releaseNotesPrereleaseTemplateFileName = getTemplateFilePath('template-release-notes-prerelease.md');
const releaseNotesPrereleaseResultFileName = getResultsFilePath('release-notes-prerelease.md');

const mavenPluginTemplatePomFileName = getTemplateFilePath('template-vaadin-maven-plugin-pom.xml');
const mavenPluginResultPomFileName = getResultsFilePath('vaadin-maven-plugin-pom.xml');

const hillaMavenPluginTemplatePomFileName = getTemplateFilePath('template-hilla-maven-plugin-pom.xml');
const hillaMavenPluginResultPomFileName = getResultsFilePath('hilla-maven-plugin-pom.xml');

const gradlePluginTemplatePomFileName = getTemplateFilePath('template-vaadin-gradle-plugin-pom.xml');
const gradlePluginResultPomFileName = getResultsFilePath('vaadin-gradle-plugin-pom.xml');

const gradlePortalPluginTemplatePomFileName = getTemplateFilePath('template-vaadin-gradle-plugin-portal-pom.xml');
const gradlePortalPluginResultPomFileName = getResultsFilePath('vaadin-gradle-plugin-portal-pom.xml');


const servletContainersTestsPomFileName = getTemplateFilePath('template-servlet-containers-tests-pom.xml');
const servletContainersTestsResultPomFileName = getResultsFilePath('vaadin-platform-servlet-containers-tests-pom.xml');

const mavenHillaBomTemplateFileName = getTemplateFilePath('template-hilla-bom.xml');
const mavenHillaBomResultFileName = getResultsFilePath('hilla-bom.xml');

const platform=argv['platform'];
const versions = transformer.transformVersions(inputVersions, platform, argv['useSnapshots']);

const hilla = process.env.HILLA || platform.replace(/^23/, 1);
versions.core.hilla = {javaVersion: hilla};

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

writer.writePackageJson(versions.core, corePackageTemplateFileName, corePackageResultFileName);
writer.writePackageJson(versions.vaadin, vaadinPackageTemplateFileName, vaadinPackageResultFileName);
writer.writeMaven(versions, mavenBomTemplateFileName, mavenBomResultFileName);
writer.writeMaven(versions, mavenHillaBomTemplateFileName, mavenHillaBomResultFileName);
writer.writeMaven(versions, mavenSpringBomTemplateFileName, mavenSpringBomResultFileName);
writer.writeReleaseNotes(versions, releaseNotesTemplateFileName, releaseNotesResultFileName);
writer.writeReleaseNotes(versions, releaseNotesMaintenanceTemplateFileName, releaseNotesMaintenanceResultFileName);
writer.writeReleaseNotes(versions, releaseNotesPrereleaseTemplateFileName, releaseNotesPrereleaseResultFileName);

writer.writeProperty(versions, "flow", mavenPluginTemplatePomFileName, mavenPluginResultPomFileName);
writer.writeProperty(versions, "flow", hillaMavenPluginTemplatePomFileName, hillaMavenPluginResultPomFileName);
writer.writeProperty(versions, "flow", gradlePluginTemplatePomFileName, gradlePluginResultPomFileName);
writer.writeProperty(versions, "flow", gradlePortalPluginTemplatePomFileName, gradlePortalPluginResultPomFileName);
writer.writeProperty(versions, "flow", servletContainersTestsPomFileName, servletContainersTestsResultPomFileName);

