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
                const version = value.npmVersion || value.jsVersion;
                if (version) {
                    packages[value.npmName] = version;
                }
            } else {
                collectPackages(value, packages);
            }
        });
    return packages;
}

/**
 * Finds the jars of the given version below a directory.
 */
function findJars(dir, version) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const file = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return findJars(file, version);
        }
        return entry.name.endsWith(`-${version}.jar`) ? [file] : [];
    });
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
 * @return {Object} the npm package names and the versions they are pinned to
 */
function readPinnedVersions(version, jarsDir) {
    const dir = jarsDir || path.join(process.env.HOME || '', '.m2/repository/com/vaadin');
    const jars = findJars(dir, version);
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

exports.readPinnedVersions = readPinnedVersions;
exports.withPinnedVersions = withPinnedVersions;
// export for testing purpose
exports.readJarFolder = readJarFolder;
