const render = require('./replacer.js');
const request = require('sync-request');
const compareVersions = require('compare-versions');

/**
@param {Object} versions data object for product versions.
@param {Object} bowerTemplate template data object to put versions to.
*/
function createBower(versions, bowerTemplate) {
    let jsDeps = {};
    for (let [name, version] of Object.entries(versions)) {
        if (version.jsVersion) {
            jsDeps[name] = `${name}#${version.jsVersion}`;
        }
    }

    bowerTemplate.dependencies = jsDeps;

    return JSON.stringify(bowerTemplate, null, 2);
}

/**
@param {Object} versions data object for product versions.
@param {Object} packageJsonTemplate template data object to put versions to.
*/
function createPackageJson(versions, packageJsonTemplate) {
    let jsDeps = {};
    for (let [name, version] of Object.entries(versions)) {
        if (version.npmName) {
            const npmVersion = version.npmVersion || version.jsVersion;
            jsDeps[version.npmName] = "^" + npmVersion;
        }
    }

    packageJsonTemplate.dependencies = jsDeps;

    return JSON.stringify(packageJsonTemplate, null, 2);
}

/**
@param {Object} versions data object for product versions.
@param {String} mavenTemplate template string to replace versions in.
*/
function createMaven(versions, mavenTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);
    const includedProperties = computeUsedProperties(mavenTemplate);

    let mavenDeps = '';
    for (let [dependencyName, dependency] of Object.entries(allVersions)) {
        const propertyName = dependencyName.replace(/-/g, '.') + '.version';
        if (dependency.javaVersion && includedProperties.has(propertyName)) {
            const mavenDependency = `        <${propertyName}>${dependency.javaVersion}</${propertyName}>\n`;
            mavenDeps = mavenDeps.concat(mavenDependency);
        }
    }

    const mavenData = Object.assign(versions, { javadeps: mavenDeps });

    const mavenBom = render(mavenTemplate, mavenData);

    return mavenBom;
}

/**
 * @param {string} mavenTemplate template string
 * @returns {Set<string>} a set containing all maven properties used in the maven template
 */
function computeUsedProperties(mavenTemplate) {
    const mavenPropertyRegExp = /\${([^}]+)}/g;
    let currentMatch;
    const usedProperties = new Set();

    do {
        currentMatch = mavenPropertyRegExp.exec(mavenTemplate);
        if (currentMatch) {
            usedProperties.add(currentMatch[1]);
        }
    } while (currentMatch);

    return usedProperties;
}


/**
@param {Object} versions data object for product versions.
@param {String} releaseNoteTemplate template string to replace versions in.
*/
function createReleaseNotes(versions, releaseNoteTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);
    let componentVersions = '';
    for (let [versionName, version] of Object.entries(allVersions)) {
        if (version.component) {
            const result = buildComponentReleaseString(versionName, version);
            componentVersions = componentVersions.concat(result);
        }
    }
    
    const changed = getChangedSincePrevious(versions);

    const releaseNoteData = Object.assign(versions, { components: componentVersions }, { changesSincePrevious: changed });

    return render(releaseNoteTemplate, releaseNoteData);
}

/**
@param {Object} versions data object for product versions.
@param {String} modulesReleaseNoteTemplate template string to replace versions in.
*/
function createModulesReleaseNotes(versions, modulesReleaseNoteTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);
    let componentVersions = '';
    for (let [versionName, version] of Object.entries(allVersions)) {
        
        if (version.component) {
            const result = buildComponentReleaseNoteString(versionName, version);
            componentVersions = componentVersions.concat(result);
        }
    }
    
    const changed = getChangedReleaseNotesSincePrevious(versions);

    let modulesReleaseNotes = '';
    changed.split("\n").forEach((split) => {
        modulesReleaseNotes += split.substring(0, 1) == '#' || split == '' ? split+'\n\n' : '## '+requestGH(split)['name']+'\n\n'+requestGH(split)['body']+'\n\n';
    });
    
    const modulesReleaseNoteData = Object.assign(versions, { modulesReleaseNotes: modulesReleaseNotes });
    
    return render(modulesReleaseNoteTemplate, modulesReleaseNoteData);
}

function getChangedSincePrevious(versions) {
    const previousVersion = calculatePreviousVersion(versions.platform);
    if (!previousVersion) {
        return '';
    }
    const previousVersionsJson = requestGH(`https://raw.githubusercontent.com/vaadin/platform/${previousVersion}/versions.json`);
    if (!previousVersionsJson) {
        return '';
    }
    const allVersions = Object.assign({}, versions.core, versions.vaadin);
    const allPreviousVersions = Object.assign({}, previousVersionsJson.core, previousVersionsJson.vaadin, previousVersionsJson.community);
    const changesString = generateChangesString(allVersions, allPreviousVersions);    
    let result = '';
    if (changesString) {
        result = result.concat(`## Changes since [${previousVersion}](https://github.com/vaadin/platform/releases/tag/${previousVersion})\n`);
        result = result.concat(changesString);
    }
    return result;
}

function getChangedReleaseNotesSincePrevious(versions) {
    const previousVersion = calculatePreviousVersion(versions.platform);
    if (!previousVersion) {
        return '';
    }
    const previousVersionsJson = requestGH(`https://raw.githubusercontent.com/vaadin/platform/${previousVersion}/versions.json`);
    if (!previousVersionsJson) {
        return '';
    }
    const allVersions = Object.assign({}, versions.core, versions.vaadin);
    const allPreviousVersions = Object.assign({}, previousVersionsJson.core, previousVersionsJson.vaadin, previousVersionsJson.community);
    const changesString = getReleaseNotesForChanged(allVersions, allPreviousVersions);
    let result = '';
    if (changesString) {
        result = result.concat(`## Changes since [${previousVersion}](https://github.com/vaadin/platform/releases/tag/${previousVersion})\n`);
        result = result.concat(changesString);
    }
    return result;
}

function generateChangesString(allVersions, allPreviousVersions) {
    let javaChangedSincePreviousText = '';
    let componentChangedSincePreviousText = '';
    for (let [versionName, version] of Object.entries(allVersions)) {
        if (version.component) {
            const currentJSVersion = version.jsVersion;
            const currentJavaVersion = toSemVer(version.javaVersion);
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? previousVersionComponent.jsVersion : '0.0.0';
            const previousJavaVersion = previousVersionComponent ? toSemVer(previousVersionComponent.javaVersion) : '0.0.0';
            if (!previousVersionComponent || compareVersions(currentJSVersion, previousJSVersion) === 1 || compareVersions(currentJavaVersion, previousJavaVersion) === 1) {
                const result = buildComponentReleaseString(versionName, version);
                componentChangedSincePreviousText = componentChangedSincePreviousText.concat(result);
            }
        } else if (version.javaVersion) {
            const previousVersion = allPreviousVersions[versionName] ? allPreviousVersions[versionName].javaVersion : '0.0.0';
            const result = compareAndBuildJavaComponentReleaseString(versionName, version.javaVersion, previousVersion);
            javaChangedSincePreviousText = javaChangedSincePreviousText.concat(result);
        } else if (version.releasenotes && version.jsVersion) {
            const currentJSVersion = version.jsVersion;
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? previousVersionComponent.jsVersion : '0.0.0';
            if (!previousVersionComponent || compareVersions(currentJSVersion, previousJSVersion) === 1) {
                const result = buildComponentReleaseString(versionName, version);
                componentChangedSincePreviousText = componentChangedSincePreviousText.concat(result);
            }            
        }
    }
    let result = '';
    if (javaChangedSincePreviousText || componentChangedSincePreviousText) {
        result = result.concat(javaChangedSincePreviousText);
        result = result.concat(componentChangedSincePreviousText);
    }
    return result;
}

function getReleaseNotesForChanged(allVersions, allPreviousVersions) {
    let javaChangedSincePreviousText = '';
    let componentChangedSincePreviousText = '';
    for (let [versionName, version] of Object.entries(allVersions)) {
        if (version.component) {
            const currentJSVersion = version.jsVersion;
            const currentJavaVersion = toSemVer(version.javaVersion);
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? previousVersionComponent.jsVersion : '0.0.0';
            const previousJavaVersion = previousVersionComponent ? toSemVer(previousVersionComponent.javaVersion) : '0.0.0';
            if (!previousVersionComponent || compareVersions(currentJSVersion, previousJSVersion) === 1 || compareVersions(currentJavaVersion, previousJavaVersion) === 1) {
                const result = buildComponentReleaseNoteString(versionName, version);
                componentChangedSincePreviousText = componentChangedSincePreviousText.concat(result);
            }
        } else if (version.javaVersion) {
            const previousVersion = allPreviousVersions[versionName] ? allPreviousVersions[versionName].javaVersion : '0.0.0';
            const result = compareAndBuildJavaComponentReleaseNoteString(versionName, version.javaVersion, previousVersion);
            javaChangedSincePreviousText = javaChangedSincePreviousText.concat(result);
        } else if (version.releasenotes && version.jsVersion) {
            const currentJSVersion = version.jsVersion;
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? previousVersionComponent.jsVersion : '0.0.0';
            if (!previousVersionComponent || compareVersions(currentJSVersion, previousJSVersion) === 1) {
                const result = buildComponentReleaseNoteString(versionName, version);
                componentChangedSincePreviousText = componentChangedSincePreviousText.concat(result);
            }            
        }
    }
    let result = '';
    if (javaChangedSincePreviousText || componentChangedSincePreviousText) {
        result = result.concat(javaChangedSincePreviousText);
        result = result.concat(componentChangedSincePreviousText);
    }
    return result;
}


function calculatePreviousVersion(platformVersion) {
    const versionRegex = /((\d+\.\d+)\.(\d+))((\.(alpha|beta|rc))(\d+))?/g;
    const versionMatch = versionRegex.exec(platformVersion);

    if (!versionMatch) {
        return '';
    }
    // Only generate for maintenance releases.
    // Assumed that there will be no pre-releases of maintenance releases, e.g. 12.0.1.alphaX
    let previousVersion = '';
    if (versionMatch[3] > 0) {
        previousVersion = versionMatch[2] + '.' + (versionMatch[3] - 1);
    } else if (versionMatch[6] && versionMatch[7] > 1) {
        previousVersion = versionMatch[1] + '.' + versionMatch[6] + (versionMatch[7] - 1)
    }
    return previousVersion;
}

function compareAndBuildJavaComponentReleaseString(versionName, currentVersion, previousVersion) {
    let result = '';
    const currentVersionSemver = toSemVer(currentVersion);
    const previousVersionSemver = toSemVer(previousVersion);
    if (compareVersions(currentVersionSemver, previousVersionSemver) === 1) {
        result = getReleaseNoteLink(versionName, currentVersion);
    }
    return result;
}

function compareAndBuildJavaComponentReleaseNoteString(versionName, currentVersion, previousVersion) {
    let result = '';
    const currentVersionSemver = toSemVer(currentVersion);
    const previousVersionSemver = toSemVer(previousVersion);
    if (compareVersions(currentVersionSemver, previousVersionSemver) === 1) {
        result = getModulesReleaseNoteLink(versionName, currentVersion);
    }
    return result;
}

function toSemVer(version) {
    if (!version) {
        return '0.0.0';
    } else if (version.split('.').length - 1 === 3) {
        const index = version.lastIndexOf('.');
        return version.substr(0, index) + '-' + version.substr(index + 1);
    }
    return version;
}

function getReleaseNoteLink(name, version) {
    let releaseNoteLink = '';
    let title = '';
    switch (name) {
        case 'flow':
            title = 'Vaadin Flow';
            releaseNoteLink = 'https://github.com/vaadin/flow/releases/tag/';
            break;
        case 'flow-spring':
            title = 'Vaadin Spring Addon';
            releaseNoteLink = 'https://github.com/vaadin/spring/releases/tag/';
            break;
        case 'flow-cdi':
            title = 'Vaadin CDI Addon';
            releaseNoteLink = 'https://github.com/vaadin/cdi/releases/tag/';
            break;
        case 'mpr-v7':
        case 'mpr-v8':
            title = 'Vaadin Multiplatform Runtime **(Prime)** for Framework ' + name[name.length - 1];
            releaseNoteLink = 'https://github.com/vaadin/multiplatform-runtime/releases/tag/';
            break;
        case 'vaadin-designer':
            title = 'Vaadin Designer **(Pro)**';
            releaseNoteLink = 'https://github.com/vaadin/designer/releases/tag/';
            break;
        case 'vaadin-testbench':
            title = 'Vaadin TestBench **(Pro)**';
            releaseNoteLink = 'https://github.com/vaadin/testbench/releases/tag/';
            break;
        case 'gradle':
            title = 'Gradle plugin for Flow';
            releaseNoteLink = 'https://github.com/devsoap/gradle-vaadin-flow/releases/tag/';
            break;
        default:
            break;
    }

    return title ? `- ${title} ([${version}](${releaseNoteLink}${version}))\n` : '';
}

function getModulesReleaseNoteLink(name, version) {
    let releaseNoteLink = '';
    let title = '';
    switch (name) {
        case 'flow':
            title = 'Vaadin Flow';
            releaseNoteLink = 'https://api.github.com/repos/vaadin/flow/releases/tags/';
            break;
        case 'flow-spring':
            title = 'Vaadin Spring Addon';
            releaseNoteLink = 'https://api.github.com/repos/vaadin/spring/releases/tags/';
            break;
        case 'flow-cdi':
            title = 'Vaadin CDI Addon';
            releaseNoteLink = 'https://api.github.com/repos/vaadin/cdi/releases/tags/';
            break;
        case 'mpr-v7':
        case 'mpr-v8':
            title = 'Vaadin Multiplatform Runtime **(Prime)** for Framework ' + name[name.length - 1];
            releaseNoteLink = 'https://api.github.com/repos/vaadin/multiplatform-runtime/releases/tags/';
            break;
        case 'vaadin-designer':
            title = 'Vaadin Designer **(Pro)**';
            releaseNoteLink = 'https://api.github.com/repos/vaadin/designer/releases/tags/';
            break;
        case 'vaadin-testbench':
            title = 'Vaadin TestBench **(Pro)**';
            releaseNoteLink = 'https://api.github.com/repos/vaadin/testbench/releases/tags/';
            break;
        case 'gradle':
            title = 'Gradle plugin for Flow';
            releaseNoteLink = 'https://api.github.com/repos/devsoap/gradle-vaadin-flow/releases/tags/';
            break;
        default:
            break;
    }
    // return `${releaseNoteLink}${version}\n`;
    return title ? `# ${title}\n${releaseNoteLink}${version}\n` : '';
}

function buildComponentReleaseString(versionName, version) {
    const name = versionName
                .replace(/-/g, ' ')
                .replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});    
    //separated for readability
    let result = `- ${name} `;
    result = result.concat(version.pro ? '**(PRO)** ' : '');
    result = result.concat(version.javaVersion ? `([Flow integration ${version.javaVersion}](https://github.com/vaadin/${versionName}-flow/releases/tag/${version.javaVersion})` : '');
    result = result.concat((version.javaVersion && version.jsVersion) ? ', ' : '');
    result = result.concat((!version.javaVersion && version.jsVersion) ? '(' : '');
    result = result.concat(version.jsVersion ? `[web component v${version.jsVersion}](https://github.com/vaadin/${versionName}/releases/tag/v${version.jsVersion}))` : '');
    result = result.concat('\n');
    
    if(version.components){
        const componentsString = version.components.map(c => `  - ${c}`)
                                                   .join('\n');
        result = result.concat(componentsString);
        result = result.concat('\n');
    }
    return result;
}

function buildComponentReleaseNoteString(versionName, version) {
    const name = versionName
                .replace(/-/g, ' ')
                .replace(/(^|\s)[a-z]/g,function(f){return f.toUpperCase();});
    //separated for readability
    let result = `# ${name}\n`;
    //let result = '';
    //result = result.concat(version.pro ? '**(PRO)** ' : '');
    
    result = result.concat(version.javaVersion ? `## Java: ${version.javaVersion}\n` : '');
    result = result.concat(version.javaVersion ? `https://api.github.com/repos/vaadin/${versionName}-flow/releases/tags/${version.javaVersion}\n` : '');
    
    result = result.concat(version.jsVersion ? `## WebComponent: ${version.jsVersion}\n` : '');
    result = result.concat(version.jsVersion ? `https://api.github.com/repos/vaadin/${versionName}/releases/tags/v${version.jsVersion}\n` : '');

    return result;
}

function requestGH(path) {
    // TODO: use token to have higher rate limit
    const res = request('GET', path, {
        headers: {
            'user-agent': 'vaadin-platform',
        },
    });
    if (res.statusCode != 200) {
        return '';
    }
    let retValue = '';
    try {        
        retValue = JSON.parse(res.getBody('utf8'));
    } catch (error) {
        retValue = error;     
    }
    return retValue
}

exports.createBower = createBower;
exports.createPackageJson = createPackageJson;
exports.createMaven = createMaven;
exports.createReleaseNotes = createReleaseNotes;
// export for testing purpose
exports.generateChangesString = generateChangesString;
exports.calculatePreviousVersion = calculatePreviousVersion;
exports.createModulesReleaseNotes = createModulesReleaseNotes;