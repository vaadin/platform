const render = require('./replacer.js');

/**
@param {Object} versions data object for product versions.
@param {Object} bowerTemplate template data object to put versions to.
*/
function createBower(versions, bowerTemplate) {
    let jsDeps = {};
    for (let dep in versions) {
        if (versions[dep].jsVersion && !versions[dep].noDep) {
            jsDeps[dep] = `${dep}#${versions[dep].jsVersion}`;
        }
    }

    bowerTemplate.dependencies = jsDeps;

    return JSON.stringify(bowerTemplate, null, 2);
}

/**
@param {Object} versions data object for product versions.
@param {String} bowerTemplate template string to replace versions in.
*/
function createMaven(versions, mavenTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);

    let mavenDeps = '';
    for (let dependencyName in allVersions) {
        const dependency = allVersions[dependencyName];
        if (dependency.javaVersion && !dependency.noDep) {
            const propertyName = dependencyName.replace(/-/g, '.') + '.version';
            const mavenDependency = `        <${propertyName}>${dependency.javaVersion}</${propertyName}>\n`;
            mavenDeps = mavenDeps.concat(mavenDependency);
        }
    }

    const mavenData = Object.assign(versions, { javadeps: mavenDeps });

    const mavenBom = render(mavenTemplate, mavenData);

    return mavenBom;
}

/**
@param {Object} versions data object for product versions.
@param {String} releaseNoteTemplate template string to replace versions in.
*/
function createReleaseNotes(versions, releaseNoteTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);

    let componentVersions = '';
    for (let versionName in allVersions) {
        const version = allVersions[versionName];
        if (version.component) {
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
            componentVersions = componentVersions.concat(result);
        }
    }

    const releaseNoteData = Object.assign(versions, { components: componentVersions });
    return render(releaseNoteTemplate, releaseNoteData);
}

exports.createBower = createBower;
exports.createMaven = createMaven;
exports.createReleaseNotes = createReleaseNotes;
