#!/usr/bin/env node

/**
 * Checks that the npm package versions of `versions.json` agree with the
 * default dependencies Flow declares, on the branch the pull request targets.
 *
 * The web components and `@vaadin/bundles` used to be compared here as well,
 * but neither is listed in `versions.json` any more: the web component
 * versions now come from flow-components.
 *
 * The script exits with 1 when any of them disagree. It reads the Flow
 * version out of `versions.json` itself, so only the branch the pull request
 * targets has to be given to it, along with the token to read Flow with:
 *
 *   baseBranch=main GITHUB_TOKEN=... node scripts/versionConsistency.js
 *
 * The Flow version may be given in the environment as well, as `flowVersion`,
 * which takes precedence over what `versions.json` says.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');

const token = process.env['GITHUB_TOKEN'];

let mismatch = false;

if (!token) {
  console.log(`GITHUB_TOKEN is not set`);
  process.exit(1);
}

const versionsFile = path.join(__dirname, '..', 'versions.json');
const versions = JSON.parse(fs.readFileSync(versionsFile));

/**
 * Reads a version out of `versions.json`, unless the environment gives one.
 * A version that is not declared is reported as the string 'null', which is
 * what the checks below expect of a missing version.
 */
function version(name, read) {
  const fromEnvironment = process.env[name];
  if (fromEnvironment) {
    return fromEnvironment.replaceAll('"', '');
  }
  let value;
  try {
    value = read();
  } catch (error) {
    value = undefined;
  }
  return value === undefined ? 'null' : value;
}

async function requestResource(url) {
  const options = {
    headers: {
      'User-Agent': 'vaadin-platform-test',
      Authorization: `token ${token}`,
      'Content-Type': 'application/json'
    }
  };
  return new Promise((resolve) => {
    https
      .get(url, options, (response) => {
        if (response.statusCode < 200 || response.statusCode > 299) {
          console.error(`Cannot get content. Status ${response.statusCode} for ${url}`);
          response.resume();
          resolve('');
          return;
        }
        let body = '';
        response.setEncoding('utf8');
        response.on('data', (chunk) => (body += chunk));
        response.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            console.error(`Cannot get content. ${error}`);
            resolve('');
          }
        });
      })
      .on('error', (error) => {
        console.error(`Cannot get content. ${error}`);
        resolve('');
      });
  });
}

function compareDependency(project1, build1, project2, build2) {
  let keys = Object.keys(build1);

  for (let i = 0; i < keys.length; i++) {
    let key = keys[i];
    if (build1[key] && build2[key] && build1[key] != build2[key]) {
      mismatch = true;
      console.log(
        '\x1b[33m',
        `Found different versions for ${key}, ${project1}:${build1[key]} does not equal to ${project2}:${build2[key]}`
      );
    }
  }
}

function consolidatePlatformVersions(platform) {
  let platformVersions = new Object();

  for (let attributename in platform.core) {
    if (platform.core[attributename].npmName) {
      if (platform.core[attributename].npmVersion) {
        platformVersions[platform.core[attributename].npmName] = platform.core[attributename].npmVersion;
      } else {
        platformVersions[platform.core[attributename].npmName] = platform.core[attributename].jsVersion;
      }
    }
  }

  for (let attributename in platform.vaadin) {
    if (platform.vaadin[attributename].npmName) {
      platformVersions[platform.vaadin[attributename].npmName] = platform.vaadin[attributename].jsVersion;
    }
  }

  return platformVersions;
}

function getBranch(version, base) {
  // if pr targeting main branch, use main for flow; otherwise use snapshot branch or tags
  let branch;

  if (base == 'main') {
    branch = version.includes('SNAPSHOT') ? 'main' : version;
  } else {
    branch = version.includes('SNAPSHOT') ? version.replace('-SNAPSHOT', '') : version;
  }

  return branch;
}

async function main() {
  const baseBranch = (process.env['baseBranch'] || process.env['GITHUB_BASE_REF'] || '').replaceAll('"', '');
  if (!baseBranch) {
    console.log(`baseBranch is not set`);
    process.exit(1);
  }

  const flowVersion = version('flowVersion', () => versions.core.flow.javaVersion);
  const flowBranch = getBranch(flowVersion, baseBranch);
  const flowURL = `https://raw.githubusercontent.com/vaadin/flow/${flowBranch}/flow-server/src/main/resources/com/vaadin/flow/server/frontend/dependencies/default/package.json`;

  const platformVersions = consolidatePlatformVersions(versions);

  console.log(`flow resource：${flowURL}`);
  const flow = await requestResource(flowURL);

  if (!flow || !flow.dependencies) {
    console.error('[33m', `Cannot read the dependencies of Flow ${flowVersion}`);
    process.exit(1);
  }

  compareDependency('platform', platformVersions, 'flow', flow.dependencies);

  if (mismatch) {
    process.exit(1);
  } else {
    console.log('\x1b[32m', 'passed version consistency test');
    process.exit(0);
  }
}

main();
