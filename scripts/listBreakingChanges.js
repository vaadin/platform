const https = require('https');

const currentVersions = require('../versions.json');


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
    const majorVersionRegexp = /(\d*?)\./;  
    const currentMajor = current.match(majorVersionRegexp)[1];    
    const previousMajor = previous.match(majorVersionRegexp)[1];

    return parseInt(currentMajor, 10) > parseInt(previousMajor, 10);
}

const printChanges = async () => {
    const previousVersions = JSON.parse(await getUrl('https://raw.githubusercontent.com/vaadin/platform/11.0/versions.json'));
    

    for (let [key, value] of Object.entries(currentVersions.core)) {
        if(!previousVersions.core[key]) { 
            // console.log(`${key} didn't exist in the previous version`);
            continue;
        }

        const currentJavaVersion = value.javaVersion;
        const previousJavaVersion = previousVersions.core[key].javaVersion;

        if(!currentJavaVersion && !previousJavaVersion) {
            continue;
        }

        if(!currentJavaVersion && previousJavaVersion) {
            // console.log(`${key} Java version was removed in the current version`);
            continue;
        }
        
        if(!previousJavaVersion && currentJavaVersion) {
        //    console.log(`${key} Java version didn't exist in the previous version`);
           continue;
        }

        if(versionsDiffer(previousJavaVersion, currentJavaVersion)) {
            console.log(`Breaking change! Current Java version of ${key} is ${currentJavaVersion}, previous was ${previousJavaVersion}`);    
        }
    }
}


printChanges();