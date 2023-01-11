#!/usr/bin/env node
// brew tap devops-kung-fu/homebrew-tap
// brew install devops-kung-fu/homebrew-tap/bomber
// brew install osv-scanner
// mvn org.owasp:dependency-check-maven:check
// sudo go install github.com/google/osv-scanner/cmd/osv-scanner@v1
// wget https://github.com/devops-kung-fu/bomber/releases/download/v0.4.0/bomber_0.4.0_linux_amd64.deb
// sudo dpkg -i bomber_0.4.0_linux_amd64.deb

const asyncExec = require('util').promisify(require('child_process').exec);
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const VAADIN_LICENSE = 'https://vaadin.com/commercial-license-and-service-terms';

const licenseWhiteList = [
  'ISC',
  'MIT',
  '0BSD',
  'Apache-2.0',
  'CDDL',
  'CDDL-1.0',
  'GPL-2.0-with-classpath-exception',
  'LGPL-2.1-or-later',
  'LGPL-2.1-only',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'EPL-2.0',
  'AFL-2.1',
  'MPL-1.1',
  'CC0-1.0',
  'CC-BY-4.0',
  'Zlib',
  'https://vaadin.com/commercial-license-and-service-terms',
  'https://www.highcharts.com/license'
];

const testProject = path.resolve('vaadin-platform-test');
function log(...args) {
  process.stderr.write(`\x1b[0m> \x1b[0;32m${args}\x1b[0m\n`);
}
function out(...args) {
  process.stderr.write(`\x1b[2m\x1b[196m${args}\x1b[0m`);
}
function err(...args) {
  process.stderr.write(`\x1b[0;31m${args}\x1b[0m`);
}

function ghaStepReport(msg) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (f ) {
    try {
      fs.accessSync(path.dirname(f), fs.constants.W_OK);
      fs.writeFileSync(f, msg);
    } catch (error) {
    }
  }
}

async function run(order, ops = { debug: true, throw: true, output: undefined }) {
  (!ops.output && ops.debug) && log(order);
  return new Promise((resolve, reject) => {
    const cmd = order.split(/ +/)[0];
    const arg = order.split(/ +/).splice(1);
    let stdout = "", stderr = "";
    const ls = spawn(cmd, arg);
    ls.stdout.on('data', (data) => {
      stdout += data;
      (!ops.output && ops.debug) && out(data);
    });
    ls.stderr.on('data', (data) => {
      (ops.throw) && out(data);
      stderr += data;
    });
    ls.on('close', (code) => {
      ops.output && fs.writeFileSync(ops.output, stdout);
      if (ops.throw && code !== 0) {
        reject({ stdout, stderr, code });
      } else {
        resolve({ stdout, stderr, code });
      }
    });
  });
}

async function isInstalled(command) {
  if ((await run(`which ${command}`, { debug: false, throw: false })).code) {
    err(`You need to install '${command}' command in your PATH to continue\n`);
    process.exit(1);
  }
}

async function consolidateSBoms(...boms) {
  let ret;
  boms.forEach(f => {
    const sbom = JSON.parse(fs.readFileSync(f));
    if (!ret) {
      ret = sbom;
    } else {
      ret.components = ret.components.concat(sbom.components);
      ret.dependencies = ret.dependencies.concat(sbom.dependencies);
    }
  });
  ret.components.forEach(c => {
    c.licenses && c.licenses.forEach(l => {
      if (/vaadin/.test(c.purl)) {
        if (l.expression) {
          l.expression = l.expression.replace(/SEE LICENSE IN [^\)]+/, VAADIN_LICENSE);
        }
        if (l.license && l.license.name == 'SEE LICENSE IN LICENSE') {
          l.license.url = VAADIN_LICENSE;
        }
      }
      l.expression && (l.license = { id: l.expression });
    });
    // See https://github.com/mapbox/jsonlint README
    if (/jsonlint-lines-primitives/.test(c.purl) && !c.licenses) {
      c.licenses = [{license: {id: 'MIT'}}];
    } 
  });
  return ret;
}

function sumarizeLicenses(f) {
  const sbom = JSON.parse(fs.readFileSync(f));
  const summary = {};
  sbom.components.forEach((e) => {
    let comp = decodeURIComponent(e.purl).replace(/[?#].*$/g, '');
    let lic = e.licenses && [...(e.licenses.reduce((p, l) => {
      return p.add(l.expression ? l.expression.replace(/[\(\)]/g, '') :
        (l.license.id || (!l.license.name || / /.test(l.license.name)) && l.license.url || l.license.name));      
    }, new Set()))].join(' OR ');
    const addLic = (idx, l) => (summary[idx] = summary[idx] || []).push(l);
    if (!lic) {
      addLic(null, comp);
    } else {
      lic.split(/ +(?:OR|AND) +/).forEach(l => addLic(l, comp));
    }
  });
  return summary;
}

function sumarizeOSV(f, summary) {
  const res = JSON.parse(fs.readFileSync(f));
  res.results.forEach(r => {
    r.packages.forEach(p => {
      p.vulnerabilities.forEach(v => {
        v.affected.forEach(a => {
          const pkg = a.package.purl + "@" + p.package.version;
          summary[pkg] = summary[pkg] || {};
          v.aliases.forEach(al => {
            summary[pkg][al] = summary[pkg][al] || {};
            summary[pkg][al].title = v.summary;
          });
        });
      });
    });
  });
  return summary;
}

function sumarizeBomber(f, summary) {
  const res = JSON.parse(fs.readFileSync(f));
  (res.packages || []).forEach(p => {
    p.vulnerabilities.forEach(v => {
      const pkg = p.coordinates.replace(/\?.+/, '');
      summary[pkg] = summary[pkg] || {};
      summary[pkg][v.id] = summary[pkg][v.id] || {};
      summary[pkg][v.id].title = v.title;
    });
  });
  return summary;
}

function checkLicenses(licenses) {
  let ret = "";
  Object.keys(licenses).forEach(lic => {
    if (licenseWhiteList.indexOf(lic) < 0) {
      ret += `Found invalid license '${lic}' in: ${licenses[lic].join(' and ')}\n`;
    }
  });
  return ret;
}

function checkVunerabilities(vuls) {
  let ret = "";
  Object.keys(vuls).forEach(v => {
    ret += `Found vulnerabilities in: ${v} [${Object.keys(vuls[v]).join(', ')}]\n`;
  });
  return ret;
}

function reportLicenses(licenses) {
  let ret = "";
  Object.keys(licenses).sort((a, b) => licenseWhiteList.indexOf(a) - licenseWhiteList.indexOf(b)).forEach(lic => {
    const status = licenseWhiteList.indexOf(lic) < 0 ? '🚫' : '✅';
    const license = `\`${lic}\``;
    const summary = `<details><summary>${licenses[lic].length}</summary><ul><li><code>${licenses[lic].join('</code><li><code>').replace(/@(\d)/g, ' $1')}</code></ul></details>`
    ret += `|${status}|${license}|${summary}|\n`;
  });
  ret && (ret = "|  | License | Packages |\n|-------|--------|-------|\n" + ret);
  return ret;
}

function reportVulnerabilities(vuls) {
  let ret = "";
  Object.keys(vuls).forEach(v => {
    ret += `|\`${v}\`|<ul><li>${Object.keys(vuls[v]).map(o => `[${o}](https://nvd.nist.gov/vuln/detail/${o}) _${vuls[v][o].title}_`).join('<li>')}</ul>\n`;
  });
  ret && (ret = "| Package | CVEs |\n|-------|--------|\n" + ret);
  return ret;
}

function reportFileContent(title, file, filter = c => c) {
  const content = filter(fs.readFileSync(file).toString());
  return `\n<details><summary><h2>${title}</h2></summary><code>\n${content}\n</code></details>\n`;
}

async function main() {
  await isInstalled('bomber');
  await isInstalled('osv-scanner');
  await isInstalled('mvn');

  await run(`./scripts/generateBoms.sh`);
  await run('mvn  -ntp -B clean install -DskipTests -T 1C -q');

  log(`cd ${testProject}`);
  process.chdir(testProject);

  log(`cleaning package.json`);
  fs.existsSync('package.json') && fs.unlinkSync('package.json');
  await run('mvn package -ntp -B -Pproduction -DskipTests -q');
  await run('mvn dependency:tree -ntp -B', {output: 'target/tree-maven.txt'});
  await run('mvn -ntp -B org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom -q');
<<<<<<< HEAD
  await run('npm ls --depth 6', {output: 'target/tree-npm.txt'});
=======
  await run('npm ls --depth 3', {output: 'target/tree-npm.txt'});
>>>>>>> 0be1e92 (clean tree output)
  await run('npm install @cyclonedx/cyclonedx-npm');
  await run('npx @cyclonedx/cyclonedx-npm --omit dev --output-file target/bom-npm.json --output-format JSON');
  await run('npx @cyclonedx/cyclonedx-npm --omit dev --output-file target/bom-npm.xml  --output-format XML');
  log(`generating 'bom-vaadin.js'`);
  const sbom = await consolidateSBoms('target/bom.json', 'target/bom-npm.json');
  fs.writeFileSync('target/bom-vaadin.json', JSON.stringify(sbom, null, 2));

  log(`running 'bomber'`);
  await run('bomber scan target/bom-vaadin.json --output json', { output: 'target/report-bomber.json' });
  log(`running 'osv-scanner'`);
  await run('osv-scanner --sbom=target/bom-vaadin.json --json', { output: 'target/report-osv-scanner.json' });

  const licenses = sumarizeLicenses('target/bom-vaadin.json');
  const vulnerabilities = sumarizeOSV('target/report-osv-scanner.json', {});
  sumarizeBomber('target/report-bomber.json', vulnerabilities);
  const errLic = checkLicenses(licenses);
  const errVul = checkVunerabilities(vulnerabilities);

  let gha = "";
  if (errVul) {
    err(`- Vulnerabilities:\n\n${errVul}\n`);
    gha += `\n## 🚫 Found Vulnerabilities\n\n`;
  } else {
    gha += `\n## ✅ No Vulnerabilities Found\n\n`;
  }
  gha +=reportVulnerabilities(vulnerabilities);
  if (errLic) {
    err(`- License errors:\n\n${errLic}\n`);
    gha += `\n## 🚫 Found License Issues\n`;
  } else {
    gha += `\n## ✅ Licenses Report\n`;
  }
  gha += reportLicenses(licenses);
  gha += reportFileContent("Maven Dependency Tree", 'target/tree-maven.txt', c => {
    return c.split('\n').map(l => l.replace(/^\[INFO\] /, ''))
      .filter(l => l.length && !/^(Scanning|Building|---|Build|Total|Finished)/.test(l)).join('\n');
  });
  gha += reportFileContent("NPM Dependency Tree", 'target/tree-npm.txt', c => {
    return c.split('\n').map(l => l.replace(/ overridden$/, '')).filter(l => l.length && !/ deduped|UNMET OPTIONAL/.test(l)).join('\n');
  });

  ghaStepReport(gha);

  if (errLic || errVul) {
    process.exit(1);
  }
}

main();