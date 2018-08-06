const xml2js = require('xml2js');
const request = require('sync-request');
const fs = require('fs');
const path = require('path');

const xmlParser = new xml2js.Parser({explicitArray: false});
const xmlBuilder = new xml2js.Builder({headless: true});

const platformParentPom = path.resolve(`${__dirname}/../../../pom.xml`);
const flowComponentBaseName = 'flow-component-base';

const repositories = ['https://repo1.maven.org/maven2/'];
let parentProjectVersion = null;

if (fs.existsSync(platformParentPom)) {
    xmlParser.parseString(fs.readFileSync(platformParentPom, "utf8"), (err, result) => {
        parentProjectVersion = result.project.version;
        repositories.push(...result.project.repositories.repository.map(repo => repo.url).map(url => url.endsWith('/') ? url : url + '/'));
    });
} else {
  console.error(`Failed to locate platform parent pom at ${platformParentPom}, no version info is available.`);
}

function getPlatformParentVersion() {
    return parentProjectVersion;
}

function createMavenUrl(packageName, packageVersion) {
    return `com/vaadin/${packageName}/${packageVersion}/${packageName}-${packageVersion}.pom`;
}

function getMavenUrls(versions) {
    const mavenUrls = [];
    for (const [name, properties] of Object.entries(versions.core)) {
        if (name.startsWith('vaadin-') && properties.javaVersion) {
            mavenUrls.push(createMavenUrl(`${name}-flow`, properties.javaVersion));
        }
    }
    return mavenUrls;
}

function getTransitiveWebJarsVersions(versions) {
    let flowComponentBaseVersion;

    for (const mavenUrl of getMavenUrls(versions)) {
        // TODO kb don't traverse the repositories every time, make the one where the artifact was found as the first one
        for (const repository of repositories) {
            const response = request('GET', repository + mavenUrl);
            if (response.statusCode === 200) {
                const body = response.getBody().toString('utf8');
                xmlParser.parseString(body, (err, result) => {
                    const parentDeclaration = result.project.parent;
                    if (parentDeclaration.artifactId === flowComponentBaseName) {
                        if (!flowComponentBaseVersion || (flowComponentBaseVersion < parentDeclaration.version)) {
                          flowComponentBaseVersion = parentDeclaration.version;
                        }
                    }
                });
            }
        }
    }

    if (!flowComponentBaseVersion) {
        throw new Error(`Could not find any core dependency with ${flowComponentBaseName} declared as a parent, unable to extract transitive dependencies information`);
    }

    let resultingDependencies = '';
    for (const repository of repositories) {
        const response = request('GET', repository + createMavenUrl(flowComponentBaseName, flowComponentBaseVersion));
        if (response.statusCode === 200) {
            const body = response.getBody().toString('utf8');
            xmlParser.parseString(body, (err, result) => {
                resultingDependencies = result.project.dependencyManagement.dependencies.dependency
                    .map(dependency => ({dependency}))
                    .map(dependencyObject => xmlBuilder.buildObject(dependencyObject))
                    .reduce((dependency1, dependency2) => dependency1 + '\n' + dependency2);
            });
        }
    }
    return resultingDependencies;
}

exports.getPlatformParentVersion = getPlatformParentVersion;
exports.getTransitiveWebJarsVersions = getTransitiveWebJarsVersions;
