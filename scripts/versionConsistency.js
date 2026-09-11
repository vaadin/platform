#!/usr/bin/env node

/**
 * Checks that the versions of `versions.json` agree with the versions the
 * projects it lists declare themselves.
 *
 * It compares:
 * - the web component version against the `@vaadin/bundles` version,
 * - the web component version against the `@NpmPackage` annotation of the
 *   button in flow-components, on the branch the pull request targets,
 * - the packages `versions.json` declares against the dependencies of Flow
 *   and the peer dependencies of the bundles,
 * - the minor and patch of the React components against the web components.
 *
 * The script exits with 1 when any of them disagree.
 *
 * This is the check the version consistency build step used to carry inline.
 * It reads the versions out of `versions.json` itself, so only the branch the
 * pull request targets has to be given to it, along with the token to read
 * the other repositories with:
 *
 *   baseBranch=main GITHUB_TOKEN=... node scripts/versionConsistency.js
 *
 * A version may be given in the environment as well, as `flowVersion`,
 * `bundlesVersion`, `wcVersion` or `rcVersion`, which takes precedence over
 * what `versions.json` says.
 */

const fs = require('fs');
const https = require('https');
const path = require('path');
const exec = require('util').promisify(require('child_process').exec);

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

  if (platform.bundles) {
    platformVersions[platform.bundles.vaadin.npmName] = platform.bundles.vaadin.jsVersion;
  }

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

  for (let attributename in platform.react) {
    if (platform.react[attributename].npmName) {
      platformVersions[platform.react[attributename].npmName] = platform.react[attributename].jsVersion;
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
  const bundlesVersion = version('bundlesVersion', () => versions.bundles.vaadin.jsVersion);
  const wcVersion = version('wcVersion', () => versions.core.button.jsVersion);
  const rcVersion = version('rcVersion', () => versions.react['react-components'].jsVersion);

  if (bundlesVersion && bundlesVersion != 'null' && wcVersion && bundlesVersion != wcVersion) {
    console.error('\x1b[33m', `WebComponent version(${wcVersion}) is not matching @vaadin/bundles version(${bundlesVersion})`);
    process.exit(1);
  } else {
    console.log('\x1b[32m', `WebComponent version(${wcVersion}) is matching @vaadin/bundles version(${bundlesVersion})`);
  }

  const flowBranch = getBranch(flowVersion, baseBranch);
  //bundles tags has the 'v' prefix
  const bundlesBranch = `v${bundlesVersion}`;

  let flowURL = `https://raw.githubusercontent.com/vaadin/flow/${flowBranch}/flow-server/src/main/resources/com/vaadin/flow/server/frontend/dependencies/default/package.json`;
  let bundlesURL = `https://raw.githubusercontent.com/vaadin/bundles/${bundlesBranch}/package.json`;
  let flowComponentURL = `https://raw.githubusercontent.com/vaadin/flow-components/${baseBranch}/vaadin-button-flow-parent/vaadin-button-flow/src/main/java/com/vaadin/flow/component/button/Button.java`;
  let generateFileURL = `https://raw.githubusercontent.com/vaadin/flow-components/${baseBranch}/vaadin-button-flow-parent/vaadin-button-flow/src/main/java/com/vaadin/flow/component/button/GeneratedVaadinButton.java`;

  let platformVersions = consolidatePlatformVersions(versions);

  console.log(`flow resource：${flowURL}`);
  let flow = await requestResource(flowURL);
  console.log(`bundles resource：${bundlesURL}`);
  let bundles = await requestResource(bundlesURL);

  let flowComponentVersion = await exec(`curl -L -s ${flowComponentURL} | grep "@NpmPackage" | head -1 | cut -d '"' -f4`);
  console.log(flowComponentVersion.stdout.length);

  if (flowComponentVersion.stdout.length === 0) {
    flowComponentVersion = await exec(`curl -L -s ${generateFileURL} | grep "@NpmPackage" | head -1 | cut -d '"' -f4`);
  }

  let componentVersion = flowComponentVersion.stdout.replace('\n', '');

  if (flow && componentVersion.localeCompare(wcVersion)) {
    mismatch = true;
    console.error(
      '\x1b[33m',
      `web component versions in flow-components (${componentVersion}) and platform (${wcVersion}) are different`
    );
  } else {
    console.log(
      '\x1b[32m',
      `web component versions in flow-components (${componentVersion}) and platform (${wcVersion}) are same`
    );
  }

  if (flow && flow.dependencies && bundles && bundlesVersion != 'null') {
    compareDependency('flow', flow.dependencies, 'bundles', bundles.peerDependencies);
    compareDependency('platform', platformVersions, 'bundles', bundles.peerDependencies);
  } else {
    console.log('\x1b[32m', "don't have bundles info");
  }

  if (rcVersion != 'null') {
    const [rcMajor, rcMinor, rcPatch] = rcVersion.split('.');
    const [bMajor, bMinor, bPatch] = wcVersion.split('.');
    console.log(rcMinor, bMinor, rcPatch, bPatch);
    if (rcMinor != bMinor || rcPatch != bPatch) {
      mismatch = true;
      console.error(`WebComponent version(${wcVersion}) is not matching @vaadin/react-components version(${rcVersion})`);
    }
  } else {
    console.log('\x1b[32m', "don't have react-components info");
  }

  // for flow 2.x, we dont need to check this
  if (flow) {
    compareDependency('platform', platformVersions, 'flow', flow.dependencies);
  } else {
    console.log('\x1b[32m', "for flow 2.x, we dont need to check this");
  }

  if (mismatch) {
    process.exit(1);
  } else {
    console.log('\x1b[32m', 'passed version consistency test');
    process.exit(0);
  }
}

main();
