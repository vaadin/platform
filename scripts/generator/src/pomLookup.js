const xml2js = require('xml2js');
const request = require('request');
const fs = require('fs');
const path = require('path');

const xmlParser = new xml2js.Parser();
const platformParentPom = path.resolve(`${__dirname}/../../../pom.xml`);

const repositories = ['https://repo1.maven.org/maven2/'];
let parentProjectVersion = null;

if (fs.existsSync(platformParentPom)) {
    xmlParser.parseString(fs.readFileSync(platformParentPom, "utf8"), (err, result) => {
        parentProjectVersion = result.project.version[0];
        repositories.push(...result.project.repositories[0].repository.map(repo => repo.url[0]));
    });
} else {
  console.error(`Failed to locate platform parent pom at ${platformParentPom}, no version info is available.`);
}

function getPlatformParentVersion() {
    return parentProjectVersion;
}

exports.getPlatformParentVersion = getPlatformParentVersion;