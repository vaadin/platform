#!/usr/bin/env node
/*
 * Tells whether the products of a platform branch have unreleased commits.
 *
 * For every product in the branch's versions.json the script finds the
 * product's own repository, the tag of the pinned version and the head of the
 * product's maintenance branch (`<major>.<minor>`, or the repository's default
 * branch when no such branch exists), and counts the commits between them.
 * A product pinned to a `-SNAPSHOT` version must be released before platform.
 *
 * Requires the GitHub CLI (`gh`), authenticated with access to the private
 * vaadin repositories.
 *
 * Usage:
 *   node scripts/checkUnreleased.js [options] [platformBranch]
 *
 * platformBranch defaults to `main`.
 *
 * Options:
 *   --details              list the unreleased commits of every product
 *   --product <filter>     only products whose name or repository contains the
 *                          (case insensitive) filter, may be repeated
 *   --pending-only         hide products that are up to date or skipped
 *   --local                read versions.json and pom.xml from the working tree
 *                          instead of from GitHub
 *   --format table|json    output format, defaults to table
 *
 * Examples:
 *   node scripts/checkUnreleased.js 25.3
 *   node scripts/checkUnreleased.js 25.3 --pending-only --details
 *   node scripts/checkUnreleased.js 25.3 --product flow --details
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const PLATFORM_REPO = 'vaadin/platform';
const VERSION_FIELDS = ['javaVersion', 'jsVersion', 'version'];
const CONCURRENCY = 6;
// The compare API returns at most this many commits, `ahead_by` is always exact.
const COMPARE_COMMIT_LIMIT = 250;

/*
 * versions.json key -> repository. `repo` may be a list of candidates, the
 * first one that has the pinned tag wins, or a function of the platform
 * version ([major, minor], `main` being newest). `prefix` is the usual tag
 * prefix, the other form is tried as well. `branch` overrides the maintenance
 * branch.
 */
const PRODUCTS = {
  'flow': { repo: 'vaadin/flow' },
  'hilla': { repo: 'vaadin/hilla' },
  'flow-components': { repo: 'vaadin/flow-components' },
  'browserless-test': { repo: 'vaadin/browserless-test' },
  'flow-cdi': { repo: 'vaadin/cdi' },
  'vaadin-quarkus': { repo: 'vaadin/quarkus' },
  'mpr-v7': { repo: 'vaadin/multiplatform-runtime-internal' },
  'mpr-v8': { repo: 'vaadin/multiplatform-runtime-internal' },
  'vaadin-router': { repo: 'vaadin/router', prefix: 'v' },
  'vaadin-development-mode-detector': { repo: 'vaadin/vaadin-development-mode-detector', prefix: 'v' },
  'vaadin-usage-statistics': { repo: 'vaadin/vaadin-usage-statistics', prefix: 'v' },
  'copilot': { repo: 'vaadin/copilot-internal' },
  'appsec-kit-starter': { repo: 'vaadin/appsec-kit' },
  'azure-kit': { repo: 'vaadin/azure-kit' },
  'kubernetes-kit-starter': { repo: 'vaadin/kubernetes-kit' },
  'observability-kit-starter': { repo: 'vaadin/observability-kit' },
  'sso-kit-starter': { repo: 'vaadin/sso-kit' },
  'swing-kit': { repo: 'vaadin/swing-vaadin' },
  'vaadin-collaboration-engine': {
    repo: (platform) =>
      atLeast(platform, [24, 4])
        ? ['vaadin/collaboration-engine-internal', 'vaadin/collaboration-kit']
        : ['vaadin/collaboration-kit', 'vaadin/collaboration-engine-internal']
  },
  'vaadin-testbench': { repo: 'vaadin/testbench' },
  'vaadin-license-checker': { repo: 'vaadin/license-checker-vaadin10' },
  'vaadin-feature-pack': { repo: 'vaadin/feature-pack-internal' }
};
const WEB_COMPONENTS = { repo: 'vaadin/web-components', prefix: 'v' };
const REACT_COMPONENTS = {
  repo: (platform) => (atLeast(platform, [25, 4]) ? 'vaadin/web-components' : 'vaadin/react-components'),
  prefix: 'v'
};

function parseArgs(argv) {
  const options = {
    branch: null,
    details: false,
    productFilters: [],
    pendingOnly: false,
    local: false,
    format: 'table'
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--details':
        options.details = true;
        break;
      case '--product':
        options.productFilters.push(argv[++i].toLowerCase());
        break;
      case '--pending-only':
        options.pendingOnly = true;
        break;
      case '--local':
        options.local = true;
        break;
      case '--format':
        options.format = argv[++i];
        break;
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
        break;
      default:
        if (arg.startsWith('-') || options.branch) {
          console.error(`Unknown argument: ${arg}`);
          process.exit(1);
        }
        options.branch = arg;
    }
  }
  if (!['table', 'json'].includes(options.format)) {
    console.error(`Unknown format: ${options.format}`);
    process.exit(1);
  }
  options.branch = options.branch || 'main';
  return options;
}

function printHelp() {
  const source = fs.readFileSync(__filename, 'utf8');
  const comment = source.slice(source.indexOf('/*') + 2, source.indexOf('*/'));
  console.log(comment.replace(/^ \* ?/gm, '').trim());
}

// ---------------------------------------------------------------------------
// Versions

/**
 * Parses `25.3.3`, `v25.3.3`, `25.4.0-alpha3`, `6.3.0.rc1` and the snapshot
 * forms `25.4-SNAPSHOT` / `25.4.1-SNAPSHOT`. Returns null for anything else.
 */
function parseVersion(text) {
  const snapshot = /^v?(\d+)\.(\d+)(?:\.(\d+))?-SNAPSHOT$/.exec(text);
  if (snapshot) {
    return { major: +snapshot[1], minor: +snapshot[2], patch: +(snapshot[3] || 0), pre: null, snapshot: true };
  }
  const release = /^v?(\d+)\.(\d+)\.(\d+)(?:[.-]([0-9A-Za-z][0-9A-Za-z.-]*))?$/.exec(text);
  if (release) {
    return { major: +release[1], minor: +release[2], patch: +release[3], pre: release[4] || null, snapshot: false };
  }
  return null;
}

function compareVersions(a, b) {
  const diff = a.major - b.major || a.minor - b.minor || a.patch - b.patch;
  if (diff || a.pre === b.pre) {
    return diff;
  }
  // A release is newer than its pre-releases.
  if (!a.pre) return 1;
  if (!b.pre) return -1;
  const as = a.pre.match(/\d+|[A-Za-z]+/g) || [];
  const bs = b.pre.match(/\d+|[A-Za-z]+/g) || [];
  for (let i = 0; i < Math.max(as.length, bs.length); i++) {
    if (as[i] === undefined) return -1;
    if (bs[i] === undefined) return 1;
    const numeric = /^\d+$/.test(as[i]) && /^\d+$/.test(bs[i]);
    const d = numeric ? +as[i] - +bs[i] : as[i].localeCompare(bs[i]);
    if (d) return d;
  }
  return 0;
}

/** True when the platform line [major, minor] is at least `min`. */
function atLeast(platform, min) {
  return platform[0] > min[0] || (platform[0] === min[0] && platform[1] >= min[1]);
}

// ---------------------------------------------------------------------------
// GitHub

class NotFound extends Error {}

function gh(...args) {
  return new Promise((resolve, reject) => {
    execFile('gh', ['api', ...args], { maxBuffer: 64 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (!error) {
        resolve(stdout);
        return;
      }
      if (error.code === 'ENOENT') {
        reject(new Error('The GitHub CLI (gh) is not installed or not in PATH'));
        return;
      }
      const message = (stderr || error.message).trim().split('\n').pop();
      reject(/HTTP 404/.test(stderr) ? new NotFound(message) : new Error(message));
    });
  });
}

async function ghJson(...args) {
  return JSON.parse(await gh(...args));
}

/** Like gh() but resolves to null on 404. */
async function ghOptional(...args) {
  try {
    return await gh(...args);
  } catch (e) {
    if (e instanceof NotFound) {
      return null;
    }
    throw e;
  }
}

async function readPlatformFile(file, options) {
  if (options.local) {
    return fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8');
  }
  const content = await gh(
    `repos/${PLATFORM_REPO}/contents/${file}?ref=${encodeURIComponent(options.branch)}`,
    '-H',
    'Accept: application/vnd.github.raw+json'
  );
  return content;
}

/** Tag names starting with `prefix`, e.g. `v25.3.` */
async function listTags(repo, prefix) {
  const out = await gh('--paginate', `repos/${repo}/git/matching-refs/tags/${prefix}`, '--jq', '.[].ref');
  return out
    .split('\n')
    .filter(Boolean)
    .map((ref) => ref.replace(/^refs\/tags\//, ''));
}

/** The newest version tag starting with `prefix`, or null. */
async function latestTag(repo, prefix) {
  const tags = (await listTags(repo, prefix))
    .map((name) => ({ name, version: parseVersion(name) }))
    .filter((t) => t.version && !t.version.snapshot);
  tags.sort((a, b) => compareVersions(b.version, a.version));
  return tags.length ? tags[0].name : null;
}

async function tagExists(repo, tag) {
  return (await ghOptional(`repos/${repo}/git/ref/tags/${tag}`)) !== null;
}

async function branchExists(repo, branch) {
  return (await ghOptional(`repos/${repo}/branches/${branch}`, '--jq', '.name')) !== null;
}

async function defaultBranch(repo) {
  return (await gh(`repos/${repo}`, '--jq', '.default_branch')).trim();
}

async function compare(repo, base, head) {
  const jq =
    '{ahead_by, commits: [.commits[] | {sha: .sha[0:10], date: .commit.author.date[0:10], ' +
    'author: (.author.login // .commit.author.name), message: (.commit.message | split("\\n")[0])}]}';
  return ghJson(`repos/${repo}/compare/${encodeURIComponent(base)}...${encodeURIComponent(head)}`, '--jq', jq);
}

// ---------------------------------------------------------------------------
// Products

/** Platform line from the branch's pom.xml, e.g. [25, 4] for 25.4-SNAPSHOT. */
async function platformLine(options) {
  const pom = await readPlatformFile('pom.xml', options);
  const match = /<artifactId>vaadin-platform-parent<\/artifactId>[\s\S]*?<version>([^<]+)<\/version>/.exec(pom);
  const version = match && parseVersion(match[1]);
  if (!version) {
    throw new Error(`Cannot find the platform version in pom.xml of ${options.branch}`);
  }
  return [version.major, version.minor];
}

/** The version `{{version}}` stands for: the newest platform release of the line. */
async function resolvePlatformVersion(line) {
  const tag = await latestTag(PLATFORM_REPO, `${line[0]}.${line[1]}.`);
  return tag || `${line[0]}.${line[1]}-SNAPSHOT`;
}

function specFor(key, entry, version) {
  if (entry.mode === 'lit') return { ...WEB_COMPONENTS, name: 'web-components' };
  if (entry.mode === 'react') return { ...REACT_COMPONENTS, name: 'react-components' };
  if (version === '{{version}}' && entry.javaVersion) return { ...PRODUCTS['flow-components'], name: 'flow-components' };
  return PRODUCTS[key] ? { ...PRODUCTS[key], name: key } : null;
}

/** Groups the versions.json entries into one product per repository and version. */
function collectProducts(versions, line, platformVersion) {
  const products = new Map();
  const skipped = [];
  for (const [section, entries] of Object.entries(versions)) {
    if (!entries || typeof entries !== 'object') {
      continue;
    }
    for (const [key, entry] of Object.entries(entries)) {
      const field = VERSION_FIELDS.find((f) => entry[f]);
      let version = field && entry[field];
      if (!version) {
        skipped.push({ name: key, section, reason: 'no version' });
        continue;
      }
      const spec = specFor(key, entry, version);
      if (version === '{{version}}') {
        if (!spec || spec.name !== 'flow-components') {
          skipped.push({ name: key, section, reason: 'released with platform' });
          continue;
        }
        version = platformVersion;
      }
      if (!spec) {
        skipped.push({ name: key, section, reason: 'no repository mapping' });
        continue;
      }
      const repos = [].concat(typeof spec.repo === 'function' ? spec.repo(line) : spec.repo);
      const id = `${repos[0]}@${version}`;
      if (!products.has(id)) {
        products.set(id, { name: spec.name, repos, prefix: spec.prefix || '', branch: spec.branch, version, entries: [] });
      }
      const product = products.get(id);
      product.entries.push(key);
      // Rows named after a single key use the key, e.g. `mpr-v7, mpr-v8`.
      if (!entry.mode && version !== platformVersion) {
        product.name = product.entries.join(', ');
      }
    }
  }
  return { products: [...products.values()], skipped };
}

async function findBase(product, version) {
  const prefixes = [product.prefix, product.prefix ? '' : 'v'];
  for (const repo of product.repos) {
    for (const prefix of prefixes) {
      if (version.snapshot) {
        const tag = await latestTag(repo, `${prefix}${version.major}.${version.minor}.`);
        if (tag) return { repo, prefix, tag };
      } else if (await tagExists(repo, prefix + product.version)) {
        return { repo, prefix, tag: prefix + product.version };
      }
    }
  }
  return null;
}

async function checkProduct(product) {
  const result = {
    name: product.name,
    entries: product.entries,
    repo: product.repos[0],
    version: product.version,
    base: null,
    branch: null,
    unreleased: null,
    status: null,
    notes: [],
    commits: []
  };
  try {
    const version = parseVersion(product.version);
    if (!version) {
      throw new Error(`cannot parse version ${product.version}`);
    }
    const line = `${version.major}.${version.minor}`;

    const base = await findBase(product, version);
    if (base) {
      result.repo = base.repo;
      result.base = base.tag;
    } else if (!version.snapshot) {
      throw new Error(`tag ${product.version} not found in ${product.repos.join(', ')}`);
    }

    if (product.branch) {
      result.branch = product.branch;
    } else if (await branchExists(result.repo, line)) {
      result.branch = line;
    } else {
      result.branch = await defaultBranch(result.repo);
      result.notes.push(`no ${line} branch, using default branch ${result.branch}`);
      const prefix = base ? base.prefix : product.prefix;
      const newer =
        (await latestTag(result.repo, `${prefix}${version.major}.${version.minor + 1}.`)) ||
        (await latestTag(result.repo, `${prefix}${version.major + 1}.`));
      if (newer) {
        result.notes.push(`${newer} is released, ${result.branch} may have moved past ${line}`);
      }
    }

    if (result.base) {
      const diff = await compare(result.repo, result.base, result.branch);
      result.unreleased = diff.ahead_by;
      result.commits = diff.commits.reverse();
      if (diff.ahead_by > COMPARE_COMMIT_LIMIT) {
        result.notes.push(`only the oldest ${diff.commits.length} commits are listed`);
      }
    } else {
      result.notes.push(`never released on ${line}`);
    }

    if (version.snapshot) {
      result.status = 'MUST RELEASE';
    } else {
      result.status = result.unreleased > 0 ? 'UNRELEASED' : 'up to date';
    }
  } catch (e) {
    result.status = 'ERROR';
    result.notes.push(e.message);
  }
  return result;
}

async function mapConcurrently(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next++;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

// ---------------------------------------------------------------------------
// Output

const STATUS_ORDER = ['MUST RELEASE', 'UNRELEASED', 'ERROR', 'up to date'];

function printTable(results, skipped, options, header) {
  console.log(header);
  console.log();
  const columns = ['product', 'repo', 'pinned', 'base tag', 'branch', 'unreleased', 'status'];
  const rows = results.map((r) => [
    r.name,
    r.repo.replace(/^vaadin\//, ''),
    r.version,
    r.base || '-',
    r.branch || '-',
    r.unreleased === null ? '-' : String(r.unreleased),
    r.status
  ]);
  const widths = columns.map((c, i) => Math.max(c.length, ...rows.map((row) => row[i].length)));
  const format = (row) => row.map((cell, i) => cell.padEnd(widths[i])).join('  ').trimEnd();
  console.log(format(columns));
  console.log(format(widths.map((w) => '-'.repeat(w))));
  results.forEach((r, i) => {
    console.log(format(rows[i]));
    r.notes.forEach((note) => console.log(`    ! ${note}`));
    if (options.details) {
      r.commits.forEach((c) => console.log(`    ${c.sha} ${c.date} ${c.author.padEnd(20)} ${c.message}`));
      if (r.commits.length) console.log();
    }
  });

  if (!options.pendingOnly && skipped.length) {
    console.log();
    console.log('Skipped:');
    const reasons = new Map();
    skipped.forEach((s) => reasons.set(s.reason, (reasons.get(s.reason) || []).concat(s.name)));
    reasons.forEach((names, reason) => console.log(`  ${reason}: ${names.join(', ')}`));
  }

  const names = (status) => results.filter((r) => r.status === status).map((r) => r.name);
  console.log();
  console.log(`Must be released before platform: ${names('MUST RELEASE').join(', ') || 'none'}`);
  console.log(`Unreleased commits:               ${names('UNRELEASED').join(', ') || 'none'}`);
  if (names('ERROR').length) {
    console.log(`Could not be checked:             ${names('ERROR').join(', ')}`);
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const versions = JSON.parse(await readPlatformFile('versions.json', options));
  const line = await platformLine(options);
  const platformVersion = await resolvePlatformVersion(line);

  let { products, skipped } = collectProducts(versions, line, platformVersion);
  if (options.productFilters.length) {
    const matches = (text) => options.productFilters.some((f) => text.toLowerCase().includes(f));
    products = products.filter((p) => matches(p.name) || p.repos.some(matches) || p.entries.some(matches));
    skipped = skipped.filter((s) => matches(s.name));
  }

  let results = await mapConcurrently(products, CONCURRENCY, checkProduct);
  results.sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status) || a.name.localeCompare(b.name));
  if (options.pendingOnly) {
    results = results.filter((r) => r.status !== 'up to date');
  }

  if (options.format === 'json') {
    console.log(JSON.stringify({ branch: options.branch, platformVersion, products: results, skipped }, null, 2));
  } else {
    const source = options.local ? 'working tree' : `${PLATFORM_REPO}@${options.branch}`;
    printTable(results, skipped, options, `Platform ${line.join('.')} (${source}), {{version}} = ${platformVersion}`);
  }
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
