const creator = require('./creator');
const fs = require('fs');

/**
@param {Object} versions data object for product versions.
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeBower(versions, templateFileName, outputFileName) {
    const bowerTemplate = require(templateFileName);

    const bowerResult = creator.createBower(versions, bowerTemplate);

    fs.writeFileSync(outputFileName, bowerResult);
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
@param {String} templateFileName absolute path to template file
@param {String} outputFileName absolute path to output file
*/
function writeReleaseNotes(versions, templateFileName, outputFileName) {
    const releaseNoteTemplate = fs.readFileSync(templateFileName, 'utf8');

    const releaseNotes = creator.createReleaseNotes(versions, releaseNoteTemplate);

    fs.writeFileSync(outputFileName, releaseNotes);
    console.log(`Wrote ${outputFileName}`);
}

exports.writeBower = writeBower;
exports.writeMaven = writeMaven;
exports.writeReleaseNotes = writeReleaseNotes;
