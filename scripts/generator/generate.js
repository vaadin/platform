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

const coreJsonTemplateFileName = getTemplateFilePath('template-vaadin-core-versions.json');
const vaadinCoreJsonFileName = getResultsFilePath('vaadin-core-versions.json');

const vaadinJsonTemplateFileName = getTemplateFilePath('template-vaadin-versions.json');
const vaadinJsonResultFileName = getResultsFilePath('vaadin-versions.json');

const corePackageTemplateFileName = getTemplateFilePath('template-vaadin-core-package.json');
const corePackageResultFileName = getResultsFilePath('vaadin-core-package.json');

const vaadinPackageTemplateFileName = getTemplateFilePath('template-vaadin-package.json');
const vaadinPackageResultFileName = getResultsFilePath('vaadin-package.json');

const mavenBomTemplateFileName = getTemplateFilePath('template-vaadin-bom.xml');
const mavenBomResultFileName = getResultsFilePath('vaadin-bom.xml');

const mavenVaadinPomTemplateFileName = getTemplateFilePath('template-vaadin-pom.xml');
const mavenVaadinPomResultFileName = getResultsFilePath('vaadin-pom.xml');

const mavenSpringBomTemplateFileName = getTemplateFilePath('template-vaadin-spring-bom.xml');
const mavenSpringBomResultFileName = getResultsFilePath('vaadin-spring-bom.xml');

const releaseNotesTemplateFileName = getTemplateFilePath('template-release-notes.md');
const releaseNotesResultFileName = getResultsFilePath('release-notes.md');

const releaseNotesMaintenanceTemplateFileName = getTemplateFilePath('template-release-notes-maintenance.md');
const releaseNotesMaintenanceResultFileName = getResultsFilePath('release-notes-maintenance.md');

const releaseNotesPrereleaseTemplateFileName = getTemplateFilePath('template-release-notes-prerelease.md');
const releaseNotesPrereleaseResultFileName = getResultsFilePath('release-notes-prerelease.md');

const modulesReleaseNotesFileName = getTemplateFilePath('template-modules-release-notes.md');
const modulesReleaseNotesResultFileName = getResultsFilePath('modules-release-notes.md');

const mavenPluginTemplatePomFileName = getTemplateFilePath('template-vaadin-maven-plugin-pom.xml');
const mavenPluginResultPomFileName = getResultsFilePath('vaadin-maven-plugin-pom.xml');

const gradlePluginTemplatePomFileName = getTemplateFilePath('template-vaadin-gradle-plugin-pom.xml');
const gradlePluginResultPomFileName = getResultsFilePath('vaadin-gradle-plugin-pom.xml');

const gradlePortalPluginTemplatePomFileName = getTemplateFilePath('template-vaadin-gradle-plugin-portal-pom.xml');
const gradlePortalPluginResultPomFileName = getResultsFilePath('vaadin-gradle-plugin-portal-pom.xml');

const platformJavadocTemplatePomFileName = getTemplateFilePath('template-vaadin-platform-javadoc-pom.xml');
const platformJavadocResultPomFileName = getResultsFilePath('vaadin-platform-javadoc-pom.xml');

const servletContainersTestsPomFileName = getTemplateFilePath('template-servlet-containers-tests-pom.xml');

const devBundleTemplateFileName = getTemplateFilePath('template-dev-bundle-pom.xml');
const devBundlePomResultFileName = getResultsFilePath('vaadin-dev-bundle-pom.xml');

const hybridDevBundleTemplateFileName = getTemplateFilePath('template-hybrid-dev-bundle-pom.xml');
const hybridDevBundlePomResultFileName = getResultsFilePath('vaadin-hybrid-dev-bundle-pom.xml');

const prodBundleTemplateFileName = getTemplateFilePath('template-prod-bundle-pom.xml');
const prodBundlePomResultFileName = getResultsFilePath('vaadin-prod-bundle-pom.xml');

const vaadinQuarkusTemplateFileName = getTemplateFilePath('template-vaadin-quarkus-pom.xml');
const vaadinQuarkusPomResultFileName = getResultsFilePath('vaadin-quarkus-pom.xml');

const platform=argv['platform'];
const versions = transformer.transformVersions(inputVersions, platform, argv['useSnapshots']);

if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
}

writer.writeSeparateJson(versions.bundles, coreJsonTemplateFileName, vaadinCoreJsonFileName, "bundles");
writer.writeSeparateJson(versions.core, coreJsonTemplateFileName, vaadinCoreJsonFileName, "core");
writer.writeNestedSeparateJson(versions.react['react-components'], coreJsonTemplateFileName, vaadinCoreJsonFileName, "core", "react", "react-components");
writer.writeSeparateJson(versions.platform, coreJsonTemplateFileName, vaadinCoreJsonFileName, "platform");

writer.writeSeparateJson(versions.vaadin, vaadinJsonTemplateFileName, vaadinJsonResultFileName, "vaadin");
writer.writeNestedSeparateJson(versions.react['react-components-pro'], vaadinJsonTemplateFileName, vaadinJsonResultFileName, "vaadin", "react", "react-components-pro");
writer.writeSeparateJson(versions.platform, vaadinJsonTemplateFileName, vaadinJsonResultFileName, "platform");

writer.writePackageJson(versions.core, corePackageTemplateFileName, corePackageResultFileName);
writer.writePackageJson(versions.vaadin, vaadinPackageTemplateFileName, vaadinPackageResultFileName);
writer.writeMaven(versions, mavenVaadinPomTemplateFileName, mavenVaadinPomResultFileName);
writer.writeMaven(versions, mavenBomTemplateFileName, mavenBomResultFileName);
writer.writeMaven(versions, mavenSpringBomTemplateFileName, mavenSpringBomResultFileName);
writer.writeReleaseNotes(versions, releaseNotesTemplateFileName, releaseNotesResultFileName);
writer.writeReleaseNotes(versions, releaseNotesMaintenanceTemplateFileName, releaseNotesMaintenanceResultFileName);
writer.writeReleaseNotes(versions, releaseNotesPrereleaseTemplateFileName, releaseNotesPrereleaseResultFileName);
if(!versions.platform.includes('SNAPSHOT')){
  writer.writeModulesReleaseNotes(versions, versions.platform, modulesReleaseNotesFileName, modulesReleaseNotesResultFileName);
}

writer.writeProperty(versions, ["flow","hilla"], mavenPluginTemplatePomFileName, mavenPluginResultPomFileName);
writer.writeProperty(versions, ["flow","hilla"], gradlePluginTemplatePomFileName, gradlePluginResultPomFileName);
writer.writeProperty(versions, ["hilla"], gradlePortalPluginTemplatePomFileName, gradlePortalPluginResultPomFileName);
writer.writeProperty(versions, ["flow"], platformJavadocTemplatePomFileName, platformJavadocResultPomFileName);

writer.writeProperty(versions, ["flow", "hilla"], devBundleTemplateFileName, devBundlePomResultFileName);
writer.writeProperty(versions, ["flow", "hilla"], hybridDevBundleTemplateFileName, hybridDevBundlePomResultFileName);
writer.writeProperty(versions, ["flow", "flow-components"], prodBundleTemplateFileName, prodBundlePomResultFileName);
writer.writeProperty(versions, ["vaadin-quarkus"], vaadinQuarkusTemplateFileName, vaadinQuarkusPomResultFileName);
writer.writeMaven(versions, devBundleTemplateFileName, devBundlePomResultFileName);
writer.writeMaven(versions, hybridDevBundleTemplateFileName, hybridDevBundlePomResultFileName);
writer.writeMaven(versions, vaadinQuarkusTemplateFileName, vaadinQuarkusPomResultFileName);

