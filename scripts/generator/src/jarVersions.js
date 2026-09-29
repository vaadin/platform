/*
 * Reads the npm packages that jars pin themselves.
 *
 * Flow reads every json file of `META-INF/VAADIN/versions/` on the classpath,
 * from whichever jar ships it, and pins the packages they declare. A component
 * integration therefore pins the npm packages it ships in its own jar, and the
 * versions file of the platform no longer declares them.
 *
 * The npm packages of the platform, `@vaadin/vaadin-core` and `@vaadin/vaadin`,
 * still have to depend on all of them, so their versions are read back from the
 * jars that pin them rather than declared a second time in `versions.json`.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const VERSIONS_FOLDER = 'META-INF/VAADIN/versions/';

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_FILE_SIGNATURE = 0x02014b50;
const STORED = 0;
const DEFLATED = 8;

/**
 * Reads the files of a folder in a jar, by their name in the jar.
 *
 * Only the central directory of the zip is walked, so that nothing but the
 * files that are wanted is inflated.
 */
function readJarFolder(jarFile, folder) {
    const jar = fs.readFileSync(jarFile);
    const files = {};

    // The end of central directory record is at the end of the file, followed
    // by a comment of up to 64 kB
    let eocd = jar.length - 22;
    while (eocd >= 0 && jar.readUInt32LE(eocd) !== EOCD_SIGNATURE) {
        eocd--;
    }
    if (eocd < 0) {
        throw new Error(`${jarFile} is not a jar`);
    }

    const entries = jar.readUInt16LE(eocd + 10);
    let entry = jar.readUInt32LE(eocd + 16);
    for (let i = 0; i < entries; i++) {
        if (jar.readUInt32LE(entry) !== CENTRAL_FILE_SIGNATURE) {
            throw new Error(`${jarFile} has a broken central directory`);
        }
        const compression = jar.readUInt16LE(entry + 10);
        const compressedSize = jar.readUInt32LE(entry + 20);
        const nameLength = jar.readUInt16LE(entry + 28);
        const extraLength = jar.readUInt16LE(entry + 30);
        const commentLength = jar.readUInt16LE(entry + 32);
        const localHeader = jar.readUInt32LE(entry + 42);
        const name = jar.toString('utf8', entry + 46, entry + 46 + nameLength);

        if (name.startsWith(folder) && !name.endsWith('/')) {
            // The local header repeats the name and may carry different extra
            // fields, so its own lengths tell where the content starts
            const localNameLength = jar.readUInt16LE(localHeader + 26);
            const localExtraLength = jar.readUInt16LE(localHeader + 28);
            const start = localHeader + 30 + localNameLength + localExtraLength;
            const content = jar.subarray(start, start + compressedSize);
            if (compression === STORED) {
                files[name] = content.toString('utf8');
            } else if (compression === DEFLATED) {
                files[name] = zlib.inflateRawSync(content).toString('utf8');
            } else {
                throw new Error(`${name} of ${jarFile} uses an unsupported compression method ${compression}`);
            }
        }

        entry += 46 + nameLength + extraLength + commentLength;
    }

    return files;
}

/**
 * Collects the npm packages a versions file declares, by npm package name.
 */
function collectPackages(node, packages) {
    Object.values(node)
        .filter((value) => value && typeof value === 'object')
        .forEach((value) => {
            if (value.npmName) {
                packages[value.npmName] = value;
            } else {
                collectPackages(value, packages);
            }
        });
    return packages;
}

/**
 * Takes the version of each entry, for the callers that only need those.
 *
 * @param {Object} entries the entries by npm package name
 * @returns {Object} the version by npm package name
 */
function pinnedVersions(entries) {
    return Object.entries(entries)
        .map(([npmName, entry]) => [npmName, entry.npmVersion || entry.jsVersion])
        .filter(([, version]) => version)
        .reduce((versions, [npmName, version]) => {
            versions[npmName] = version;
            return versions;
        }, {});
}

/**
 * Finds the jars of the given version below a directory.
 */
function findJars(dir, version, excluded) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    const suffix = `-${version}.jar`;
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findJars(file, version, excluded);
        }
        if (!entry.name.endsWith(suffix)) {
            return [];
        }
        const artifactId = entry.name.slice(0, -suffix.length);
        return excluded.has(artifactId) ? [] : [file];
    });
}

/**
 * Collects the artifact ids of the modules a repository builds, from the
 * pom.xml files below its root.
 *
 * The platform builds artifacts of the platform version too, some of which
 * ship versions files of their own, like the one of vaadin-core-internal. Those
 * are written from what this script reads, so reading them back from the
 * local Maven repository would pin whatever the previous build wrote rather
 * than what the component jars declare.
 *
 * @param {String} root the root directory of the repository
 * @return {Set<String>} the artifact ids of its modules
 */
function collectOwnArtifactIds(root) {
    const ids = new Set();
    (function walk(dir) {
        fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
            if (entry.isDirectory()) {
                if (!['node_modules', 'target', '.git'].includes(entry.name)) {
                    walk(path.join(dir, entry.name));
                }
                return;
            }
            if (!/^pom.*\.xml$/.test(entry.name)) {
                return;
            }
            const pom = fs
                .readFileSync(path.join(dir, entry.name), 'utf8')
                .replace(/<!--[\s\S]*?-->/g, '')
                .replace(/<parent>[\s\S]*?<\/parent>/, '');
            const artifactId = /<artifactId>\s*([^<\s]+)\s*<\/artifactId>/.exec(pom);
            if (artifactId) {
                ids.add(artifactId[1]);
            }
        });
    })(root);
    return ids;
}

/**
 * Reads the npm packages that the jars of the given version pin themselves.
 *
 * A jar that does not pin any package is simply one without a versions file,
 * and a jar that cannot be read is skipped with a warning: the packages the
 * other jars pin are still read.
 *
 * @param {String} version the version of the jars to read, the platform version
 * @param {String} jarsDir the directory to look the jars up below, the com/vaadin
 *   folder of the local Maven repository by default
 * @param {Set<String>} excluded the artifact ids of the jars not to read, those
 *   the platform builds itself
 * @return {Object} the npm package names and the versions they are pinned to
 */
function readPinnedEntries(version, jarsDir, excluded = new Set()) {
    const dir = jarsDir || path.join(process.env.HOME || '', '.m2/repository/com/vaadin');
    const jars = findJars(dir, version, excluded);
    const packages = {};
    jars.forEach((jar) => {
        let files;
        try {
            files = readJarFolder(jar, VERSIONS_FOLDER);
        } catch (e) {
            console.warn(`Unable to read the pinned npm versions of ${jar}: ${e.message}`);
            return;
        }
        Object.entries(files).forEach(([name, content]) => {
            try {
                collectPackages(JSON.parse(content), packages);
            } catch (e) {
                console.warn(`Unable to read ${name} of ${jar}: ${e.message}`);
            }
        });
    });
    const names = Object.keys(packages);
    if (names.length === 0) {
        console.warn(
            `No jar of version ${version} below ${dir} pins npm versions of its own.` +
                ' The npm packages of the platform will only depend on what versions.json declares.'
        );
    } else {
        console.log(`Read the versions of ${names.sort().join(', ')} pinned by the jars of ${version}`);
    }
    return packages;
}

/**
 * Adds the packages that the jars pin to a section of the versions, so that the
 * npm packages of the platform depend on them as well.
 *
 * A package the section already declares is left alone, as the versions file of
 * the platform is what pins it in that case.
 *
 * @param {Object} versions the section of the versions to add the packages to
 * @param {Object} pinnedVersions the npm package names and versions from the jars
 * @return {Object} the section with the packages of the jars added
 */
function withPinnedVersions(versions, pinnedVersions) {
    const declared = new Set(
        Object.values(versions)
            .map((version) => version.npmName)
            .filter(Boolean)
    );
    const added = Object.entries(pinnedVersions)
        .filter(([npmName]) => !declared.has(npmName))
        .reduce((result, [npmName, jsVersion]) => {
            result[npmName.replace(/^@[^/]+\//, '')] = { jsVersion, npmName };
            return result;
        }, {});
    return Object.assign({}, versions, added);
}

/**
 * Splits the packages the jars pin between the core and the commercial npm
 * package of the platform.
 *
 * Only the Vaadin packages are handed out: the npm packages of the platform
 * depend on those and get whatever they depend on transitively, as they did
 * when `versions.json` declared every one of them.
 *
 * @param {Object} pinnedVersions the npm package names and versions from the jars
 * @param {Array} proPackages the packages of the commercial pack, i.e. the
 *   exclusions of its React components
 * @return {Object} the pinned versions `core` and `vaadin` get
 */
function splitPinnedVersions(pinnedVersions, proPackages) {
    const pro = new Set(proPackages || []);
    const split = { core: {}, vaadin: {} };
    Object.entries(pinnedVersions)
        .filter(([npmName]) => npmName.startsWith('@vaadin/'))
        .forEach(([npmName, version]) => {
            split[pro.has(npmName) ? 'vaadin' : 'core'][npmName] = version;
        });
    return split;
}

exports.readPinnedEntries = readPinnedEntries;
exports.collectOwnArtifactIds = collectOwnArtifactIds;
exports.pinnedVersions = pinnedVersions;
exports.withPinnedVersions = withPinnedVersions;
exports.splitPinnedVersions = splitPinnedVersions;
// export for testing purpose
exports.readJarFolder = readJarFolder;
