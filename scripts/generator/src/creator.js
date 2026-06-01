const render = require('./replacer.js');
const request = require('sync-request');
const compareVersions = require('compare-versions');

/**
@param {Object} versions data object for product versions.
@param {String} key name for the generated json object
@param {Object} jsonTemplate template data object to put versions to.
*/
function createJson(versions, key, jsonTemplate) {

    jsonTemplate[key] = versions;

    return JSON.stringify(jsonTemplate, null, 4);
}

function createNestedJson(versions, key, nestedKey, nestedKey2, jsonTemplate) {

    jsonTemplate[key][nestedKey] = {}

    jsonTemplate[key][nestedKey][nestedKey2] = versions;

    return JSON.stringify(jsonTemplate, null, 4);
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
            if (version.npmName.startsWith("@vaadin")) {
                jsDeps[version.npmName] = npmVersion;
            } else {
                jsDeps[version.npmName] = "^" + npmVersion;
            }
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
    const allVersions = Object.assign({}, versions.core, versions.vaadin, versions.kits);
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
@param {Object} versions data object for product version.
@param {String} module for the version.
@param {String} mavenTemplate template string to replace versions in.
*/
function addProperty(versions, modules, mavenTemplate) {
    const allVersions = Object.assign({}, versions.core, versions.vaadin);

    const property = computeUsedProperties(mavenTemplate);
    let mavenDeps = '';
    for (let module of modules){
        for (let [dependencyName, dependency] of Object.entries(allVersions)) {
            const propertyName = module.replace(/-/g, '.') + '.version';

            if (dependency.javaVersion && dependencyName === module){
                const mavenDependency = `        <${propertyName}>${dependency.javaVersion}</${propertyName}>\n`;
                mavenDeps = mavenDeps.concat(mavenDependency);
            }
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

    const changelogs = generateMaintenanceChangelog(versions);
    let releaseNoteData;
    if(!versions.platform.includes("SNAPSHOT")){
        const componentNote = getComponentReleaseNote(versions.platform);
        releaseNoteData = Object.assign(versions, { components: componentVersions, componentNote: componentNote, changelogs: changelogs });
    } else {
        releaseNoteData = Object.assign(versions, { components: componentVersions, changelogs: changelogs });
    }

    return render(releaseNoteTemplate, releaseNoteData);
}

const MODULE_CATEGORIES = [
    { title: 'Flow & Hilla', modules: ['flow', 'hilla'] },
    { title: 'Design System', modules: ['web-components', 'flow-components'] },
    { title: 'Testing', modules: ['testbench', 'browserless-test'] },
    { title: 'Tools', modules: ['copilot', 'designer'] },
    { title: 'Kits', modules: ['appsec-kit', 'azure-kit', 'collaboration-kit', 'kubernetes-kit', 'observability-kit', 'sso-kit', 'swing-kit'] },
    { title: 'Runtime', modules: ['multiplatform-runtime', 'vaadin-router'] },
];

// Modules that ship with the platform but whose GitHub release tag is not linked
// from the platform release body. Fetched directly from their repos using the
// version recorded in versions.json.
const ADDITIONAL_MODULES = [
    { name: 'copilot', getVersion: v => v.kits && v.kits.copilot && v.kits.copilot.javaVersion },
    { name: 'browserless-test', getVersion: v => v.core && v.core['browserless-test'] && v.core['browserless-test'].javaVersion },
];

const NOISY_HEADING_PATTERN = /\b(internal|chores?|dependency|dependencies|tests?|documentation|polish|maintenance)\b/i;

const EMOJI_SHORTCODES = {
    boom: '💥', rocket: '🚀', bug: '🐛', nail_care: '💅',
    memo: '📝', microscope: '🔬', house: '🏠', warning: '⚠️',
    sparkles: '✨', tada: '🎉', wrench: '🔧', lock: '🔒',
    zap: '⚡', fire: '🔥', hammer: '🔨', package: '📦',
    art: '🎨', construction: '🚧', new: '🆕', books: '📚',
};

function generateMaintenanceChangelog(versions) {
    const previousPlatform = calculatePreviousVersion(versions.platform);
    if (!previousPlatform) {
        return '';
    }
    if (_changelogCache[versions.platform] !== undefined) {
        return _changelogCache[versions.platform];
    }

    const previousVersionsRaw = requestGH(`https://raw.githubusercontent.com/vaadin/platform/${previousPlatform}/versions.json`);
    if (!previousVersionsRaw) {
        _changelogCache[versions.platform] = '';
        return '';
    }
    const previousVersionsString = JSON.stringify(previousVersionsRaw).replace(/{{version}}/g, previousPlatform);
    const previousVersions = JSON.parse(previousVersionsString);

    const changedLines = [];
    const unchangedLines = [];
    for (const spec of CHANGELOG_MODULES) {
        const currentVersion = spec.getVersion(versions);
        const previousVersion = spec.getVersion(previousVersions);
        if (!currentVersion) {
            continue;
        }
        if (!previousVersion || currentVersion === previousVersion) {
            unchangedLines.push(formatUnchangedLine(spec, currentVersion));
            continue;
        }
        let isNewer;
        try {
            isNewer = compareVersions(toSemVer(currentVersion), toSemVer(previousVersion)) > 0;
        } catch (e) {
            isNewer = true;
        }
        if (!isNewer) {
            unchangedLines.push(formatUnchangedLine(spec, currentVersion));
            continue;
        }
        changedLines.push(formatChangelogLine(spec, previousVersion, currentVersion));
    }

    const changedHeading = `## Changes since [${previousPlatform}](https://github.com/vaadin/platform/releases/tag/${previousPlatform})\n`;
    const changedSection = changedLines.length === 0
        ? `${changedHeading}\n_No module version changes since ${previousPlatform}._\n`
        : `${changedHeading}\n${changedLines.join('\n')}\n`;
    const unchangedSection = unchangedLines.length === 0
        ? ''
        : `\n## Unchanged Modules\n\n${unchangedLines.join('\n')}\n`;
    const result = changedSection + unchangedSection;
    _changelogCache[versions.platform] = result;
    return result;
}

function formatUnchangedLine(spec, currVersion) {
    if (spec.docsUrl) {
        return `- **${spec.displayName}**: ${currVersion} ([docs](${spec.docsUrl}))`;
    }
    return `- **${spec.displayName}**: [${currVersion}](https://github.com/${spec.repo}/releases/tag/${spec.tagPrefix}${currVersion})`;
}

function formatChangelogLine(spec, prevVersion, currVersion) {
    if (spec.docsUrl) {
        return `- **${spec.displayName}**: ${prevVersion} → ${currVersion} ([docs](${spec.docsUrl}))`;
    }
    const intermediates = getIntermediateReleases(spec, prevVersion, currVersion);
    const chain = [prevVersion, ...intermediates, currVersion];
    const segments = chain.map(v => `[${v}](https://github.com/${spec.repo}/releases/tag/${spec.tagPrefix}${v})`);
    return `- **${spec.displayName}**: ${segments.join(' → ')}`;
}

function getIntermediateReleases(spec, prevVersion, currVersion) {
    const token = process.env['GITHUB_TOKEN'];
    const url = `https://api.github.com/repos/${spec.repo}/releases?per_page=50`;
    const list = token ? requestGHWithToken(url, token) : requestGH(url);
    if (!Array.isArray(list)) {
        return [];
    }
    const candidates = list
        .map(r => (r.tag_name || '').replace(/^v/, ''))
        .filter(t => t && t !== prevVersion && t !== currVersion);
    const inRange = candidates.filter(t => {
        try {
            return compareVersions(toSemVer(t), toSemVer(prevVersion)) > 0
                && compareVersions(toSemVer(t), toSemVer(currVersion)) < 0;
        } catch (e) {
            return false;
        }
    });
    return inRange.sort((a, b) => {
        try { return compareVersions(toSemVer(a), toSemVer(b)); } catch (e) { return 0; }
    });
}

// Modules tracked in the maintenance changelog. Each spec reads its version
// from versions.json; if changed since the previous platform release, the line
// is emitted with intermediate releases (for repos on GitHub).
const CHANGELOG_MODULES = [
    { displayName: 'Flow',                repo: 'vaadin/flow',                 tagPrefix: '',  getVersion: v => v.core && v.core.flow && v.core.flow.javaVersion },
    { displayName: 'Hilla',               repo: 'vaadin/hilla',                tagPrefix: '',  getVersion: v => v.core && v.core.hilla && v.core.hilla.javaVersion },
    { displayName: 'Web Components',      repo: 'vaadin/web-components',       tagPrefix: 'v', getVersion: v => v.core && v.core.accordion && v.core.accordion.jsVersion },
    { displayName: 'Flow Components',     repo: 'vaadin/flow-components',      tagPrefix: '',  getVersion: v => v.platform },
    { displayName: 'TestBench',           repo: 'vaadin/testbench',            tagPrefix: '',  getVersion: v => v.vaadin && v.vaadin['vaadin-testbench'] && v.vaadin['vaadin-testbench'].javaVersion },
    { displayName: 'Browserless Test',    repo: 'vaadin/browserless-test',     tagPrefix: '',  getVersion: v => v.core && v.core['browserless-test'] && v.core['browserless-test'].javaVersion },
    { displayName: 'Multiplatform Runtime (MPR)', repo: 'vaadin/multiplatform-runtime', tagPrefix: '', getVersion: v => v.core && v.core['mpr-v8'] && v.core['mpr-v8'].javaVersion },
    { displayName: 'Router',              repo: 'vaadin/vaadin-router',        tagPrefix: 'v', getVersion: v => v.core && v.core['vaadin-router'] && v.core['vaadin-router'].jsVersion },
    { displayName: 'Copilot',             repo: 'vaadin/copilot',              tagPrefix: '',  getVersion: v => v.kits && v.kits.copilot && v.kits.copilot.javaVersion },
    { displayName: 'Collaboration Engine', repo: 'vaadin/collaboration-kit',   tagPrefix: '',  getVersion: v => v.kits && v.kits['vaadin-collaboration-engine'] && v.kits['vaadin-collaboration-engine'].javaVersion },
    { displayName: 'Kubernetes Kit',      repo: 'vaadin/kubernetes-kit',       tagPrefix: '',  getVersion: v => v.kits && v.kits['kubernetes-kit-starter'] && v.kits['kubernetes-kit-starter'].javaVersion },
    { displayName: 'Observability Kit',   repo: 'vaadin/observability-kit',    tagPrefix: '',  getVersion: v => v.kits && v.kits['observability-kit-starter'] && v.kits['observability-kit-starter'].javaVersion },
    { displayName: 'SSO Kit',             repo: 'vaadin/sso-kit',              tagPrefix: '',  getVersion: v => v.kits && v.kits['sso-kit-starter'] && v.kits['sso-kit-starter'].javaVersion },
    { displayName: 'CDI add-on',          repo: 'vaadin/cdi',                  tagPrefix: '',  getVersion: v => v.core && v.core['flow-cdi'] && v.core['flow-cdi'].javaVersion },
    { displayName: 'Quarkus plugin',      repo: 'vaadin/quarkus',              tagPrefix: '',  getVersion: v => v.core && v.core['vaadin-quarkus'] && v.core['vaadin-quarkus'].javaVersion },
    // Docs-only modules — no GitHub releases, so intermediate versions can't be listed.
    { displayName: 'AppSec Kit',  docsUrl: 'https://vaadin.com/docs/latest/tools/appsec',      getVersion: v => v.kits && v.kits['appsec-kit-starter'] && v.kits['appsec-kit-starter'].javaVersion },
    { displayName: 'Azure Kit',   docsUrl: 'https://vaadin.com/docs/latest/tools/azure-cloud', getVersion: v => v.kits && v.kits['azure-kit'] && v.kits['azure-kit'].version },
    { displayName: 'Swing Kit',   docsUrl: 'https://vaadin.com/docs/latest/tools/swing',       getVersion: v => v.kits && v.kits['swing-kit'] && v.kits['swing-kit'].javaVersion },
];

const _changelogCache = {};

/**
@param {Object} versions data object for product versions.
@param {String} modulesReleaseNoteTemplate template string to replace versions in.
*/
function createModulesReleaseNotes(versions, version, modulesReleaseNoteTemplate) {

    const platformReleaseNote = requestGH(`https://api.github.com/repos/vaadin/platform/releases/tags/${version}`)
    const platformReleaseNoteBody = platformReleaseNote.body;

    if (!platformReleaseNoteBody) {
        return "";
    }

    const platformModules = collectModules(platformReleaseNoteBody);
    const seenKeys = new Set(platformModules.map(m => `${m.name}@${m.version}`));
    const extraModules = collectAdditionalModules(versions, seenKeys);
    const modules = [...platformModules, ...extraModules]
        .filter(m => m.body && m.body.trim());
    sortModulesByCategory(modules);

    const tocLines = [];
    const contentChunks = [];
    let currentCategory = null;

    for (const mod of modules) {
        if (mod.category !== currentCategory) {
            tocLines.push(`- **${mod.category}**`);
            currentCategory = mod.category;
        }
        const heading = `${formatModuleName(mod.name)} ${mod.version}`;
        tocLines.push(`  - [${heading}](#${toAnchor(heading)})`);

        contentChunks.push(
            `\n---\n\n## [${heading}](${mod.releaseUrl})\n\n` +
            transformModuleBody(mod.body)
        );
    }

    const modulesToc = tocLines.join('\n');
    const modulesReleaseNotes = contentChunks.join('\n');

    const modulesReleaseNoteData = Object.assign(versions, {
        modulesToc: modulesToc,
        modulesReleaseNotes: modulesReleaseNotes,
    });

    return render(modulesReleaseNoteTemplate, modulesReleaseNoteData);
}

function collectModules(platformReleaseNoteBody) {
    const modules = [];
    const seen = new Set();
    platformReleaseNoteBody.split("\n").forEach(line => {
        if (!(line.includes("https") && line.includes("tag") && !line.includes("platform"))) {
            return;
        }
        line.split("](").forEach(
            l => l.split("))").filter(notes => notes.includes("https")).forEach(noteLink => {
                const moduleName = getModuleName(noteLink);
                const noteVersion = getReleaseNoteVersion(noteLink);
                const key = `${moduleName}@${noteVersion}`;
                if (seen.has(key)) {
                    return;
                }
                seen.add(key);
                const noteBody = getReleaseNoteBody(moduleName, noteVersion) || '';
                modules.push({
                    name: moduleName,
                    version: noteVersion,
                    releaseUrl: noteLink,
                    body: noteBody,
                    category: getCategoryForModule(moduleName),
                });
            })
        );
    });
    return modules;
}

function collectAdditionalModules(versions, seenKeys) {
    const result = [];
    for (const spec of ADDITIONAL_MODULES) {
        const version = spec.getVersion(versions);
        if (!version) {
            continue;
        }
        const key = `${spec.name}@${version}`;
        if (seenKeys.has(key)) {
            continue;
        }
        seenKeys.add(key);
        result.push({
            name: spec.name,
            version: version,
            releaseUrl: `https://github.com/vaadin/${spec.name}/releases/tag/${version}`,
            body: getReleaseNoteBody(spec.name, version) || '',
            category: getCategoryForModule(spec.name),
        });
    }
    return result;
}

function getCategoryForModule(name) {
    for (const cat of MODULE_CATEGORIES) {
        if (cat.modules.includes(name)) {
            return cat.title;
        }
    }
    return 'Other';
}

function sortModulesByCategory(modules) {
    const order = MODULE_CATEGORIES.map(c => c.title).concat(['Other']);
    modules.sort((a, b) => {
        const diff = order.indexOf(a.category) - order.indexOf(b.category);
        return diff !== 0 ? diff : a.name.localeCompare(b.name);
    });
}

function formatModuleName(name) {
    return name.split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function toAnchor(text) {
    return text.toLowerCase()
        .replace(/[^a-z0-9 -]/g, '')
        .trim()
        .replace(/\s+/g, '-');
}

function transformModuleBody(body) {
    let result = convertEmojiShortcodes(body);
    result = wrapNoisySections(result);
    result = demoteHeadings(result, 2);
    return result.trim() + '\n';
}

function convertEmojiShortcodes(text) {
    return text.replace(/:([a-z_]+):/g, (match, name) => EMOJI_SHORTCODES[name] || match);
}

function demoteHeadings(text, levels) {
    return text.replace(/^(#{1,6}) /gm, (match, hashes) => {
        const n = Math.min(6, hashes.length + levels);
        return '#'.repeat(n) + ' ';
    });
}

function wrapNoisySections(body) {
    const lines = body.split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const headingMatch = lines[i].match(/^(#{2,6})\s+(.+?)\s*$/);
        if (headingMatch && NOISY_HEADING_PATTERN.test(headingMatch[2])) {
            const level = headingMatch[1].length;
            const title = stripInlineFormatting(headingMatch[2]);
            i++;
            const sectionLines = [];
            while (i < lines.length) {
                const next = lines[i].match(/^(#{1,6})\s+/);
                if (next && next[1].length <= level) {
                    break;
                }
                sectionLines.push(lines[i]);
                i++;
            }
            out.push('');
            out.push('<details>');
            out.push(`<summary>${title}</summary>`);
            out.push('');
            out.push(...sectionLines);
            out.push('</details>');
            out.push('');
        } else {
            out.push(lines[i]);
            i++;
        }
    }
    return out.join('\n');
}

function stripInlineFormatting(text) {
    return text.replace(/[`*_]/g, '').trim();
}

function getModuleName(link){
  return link.substring(link.lastIndexOf("/vaadin/") + "/vaadin/".length, link.lastIndexOf("/releases"));
}

function getReleaseNoteVersion(link){
  return link.substring(link.lastIndexOf("releases/tag/") + "releases/tag/".length)
}

function getReleaseNoteBody(name, version){
  const token = process.env['GITHUB_TOKEN'];
  const direct = requestGHWithToken(`https://api.github.com/repos/vaadin/${name}/releases/tags/${version}`, token);
  if (direct && direct.body) {
    return direct.body;
  }
  // Tag lookup misses draft releases — fall back to listing and matching by tag_name/name.
  const list = requestGHWithToken(`https://api.github.com/repos/vaadin/${name}/releases?per_page=30`, token);
  if (Array.isArray(list)) {
    const match = list.find(r => r.tag_name === version || r.name === version);
    if (match && match.body) {
      return match.body;
    }
  }
  return '';
}

/**
Get the release note from flow-components repo for current platform version
@param {version} platform version
*/
function getComponentReleaseNote(version){
   version = version.replace("-",".");
   const fullNote = requestGH(`https://api.github.com/repos/vaadin/flow-components/releases/tags/${version}`);
   const fullNoteBody = fullNote.body;
   if (!fullNoteBody) {
       return '';
   }
   let result = fullNoteBody.substring(
   fullNoteBody.lastIndexOf("### Changes in Components") + "### Changes in Components".length,
   fullNoteBody.lastIndexOf("###"));
   return result;
}

function getChangedSincePrevious(versions) {
    const previousVersion = calculatePreviousVersion(versions.platform);
    if (!previousVersion) {
        return '';
    }
    let previousVersionsJson = requestGH(`https://raw.githubusercontent.com/vaadin/platform/${previousVersion}/versions.json`);
    let previousVersionString = JSON.stringify(previousVersionsJson).replace(/{{version}}/g, `${previousVersion}`);
    previousVersionsJson = JSON.parse(previousVersionString);
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
    let allPreviousVersions = Object.assign({}, previousVersionsJson.core, previousVersionsJson.vaadin, previousVersionsJson.community);
    let allPreviousVersionsString = JSON.stringify(allPreviousVersions).replace(/{{version}}/g, `${previousVersion}`);
    allPreviousVersions = JSON.parse(allPreviousVersionsString);

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
            const currentJSVersion = version.jsVersion == undefined ? '0.0.0' : version.jsVersion;
            const currentJavaVersion = toSemVer(version.javaVersion);
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? (previousVersionComponent.jsVersion == undefined ? '0.0.0' : previousVersionComponent.jsVersion) : '0.0.0';
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
            const currentJSVersion = version.jsVersion == undefined ? '0.0.0' : version.jsVersion;
            const currentJavaVersion = toSemVer(version.javaVersion);
            const previousVersionComponent = allPreviousVersions[versionName];
            const previousJSVersion = previousVersionComponent ? (previousVersionComponent.jsVersion == undefined ? '0.0.0' : previousVersionComponent.jsVersion) : '0.0.0';
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
    // sometimes we use SNAPSHOTS in versions.json e.g. when waiting for a new alpha/beta with a fix
    if (compareVersions(currentVersionSemver.replace('-SNAPSHOT', '.0'), previousVersionSemver) === 1) {
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
        case 'vaadin-quarkus':
            title = 'Vaadin Quarkus';
            releaseNoteLink = 'https://github.com/vaadin/quarkus/releases/tag/';
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
        case 'vaadin-quarkus':
            title = 'Vaadin Quarkus';
            releaseNoteLink = 'https://github.com/vaadin/quarkus/releases/tag/';
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

    result = result.concat(version.javaVersion ? `## Java: ${version.javaVersion}\n` : '');
    result = result.concat(version.javaVersion ? `https://api.github.com/repos/vaadin/${versionName}-flow/releases/tags/${version.javaVersion}\n` : '');

    result = result.concat(version.jsVersion ? `## WebComponent: ${version.jsVersion}\n` : '');
    result = result.concat(version.jsVersion ? `https://api.github.com/repos/vaadin/${versionName}/releases/tags/v${version.jsVersion}\n` : '');

    return result;
}

function requestGH(path) {
    // when calling github api for multiple times
    // please use the requestGHWithToken(path, token)
    const res = request('GET', path, {
        headers: {
            'user-agent': 'vaadin-platform'
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

function requestGHWithToken(path, token){
    const res = request('GET', path, {
        headers: {
            'user-agent': 'vaadin-platform',
            'Authorization': `token ${token}`,
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

exports.createJson = createJson;
exports.createNestedJson = createNestedJson;
exports.createPackageJson = createPackageJson;
exports.createMaven = createMaven;
exports.createReleaseNotes = createReleaseNotes;
exports.addProperty = addProperty;
// export for testing purpose
exports.generateChangesString = generateChangesString;
exports.calculatePreviousVersion = calculatePreviousVersion;
exports.createModulesReleaseNotes = createModulesReleaseNotes;
