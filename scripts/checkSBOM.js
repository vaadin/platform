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
// const versions = require('../../versions.json');

const licenseWhiteList = [
  'ISC',
  'MIT',
  '0BSD',
  'Apache-2.0',
  'CDDL',
  'CDDL-1.0',
  'GPL-2.0-with-classpath-exception',
  'LGPL-2.1-or-later',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'SEE LICENSE IN LICENSE',
  'SEE LICENSE IN https://vaadin.com/license/cvdl-4.0',
  'https://www.highcharts.com/license',
  'Vaadin Commercial License and Service Terms',
  'https://vaadin.com/commercial-license-and-service-terms',
  'Zlib',
  'CC0-1.0',
  'AFL-2.1',
  'CC-BY-4.0'
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
      ret.components = ret.components.concat(ret.components, sbom.components);
      ret.dependencies = ret.dependencies.concat(ret.dependencies, sbom.dependencies);
    }
  });
  ret.components.forEach(c => {
    c.licenses && c.licenses.forEach(l => {
      l.expression && (l.license = { id: l.expression });
    });
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
    if (!lic) {
      (summary[null] = summary[null] || []).push(comp);
    } else {
      lic.split(/ +(?:OR|AND) +/).forEach(l => {
        (summary[l] = summary[l] || []).push(comp);
      });
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
  res.packages.forEach(p => {
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
  let ret = "|  | License | Packages |\n|-------|--------|-------|\n";
  Object.keys(licenses).sort((a, b) => licenseWhiteList.indexOf(a) - licenseWhiteList.indexOf(b)).forEach(lic => {
    const status = licenseWhiteList.indexOf(lic) < 0 ? '🚫' : '✅';
    const license = `\`${lic}\``;
    const summary = `<details><summary>${licenses[lic].length}</summary><ul><li><code>${licenses[lic].join('</code><li><code>').replace(/@(\d)/g, ' $1')}</code></ul></details>`
    ret += `|${status}|${license}|${summary}|\n`;
  });
  return ret;
}

function reportVulnerabilities(vuls) {
  let ret = "| Package | CVEs |\n|-------|--------|\n";
  Object.keys(vuls).forEach(v => {
    ret += `|\`${v}\`|<ul><li>${Object.keys(vuls[v]).map(o => `[${o}](https://nvd.nist.gov/vuln/detail/${o}) _${vuls[v][o].title}_`).join('<li>')}</ul>\n`;
  });
  return ret;
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
  await run('mvn package -ntp -B -Pproduction -DskipTests');
  await run('mvn dependency:tree', {output: 'target/tree-maven.out'});
  await run('mvn -ntp -B org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom -q');
  await run('npm ls --depth 1', {output: 'target/tree-npm.out'});
  await run('npm install @cyclonedx/cyclonedx-npm');
  await run('npx @cyclonedx/cyclonedx-npm --omit dev --output-file target/bom-npm.json --output-format JSON');
  await run('npx @cyclonedx/cyclonedx-npm --omit dev --output-file target/bom-npm.xml  --output-format XML');
  log(`generating 'bom-all.js'`);
  const sbom = await consolidateSBoms('target/bom.json', 'target/bom-npm.json');
  fs.writeFileSync('target/bom-all.json', JSON.stringify(sbom, null, 2));

  log(`running 'bomber'`);
  await run('bomber scan target/bom-all.json --output json', { output: 'target/report-bomber.json' });
  log(`running 'osv-scanner'`);
  await run('osv-scanner --sbom=target/bom-all.json --json', { output: 'target/report-osv-scanner.json' });

  const licenses = sumarizeLicenses('target/bom-all.json');
  const vulnerabilities = sumarizeOSV('target/report-osv-scanner.json', {});
  sumarizeBomber('target/report-bomber.json', vulnerabilities);
  const errLic = checkLicenses(licenses);
  const errVul = checkVunerabilities(vulnerabilities);

  let gha = "";
  if (errVul) {
    err(`- Vulnerabilities:\n\n${errVul}\n`);
    gha += `\n🚫 Found Vulnerabilities\n\n`;
  }
  gha +=reportVulnerabilities(vulnerabilities);
  if (errLic) {
    err(`- License errors:\n\n${errLic}\n`);
    gha += `\n🚫 Found License Issues\n`;
  }
  gha += reportLicenses(licenses);

  console.log(gha);

  ghaStepReport(gha);

  if (errLic || errVul) {
    process.exit(1);
  }
}

main();