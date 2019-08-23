const https = require('https');

const currentVersions = require('../versions.json');

const majorVersionRegexp = /(\d*?)\./;  

const getUrl = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (resp) => {
            let data = '';

            resp.on('data', (chunk) => {
                data += chunk;
            });

            resp.on('end', () => {
                resolve(data);
            });
        }).on("error", (err) => reject(err));
    });
}

const versionsDiffer = (previous, current) => {
    const currentMajor = current.match(majorVersionRegexp)[1];    
    const previousMajor = previous.match(majorVersionRegexp)[1];

    return parseInt(currentMajor, 10) > parseInt(previousMajor, 10);
}

const printChangesForProduct = (name, key, previousProduct, currentProduct) => {
    const currentVersion = currentProduct[key];
    const previousVersion = previousProduct[key];

    if(!currentVersion && !previousVersion) {
        return;
    }

    if(!currentVersion && previousVersion) {
        console.log(`${name} ${key} version was removed in the current version`);
        return;
    }
    
    if(!previousVersion && currentVersion) {
        console.log(`${name} ${key} version didn't exist in the previous version`);
        return;
    }

    if(!currentVersion.match(majorVersionRegexp) || !previousVersion.match(majorVersionRegexp)) {
        console.log(`${name} ${key} has non-numeric version`);
        return
    }

    if(versionsDiffer(previousVersion, currentVersion)) {
        console.log(`Breaking change! Current ${key} version of ${name} is ${currentVersion}, previous was ${previousVersion}`);    
    }
}

const printChanges = async (previousVersion) => {
    console.log(`Searching for changes between current and version ${previousVersion}`);

    const previousVersions = JSON.parse(await getUrl(`https://raw.githubusercontent.com/vaadin/platform/${previousVersion}/versions.json`));

    for (let [key, value] of Object.entries(currentVersions.core)) {
        if(!previousVersions.core[key]) { 
            // console.log(`${key} didn't exist in the previous version`);
            continue;
        }

        printChangesForProduct(key, 'javaVersion', previousVersions.core[key], value);
        printChangesForProduct(key, 'bowerVersion', previousVersions.core[key], value);
    }

    for (let [key, value] of Object.entries(currentVersions.vaadin)) {
        if(!previousVersions.vaadin[key]) { 
            // console.log(`${key} didn't exist in the previous version`);
            continue;
        }

        printChangesForProduct(key, 'javaVersion', previousVersions.vaadin[key], value);
        printChangesForProduct(key, 'bowerVersion', previousVersions.vaadin[key], value);
    }
}

//so, so naive
const previousVersion = process.argv[2] || '10.0';
printChanges(previousVersion);