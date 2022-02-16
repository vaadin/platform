const creator = require('./creator');
const fs = require('fs');

/**
@param {Object} versions data object for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writePackageJson(versions, templateFileName, outputFileName) {
    const packageJsonTemplate = require(templateFileName);

    const packageJsonResult = creator.createPackageJson(versions, packageJsonTemplate);

    fs.writeFileSync(outputFileName, packageJsonResult);
    console.log(`Wrote ${outputFileName}`);
}
/**
@param {Spring} string for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writePackageVersion(version, templateFileName, outputFileName) {
    const packageJsonTemplate = require(templateFileName);
    packageJsonTemplate.version = version;
    packageJsonTemplate.devDependencies["@vaadin/vaadin"] = version;
    const packageJsonResult = JSON.stringify(packageJsonTemplate, null, 2);

    fs.writeFileSync(outputFileName, packageJsonResult);
    console.log(`Wrote ${outputFileName}`);
}

/**
@param {Object} versions data object for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeMaven(versions, templateFileName, outputFileName) {
    const mavenTemplate = fs.readFileSync(templateFileName, 'utf8');

    const mavenBom = creator.createMaven(versions, mavenTemplate);

    fs.writeFileSync(outputFileName, mavenBom);
    console.log(`Wrote ${outputFileName}`);
}

/**
@param {Object} versions data object for product versions.
@param {String} the module name for this property
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeProperty(versions, module, templateFileName, outputFileName) {
    const mavenTemplate = fs.readFileSync(templateFileName, 'utf8');

    const mavenBom = creator.addProperty(versions, module, mavenTemplate);

    fs.writeFileSync(outputFileName, mavenBom);
    console.log(`Wrote ${outputFileName}`);
}

/**
@param {Object} versions data object for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeReleaseNotes(versions, templateFileName, outputFileName) {
    const releaseNoteTemplate = fs.readFileSync(templateFileName, 'utf8');
    const releaseNotes = creator.createReleaseNotes(versions, releaseNoteTemplate);

    fs.writeFileSync(outputFileName, releaseNotes);
    console.log(`Wrote ${outputFileName}`);
}

/**
@param {Object} versions data object for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeModulesReleaseNotes(versions, templateFileName, outputFileName) {
    const modulesReleaseNoteTemplate = fs.readFileSync(templateFileName, 'utf8');
    const modulesReleaseNotes = creator.createModulesReleaseNotes(versions, modulesReleaseNoteTemplate);

    fs.writeFileSync(outputFileName, modulesReleaseNotes);
    console.log(`Wrote ${outputFileName}`);
}

exports.writePackageJson = writePackageJson;
exports.writePackageVersion = writePackageVersion;
exports.writeMaven = writeMaven;
exports.writeProperty = writeProperty;
exports.writeReleaseNotes = writeReleaseNotes;
exports.writeModulesReleaseNotes = writeModulesReleaseNotes;
