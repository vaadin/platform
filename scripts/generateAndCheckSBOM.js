#!/usr/bin/env node

// brew tap devops-kung-fu/homebrew-tap
// brew install devops-kung-fu/homebrew-tap/bomber
// brew install osv-scanner
// sudo go install github.com/google/osv-scanner/cmd/osv-scanner@v1

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const VAADIN_LICENSE = 'https://vaadin.com/commercial-license-and-service-terms';
const SBOM_URL = 'https://github.com/vaadin/platform/releases/download/%%VERSION%%/Software.Bill.Of.Materials.json'
const testProject = path.resolve('vaadin-platform-sbom');
const coreProject = path.resolve('vaadin-core-sbom');
const licenseWhiteList = [
  'ISC',
  'MIT',
  'MIT-0',
  '0BSD',
  'Apache-2.0',
  'Apache 2.0',
  'CDDL',
  'CDDL-1.0',
  'GPL-2.0-with-classpath-exception',
  'LGPL-2.1-or-later',
  'LGPL-2.1-only',
  'BSD-4-Clause',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'EPL-1.0',
  'EPL-2.0',
  'AFL-2.1',
  'MPL-1.1',
  'MPL-2.0',
  'CC0-1.0',
  'CC-BY-4.0',
  'Zlib',
  'WTFPL',
  'Python-2.0',
  'http://www.gnu.org/licenses/old-licenses/lgpl-2.1.html',
  'https://www.gnu.org/software/classpath/license.html',
  VAADIN_LICENSE,
  'https://www.highcharts.com/license',
  'http://www.gnu.org/licenses/lgpl-3.0.html',
  'CC-BY-3.0',
  'http://oss.sgi.com/projects/FreeB',
  'Apache-1.1',
  'http://font.ubuntu.com/ufl/ubuntu-font-licence-1.0.txt',
  'http://www.spdx.org/licenses/BSD-4-Clause',
  'BlueOak-1.0.0',
  'https://www.bouncycastle.org/licence.html',
  'https://opensource.org/licenses/MIT',
  'OFL-1.1'
];

const coreLicensesWhiteList = licenseWhiteList.toSpliced(licenseWhiteList.indexOf(VAADIN_LICENSE),1);

const cveWhiteList = {
  'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.15.4' : {
    cves: ['CVE-2023-35116'],
    description: 'Not a valid CVE report based on the vendor analysis and [research](https://github.com/FasterXML/jackson-databind/issues/3972)'
  },
  'pkg:maven/com.fasterxml.jackson.core/jackson-databind@2.15.3' : {
    cves: ['CVE-2023-35116'],
    description: 'Not a valid CVE report based on the vendor analysis and [research](https://github.com/FasterXML/jackson-databind/issues/3972)'
  },
  'pkg:maven/me.friwi/jcef-api@jcef-ca49ada%2Bcef-135.0.20%2Bge7de5c3%2Bchromium-135.0.7049.85' : {
    cves: ['CVE-2024-21639', 'CVE-2024-21640', 'CVE-2024-9410'],
    description: 'Wait for the update from the jcefmaven community. Meanwhile the swing-kit is supposed to be used with fixed websites and not to browse the internet, we have a check for that, so the only possible attacker would be the same person that created the swing application, aka our customer devs. so this vulnerability is not classified by us as critical issue'
  },
  'pkg:npm/railroad-diagrams@1.0.0' : {
    cves: ['CVE-2024-26467'],
    description: 'This is coming from the tools, @cyclonedx/cyclonedx-npm, we have used for sbom module, FP for us. '
  },
  'pkg:npm/libxmljs2@0.35.0' : {
    cves: ['CVE-2024-34394', 'CVE-2024-34393'],
    description: 'This is coming from the tools, @cyclonedx/cyclonedx, we have used for sbom module, FP for us. '
  },
  'pkg:npm/micromatch@4.0.7' : {
      cves: ['CVE-2024-4067'],
      description: 'Based on the assumption that the code is only run as part of a build, we take this as a false positive. Also we are tracking the development process to upgrade the vulnerable dependencies.'
  },
  'pkg:maven/io.netty/netty-common@4.1.118.Final' : {
    cves: ['CVE-2025-25193'],
    description: 'the cve has wrong version range, the related commit has been merged and released with 118.Final. referred in netty/issues/14795'
  },
  'pkg:maven/com.google.code.gson/gson@2.10' : {
    cves: ['CVE-2025-53864'],
    description: 'False positive: gson is used transitively via vaadin-swing-kit-client, but this CVE targets Connect2id Nimbus JOSE + JWT, which is not used in our context.'
  },
  'pkg:maven/io.projectreactor.netty/reactor-netty-quic@1.0.0-RC1' : {
    cves: ['CVE-2023-34054', 'CVE-2023-34062'],
    description: 'False report: the linked CVE is for netty with http protocol and from 2023, which the netty-quic artifact was released 2025 with the netty suite 1.3.x'
  },
  'pkg:maven/org.cyclonedx/cyclonedx-core-java@11.0.0' : {
    cves: ['CVE-2025-64518'],
    description: 'This is from a tool we use to generate the sbom. '
  }
}

const STYLE = `<style>
body {max-width: 800px; margin: auto; font-family: arial;padding-top: 2em;padding-bottom: 4em}
table {width: 100%; border-collapse: collapse; font-size: 14px; border 1em 0 1em}
table, th, td {border: solid 1px grey; vertical-align: top; padding: 5px 1px 5px 8px}
summary > h3 {display: inline-block}
body > div > h4 {padding-left: 2em; margin: 4px 0px 4px}
body > div > details > summary {padding-left: 4em}
h1,h2,h3 {color: dodgerblue}
pre[b] {border: solid 1px darkgrey}
</style>`;

const cmd = {
  useBomber: true, useOSV: true, useOWASP: true, checkCoreLicenses : fs.existsSync(coreProject),
  hasOssToken: !!(process.env.OSSINDEX_USER && process.env.OSSINDEX_TOKEN)
};
for (let i = 2, l = process.argv.length; i < l; i++) {
  switch (process.argv[i]) {
    case '--useSnapshots': cmd.useSnapshots = true; break;
    case '--disable-bomber': cmd.useBomber = false; break;
    case '--disable-osv-scan': cmd.useOSV = false; break;
    case '--disable-owasp': cmd.useOWASP = false; break;
    case '--enable-full-owasp': cmd.useFullOWASP = true; break;
    case '--version': cmd.version = process.argv[++i]; break;
    case '--compare': cmd.org = process.argv[++i]; break;
    case '--quick': cmd.quick = true; break;
    case '--skip-check-core-licenses' : cmd.checkCoreLicenses = false; break;
    default:
      console.log(`Usage: ${path.relative('.', process.argv[1])}
       [--useSnapshots] [--disable-bomber] [--disable-osv-scan] [--disable-owasp] [--enable-full-owasp] [--version x.x.x] [--quick] [--skip-check-core-licenses]`);
      process.exit(1);
  }
}

function log(...args) {
  process.stderr.write(`\x1b[0m> \x1b[0;32m${args}\x1b[0m\n`);
}
function out(...args) {
  process.stderr.write(`\x1b[2m\x1b[196m${args}\x1b[0m`);
}
function err(...args) {
  process.stderr.write(`\x1b[0;31m${args}\x1b[0m\n`);
}

function ghaStepReport(msg) {
  const f = process.env.GITHUB_STEP_SUMMARY;
  if (f && msg) {
    try {
      fs.accessSync(path.dirname(f), fs.constants.W_OK);
      fs.appendFileSync(f, msg);
    } catch (error) {
      err(error)
    }
  }
}

function ghaSetEnv(name, msg) {
  const f = process.env.GITHUB_ENV;
  if (f && msg) {
    try {
      fs.accessSync(path.dirname(f), fs.constants.W_OK);
      fs.appendFileSync(f, `${name}<<EOF\n${msg}\nEOF\n`);
    } catch (error) {
      err(error);
    }
  }
}

async function exec(order, ops) {
  ops = { ...{ throw: true, debug: true }, ...ops };
  log(`${order}${ops.output ? ` > ${ops.output}` : ''}`);
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
let onExit = () => { };
async function run(order, ops) {
  try {
    return await exec(order, ops);
  } catch (ret) {
    if (!ops || ops.throw !== false) {
      ret.stderr && out(ret.stderr);
      err(`!! ERROR ${ret.code} !! running: ${order}!!\n${!ops || ops.output || !ops.debug ? ret.stdout : ''}`)
      await onExit();
      process.exit(1);
    } else {
      ret.stderr && out(ret.stderr);
      return ret;
    }
  }
}

async function isInstalled(command) {
  if ((await exec(`which ${command}`, { debug: false, throw: false })).code) {
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
        if (l.license && /SEE LICENSE IN/.test(l.license.name)) {
          l.license.name = l.license.name.replace(/SEE LICENSE IN [^\)]+/, VAADIN_LICENSE);
        }
      }
      l.expression && (l.license = { id: l.expression });
    });
    // See https://github.com/mapbox/jsonlint README
    if (/jsonlint-lines-primitives/.test(c.purl) && !c.licenses) {
      c.licenses = [{ license: { id: 'MIT' } }];
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
      return p.add((l.expression ? l.expression :
        (l.license.id || (!l.license.name || / /.test(l.license.name)) && l.license.url || l.license.name))
        // remove parenthesis
        .replace(/[\(\)]/g, ''));
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

function highlight(s1, s2) {
  if (!s1 || !s2) {
    return s2;
  }
  let ret = "";
  for (let i = 0; i < s2.length; i++) {
    ret += (s1[i] === s2[i]) ? s2[i] : `<span style="color:blue">${s2[i]}</span>`;
  }
  return ret.replace(/<\/span><span [^>]+>/g, '');
}
function sortReleases(releases) {
  return [...new Set(releases)]
    .map(r => r
      .replace(/\.0$/, '.0.z')          // fix: 23.0.0  lesser than 23.0.0.alpha1
      .replace(/-/, '.z-')              // fix: 23.0-   lesser than 23.0.
      .replace(/\d+/g, n => +n+900000)) // fix: 23.0.10 lesser than 23.0.9
    .sort().reverse()
    .map(r => r
      .replace(/\d+/g, n => +n-900000).replace(/\.z/, '')
    );
}

async function getReleases() {
  return (await run(`git ls-remote --tags origin`, { debug: false }))
    .stdout.split('\n').map(l => l.replace(/.*refs\/tags\//, '')).filter(l => /^[2-9][3-9]\.\d.\d/.test(l));
}

async function getBranches() {
  return (await run(`git branch -r`, { debug: false }))
    .stdout.split('\n').map(b => b.replace(/ *origin\//, '')).filter(l => /^[2-9][3-9]\.\d/.test(l));
}

async function computeLastVersions(release) {
  const releases = await getReleases()
  const minor = release.replace(/^(\d+\.\d+).*$/, '$1');
  let sorted = sortReleases([release, ...releases]);
  const lastPatch = sorted[sorted.indexOf(release) + 1];
  const branch = (await getBranches()).filter(b => b === minor)[0];
  sorted = sortReleases([minor, ...(releases.filter(v => !v.startsWith(minor)))]);
  const prevMinor = sorted[sorted.indexOf(minor) + 1];
  return ({ release, minor, lastPatch, prevMinor, branch });
}

async function downloadSbom(release) {
  const url = SBOM_URL.replace('%%VERSION%%', release);
  const fileName = `target/bom-vaadin-${release}.json`;
  if ((await run(`curl -s -L --fail ${url} -o ${fileName}`, { throw: false })).code) {
    log(`cannot compare versions since there is no 'Software.Bill.Of.Materials.json' in ${release} release`)
    return;
  }
  return fileName;
}

async function sumarizeDiffs(newSbomFile, oldSbomFile, currVersion, prevVersion) {
  log(`Comparing ${currVersion} against ${prevVersion}`)
  const oldJson = JSON.parse(fs.readFileSync(oldSbomFile));
  const newJson = JSON.parse(fs.readFileSync(newSbomFile));
  const sameMinor = currVersion.replace(/^(\d+\.\d+).*$/, '$1') === prevVersion.replace(/^(\d+\.\d+).*$/, '$1');
  const components = {};
  const summary = {components, currVersion, prevVersion}
  const vaadinRegx = /^pkg:(maven|npm)\/(@vaadin|com.vaadin)/;
  oldJson.components.forEach((e) => {
    let comp = decodeURIComponent(e.purl).replace(/[?#].*$/g, '').replace(/@[^@]+$/, '');
    const r = (components[comp] = components[comp] || {});
    r.oldVersion = e.version;
    r.vaadin = vaadinRegx.test(comp);
    r.status = 'removed';
  });
  newJson.components.forEach((e) => {
    let comp = decodeURIComponent(e.purl).replace(/[?#].*$/g, '').replace(/@[^@]+$/, '');
    const r = (components[comp] = components[comp] || {});
    r.newVersion = e.version;
    r.vaadin = vaadinRegx.test(comp);
    r.status = !r.oldVersion ? 'added' : (r.oldVersion === r.newVersion || (sameMinor && r.vaadin && e.version === currVersion)) ? 'same' : 'modified';
  });
  return summary;
}

function sumarizeOSV(f, summary) {
  const res = JSON.parse(fs.readFileSync(f));
  res.results && res.results.forEach(r => {
    r.packages.forEach(p => {
      p.vulnerabilities.forEach(v => {
        v.affected.forEach(a => {
          const pkg = a.package.purl + "@" + p.package.version;
          summary[pkg] = summary[pkg] || {};
          v.aliases && v.aliases.forEach(id => {
            summary[pkg][id] = summary[pkg][id] || {};
            summary[pkg][id].title = v.summary;
            summary[pkg][id].details = v.details;
            (summary[pkg][id].scanner = summary[pkg][id].scanner || []).push('osv-scan');
          });
        });
      });
    });
  });
  return summary;
}

function sumarizeBomber(f, summary) {
  let res;
  try {
    if (!fs.existsSync(f) || fs.statSync(f).size === 0) {
      return summary;
    }
    res = JSON.parse(fs.readFileSync(f));
  } catch (error) {
    err(`Error parsing JSON file '${f}'`, error);
    return summary;
  }
  (res.packages || []).forEach(p => {
    (p.vulnerabilities || []).forEach(v => {
      const pkg = p.coordinates.replace(/\?.+/, '');
      const id = v.id;
      summary[pkg] = summary[pkg] || {};
      summary[pkg][id] = summary[pkg][id] || {};
      summary[pkg][id].title = v.title;
      summary[pkg][id].details = v.description;
      (summary[pkg][id].scanner = summary[pkg][id].scanner || []).push(`${f.includes('oss') ? 'oss' : 'osv'}-bomber`);
    });
  });
  return summary;
}

function sumarizeOWASP(f, summary) {
  const res = JSON.parse(fs.readFileSync(f));
  res.dependencies.forEach(d => {
    (d.vulnerabilities || []).forEach(v => {
      const id = v.name;
      (d.packages || []).map(p => p.id).forEach(pkg => {
        summary[pkg] = summary[pkg] || {};
        summary[pkg][id] = summary[pkg][id] || {};
        summary[pkg][id].title = summary[pkg][id].title || `${v.description.substring(0, 120)}…`;
        summary[pkg][id].details = v.description;
        summary[pkg][id].cpes = v.vulnerableSoftware.map(o => o.software.id);
        (summary[pkg][id].scanner = summary[pkg][id].scanner || []).push('owasp');
      });
    })
  });
  return summary;
}

function checkLicenses(licenses, whiteList) {
  let ret = "";
  Object.keys(licenses).forEach(lic => {
    if (whiteList.indexOf(lic) < 0) {
      ret += `  - Invalid license '${lic}' in: ${licenses[lic].join(' and ')}\n`;
    }
  });
  return ret;
}

function checkVunerabilities(vuls) {
  let err = "", msg = "";
  Object.keys(vuls).forEach(v => {
    const cves = Object.keys(vuls[v]).sort().join(', ');
    const asset = cveWhiteList[v];
    const listed = asset && cves ===  asset.cves.sort().join(', ');
    const line = `  - Vulnerabilities in: ${v} [${Object.keys(vuls[v]).join(', ')}] (${[...new Set(Object.values(vuls[v]).flatMap(o => o.scanner))].join(',')})
    ${asset ? '👌 ' + asset.description + '\n' : ''}      · ${[...new Set(Object.values(vuls[v]).flatMap(o => o.cpes))].join('\n          · ')}\n`;
    listed ? msg += line: err += line;
  });
  return { err, msg };
}

function checkDifferencess(summary) {
  const comps = summary.components;
  let ret = "";
  const count = status => {return {
    total: Object.keys(comps).reduce((i, k) => comps[k].status === status ? ++i: i, 0),
    vaadin: Object.keys(comps).reduce((i, k) => comps[k].vaadin && comps[k].status === status ? ++i: i, 0)
  }};
  ['removed', 'added', 'modified', 'same'].forEach(s => {
    const r = count(s);
    r.total && (ret += `   - ${r.total} packages ${s} (${r.total - r.vaadin} external, ${r.vaadin} vaadin)\n`)
  });
  return ret;
}

function reportLicenses(licenses) {
  let md = "", html = "";
  Object.keys(licenses).sort((a, b) => licenseWhiteList.indexOf(a) - licenseWhiteList.indexOf(b)).forEach(lic => {
    const status = licenseWhiteList.indexOf(lic) < 0 ? '🚫' : '✅';
    const license = `${lic}`;
    const sumMd = `<details><summary>${licenses[lic].length}</summary><code>${licenses[lic].join('</code><br/><code>')}</code></details>`;
    const sumHt = `<details><summary>${licenses[lic].length}</summary><pre>${licenses[lic].join('\n')}</pre></details>`;
    html += `<tr><td>${status}</td><td>${license}</td><td>${sumHt}</td></tr>\n`;
    md += `|${status}|\`${license}\`|${sumMd}|\n`;
  });
  html && (html = `<table><tr><th></th><th>License</th><th>Packages</th></tr>\n${html}</table>\n`);
  md && (md = "|  | License | Packages |\n|-------|--------|-------|\n" + md);
  return { md, html };
}

function reportVulnerabilities(vuls, known) {
  let md = "", html = "";
  Object.keys(vuls).forEach(v => {
    const cves = Object.keys(vuls[v]).sort().join(', ');
    const asset = cveWhiteList[v];
    const listed = asset && cves ===  asset.cves.sort().join(', ') || false;
    if (known != listed) {
      return;
    }
    const title = o => o.title.replace(/&[a-z]+;|[<>\s\`"']/g, ' ').trim();
    html += `<tr><td><code>${v}</code>${listed ? '<br>👌 ' + asset.description :''}</td><td><ul><li>${Object.keys(vuls[v]).map(o =>
      `<a href="https://nvd.nist.gov/vuln/detail/${o}">${o}</a> <i>${title(vuls[v][o])}</i> (${[...new Set(vuls[v][o].scanner)].join(',')})`).join('<li>')}</ul></td></tr>\n`;
    md += `|\`${v}\`${listed ? '<br>👌 ' + asset.description :''}|<ul><li>${Object.keys(vuls[v]).map(o =>
      `[${o}](https://nvd.nist.gov/vuln/detail/${o}) _${title(vuls[v][o])}_ (${[...new Set(vuls[v][o].scanner)].join(',')})`).join('<li>')}</ul>\n`;
  });
  html && (html = `<table><tr><th>Package</th><th>CVEs</th>\n${html}</table>\n`)
  md && (md = "| Package | CVEs |\n|-------|--------|\n" + md);
  return { md, html };
}

function reportDiffs(summary) {
  const comps = summary.components;
  let html = `<h3>✍ Dependencies Comparison since V${summary.prevVersion}</h3><div>\n`;
  const colors = ['style="color:red"', 'style="color:orange"', 'style="color:blue"', 'style="color:green"'];
  const icons = {removed:'🔴', added:'🟠', modified:'🔵', same:'🟢'};
  const packages = Object.keys(comps).sort((a, b) => comps[a].vaadin && !comps[b].vaadin ? 1 : !comps[a].vaadin && comps[b].vaadin ? -1 : a.localeCompare(b));
  ['removed', 'added', 'modified', 'same'].forEach(status => {
    const color = colors.shift();
    let pkgs = packages.filter(pkg => comps[pkg].status === status);
    if (!pkgs.length) {
      log(status, "ret")
      return;
    }
    const table = (title, type) => {
      const list = pkgs.filter(p => p.startsWith(type));
      if (!list.length) {
        return;
      }
      const vaadin = list.filter(p => comps[p].vaadin);
      const other = list.filter(p => !comps[p].vaadin);
      html += `<details><summary>&nbsp;&nbsp;&nbsp;&nbsp;${title}: ${other.length} external, ${vaadin.length} vaadin, ${list.length} total</summary><table><tr><th>Component</th><th>Old Version</th><th>Version</th><th>Status</th></tr>`;
      list.forEach(pkg => {
        const r = comps[pkg];
        html += `<tr><td>${r.vaadin ? `<span style="color:dodgerblue">${pkg}</span>` : pkg}</td><td>${r.oldVersion || ''}</td><td>${highlight(r.oldVersion, r.newVersion) || ''}</td><td ${color}>${r.status}</td></tr>\n`;
      });
      html += `</table></details>`;
    }
    html += `<h4>&nbsp;&nbsp;&nbsp;${icons[status]} ${pkgs.length} ${status} dependencies</h4>`;
    table('Maven', 'pkg:maven/');
    table('Npm', 'pkg:npm/');
  });
  html += '</div>'
  return html;
}

function reportFileContent(title, file, filter = c => c) {
  const content = filter(fs.readFileSync(file).toString());
  return `\n<details><summary><h3>${title}</h3></summary><pre b>\n${content}\n</pre></details>\n`;
}

async function main() {
  log(`Running: ${process.argv[1]}\nParameters: ${JSON.stringify(cmd)}`);

  await isInstalled('bomber');
  await isInstalled('osv-scanner');
  await isInstalled('dependency-check');
  await isInstalled('mvn');
  await isInstalled('curl');

  const currVersion = cmd.version || (await run('mvn help:evaluate -N -q -DforceStdout -Dexpression=project.version', { debug: false })).stdout;
  const currBranch = (await run('git branch --show-current', { debug: false })).stdout.trim()
    || (await run('git rev-parse --short HEAD', { debug: false })).stdout.trim()  || '-';
  const prev = await computeLastVersions(currVersion);
  log(`Building SBOM for version ${currVersion}, current: ${currBranch}${prev.branch ? ', needed: ' + prev.branch : ''}`);
  if (prev.branch && prev.branch !== currBranch && (prev.branch + '-SNAPSHOT') !== currVersion) {
    log(`Changing branch to ${prev.branch}`)
    await run(`git checkout ${prev.branch}`, { debug: false });
    const tag = (await run(`git tag`, { debug: false, throw: false })).stdout.split('\n').filter(l => l == currVersion)[0];
    if (tag) {
      log(`Checking out tag ${tag}`)
      await run(`git checkout ${tag}`, { debug: false });
    }
    onExit = async () => {
      await run(`git stash`, { debug: false, throw: false });
      await run(`git checkout ${currBranch}`, { debug: false, throw: false });
    }
  }

  if (!cmd.quick && cmd.version) {
    await run(`mvn -ntp -N -B -DnewVersion=${cmd.version} -Psbom versions:set -q -DgenerateBackupPoms=false`);
  }

  if (!cmd.quick) {
    await run(`./scripts/generateBoms.sh${cmd.useSnapshots ? ' --useSnapshots' :''}`, { debug: false });
    await run('mvn -ntp -B clean install -T 1C -q -DskipTests');
  }

  log(`cd ${testProject}`);
  process.chdir(testProject);

  if (!fs.existsSync(coreProject)) {
    cmd.checkCoreLicenses = false;
  }
  let coreLicensesResult=undefined;
  let coreLicenses=undefined;
  if(cmd.checkCoreLicenses){
    log(`generating Core SBOM`);
    await run('mvn -ntp -B org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom -q -f ' + coreProject);
    coreLicenses = sumarizeLicenses(coreProject+'/target/bom.json');
    coreLicensesResult = checkLicenses(coreLicenses, coreLicensesWhiteList);
  }

  if (!cmd.quick) {
    // Ensure package.json and node_modules are empty
    await run('rm -rf package.json node_modules frontend src');
    fs.mkdirSync('node_modules');
    fs.writeFileSync("package.json","{}");
    await run('mvn clean package -ntp -B -Pproduction -DskipTests -q');
    await run('mvn dependency:tree -ntp -B', { output: 'target/tree-maven.txt' });
    await run('mvn -ntp -B org.cyclonedx:cyclonedx-maven-plugin:makeAggregateBom -q');
    await run('npm ls --depth 6', { output: 'target/tree-npm.txt' , throw: false});
    await run('npm install --silent');
    await run('npx --yes @cyclonedx/cyclonedx-npm --output-file target/bom-npm.json --output-format JSON');
  }

  log(`generating 'bom-vaadin.js'`);
  const sbom = await consolidateSBoms('target/bom.json', 'target/bom-npm.json');
  fs.writeFileSync('target/bom-vaadin.json', JSON.stringify(sbom, null, 2));

  const licenses = sumarizeLicenses('target/bom-vaadin.json');

  const vulnerabilities = {}
  if (cmd.useBomber) {
    if (!cmd.quick) {
      const cmdBomber = `bomber scan target/bom-vaadin.json --output json`;
      await run(cmdBomber, { output: 'target/bomber-osv-report.json' });
      cmd.hasOssToken && await run(
        `${cmdBomber} --provider ossindex --username ${process.env.OSSINDEX_USER} --token ${process.env.OSSINDEX_TOKEN}`,
        { output: 'target/bomber-oss-report.json' });
    }
    sumarizeBomber('target/bomber-osv-report.json', vulnerabilities);
    fs.existsSync('target/bomber-oss-report.json') && sumarizeBomber('target/bomber-oss-report.json', vulnerabilities);
  }

  if (cmd.useOSV) {
    !cmd.quick && await run('osv-scanner --sbom=target/bom-vaadin.json --json', { output: 'target/osv-scanner-report.json', throw: false });
    sumarizeOSV('target/osv-scanner-report.json', vulnerabilities);
  }

  if (cmd.useOWASP) {
    // https://github.com/jeremylong/DependencyCheck/issues/4293
    // https://github.com/jeremylong/DependencyCheck/issues/1947
    fs.existsSync('package-lock.json') && fs.unlinkSync('package-lock.json')
    !cmd.quick && await run(`mvn org.owasp:dependency-check-maven:check -DnvdApiKey=${process.env.NVD_API_KEY} -DnvdApiDelay=6000 -Dformat=JSON -q`, { throw: false });
    sumarizeOWASP('target/dependency-check-report.json', vulnerabilities);
  }

  if (cmd.useFullOWASP) {
    !cmd.quick && await run('dependency-check -f JSON -f HTML --prettyPrint --out target --scan .');
    sumarizeOWASP('target/dependency-check-report.json', vulnerabilities);
  }



  const errLic = checkLicenses(licenses, licenseWhiteList);
  const errVul = checkVunerabilities(vulnerabilities).err;
  const msgVul = checkVunerabilities(vulnerabilities).msg;
  let md = "";
  let html = `${STYLE}<h2>V${currVersion} Dependencies Report</h2>\n`;
  let errMsg = "#### Dependencies Report\n\n";
  if (errVul) {
    errMsg += `- 🚫 Vulnerabilities:\n\n${errVul}\n`;
    md += `\n### 🚫 Found Vulnerabilities\n`;
    html += `\n<h3>🚫 Found Vulnerabilities</h3>\n`
    const errVuls = reportVulnerabilities(vulnerabilities, false);
    md += errVuls.md;
    html += errVuls.html;
  }
  if (msgVul) {
    errMsg += `- 🟠 Known Vulnerabilities:\n\n${msgVul}\n`;
    md += `\n### 🟠 Known Vulnerabilities\n`;
    html += `\n<h3>🟠 Known Vulnerabilities</h3>\n`;
    const knownVuls = reportVulnerabilities(vulnerabilities, true);
    md += knownVuls.md;
    html += knownVuls.html;
  }
  if(!errVul && !msgVul) {
    errMsg += `- 🔒 No Vulnerabilities\n`;
    md += `\n### 🔒 No Vulnerabilities\n`;
    html += `\n<h3>🔒 No Vulnerabilities</h3>\n`;
  }

  if (cmd.checkCoreLicenses) {
    if (coreLicensesResult) {
      md += `\n### 🚫 Found Core License Issues\n`;
      html += `\n<h3>>🚫 Found Core License Issues</h3>\n`;
      errMsg += `- 📔 Found Core License Issues:\n` + coreLicensesResult+`\n`;
      md += reportLicenses(coreLicenses).md;
      html += reportLicenses(coreLicenses).html;
    } else {
      errMsg += `- 📔 No Core License Issues\n`;
      md += `\n### 📔 CoreLicenses\n`;
      html += `\n<h3>📔 Core Licenses</h3>\n`;
    }
  }

  if (errLic) {
    md += `\n### 🚫 Found License Issues\n`;
    html += `\n<h3>>🚫 Found License Issues</h3>\n`;
    md += reportLicenses(licenses).md;
    html += reportLicenses(licenses).html;
  } else {
    errMsg += `- 📔 No License Issues\n`;
    md += `\n### 📔 Licenses\n`;
    html += `\n<h3>📔 Licenses</h3>\n`;
  }


  let cnt = reportFileContent("🌳 Maven Dependencies", 'target/tree-maven.txt', c => {
    return c.split('\n').map(l => l.replace(/^\[INFO\] +/, ''))
      .filter(l => l.length && !/^(Scanning|Building|---|Build|Total|Finished|BUILD)/.test(l)).join('\n');
  });
  md += cnt;
  html += cnt;

  cnt = reportFileContent("🌳 Npm Dependencies", 'target/tree-npm.txt', c => {
    return c.split('\n').map(l => l.replace(/ overridden$/, '')).filter(l => l.length && !/ deduped|UNMET OPTIONAL|no-name/.test(l)).join('\n');
  });
  md += cnt;
  html += cnt;

  for await (const v of [...new Set([prev.lastPatch, prev.prevMinor])]) {
    if (v !== currVersion) {
      const file = await downloadSbom(v);
      if (file) {
        const sum = await sumarizeDiffs('target/bom-vaadin.json', file, currVersion, v);
        cnt = reportDiffs(sum) || '';
        md += cnt;
        html += cnt;
        if (v === prev.lastPatch) {
          const errDiff = checkDifferencess(sum);
          if (errDiff) {
            errMsg += `- 🟠 Changes in ${currVersion} since V${v}\n${errDiff}`;
          } else {
            errMsg += `- 🟢 No dependencies changes in ${currVersion} since V${v}\n`
          }
        }
      }
    }
  }

  ghaStepReport(md);
  fs.writeFileSync('target/dependencies.html', html);

  ghaSetEnv('DEPENDENCIES_REPORT', errMsg);

  err(errMsg);
  await onExit()

  if (errLic || errVul) {
    process.exit(1);
  }
}

main();
