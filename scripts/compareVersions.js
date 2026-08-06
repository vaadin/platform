#!/usr/bin/env node
/*
 * Compares the entries of versions.json across git branches.
 *
 * Usage:
 *   node scripts/compareVersions.js [options] [branch...]
 *
 * Branches may be given as local names (24.9), remote names (origin/24.9) or
 * as `HEAD`/`WORKTREE` for the file currently on disk. When no branch is given,
 * the current branch plus the three highest numbered release branches are used.
 *
 * Options:
 *   --all                  compare all `<major>.<minor>` release branches
 *   --pattern <regexp>     compare all branches whose name matches the regexp
 *   --entry <filter>       only entries whose key contains the (case insensitive)
 *                          filter, may be repeated
 *   --section <name>       only this top level section (core, vaadin, kits, react),
 *                          may be repeated
 *   --diff-only            skip entries that have the same version everywhere
 *   --common-only          skip entries that are missing from some branch
 *   --format table|csv|json  output format, defaults to table
 *
 * Examples:
 *   node scripts/compareVersions.js 24.8 24.9 main
 *   node scripts/compareVersions.js --all --entry flow --diff-only
 *   node scripts/compareVersions.js --pattern '^24\.\d+$' --format csv > versions.csv
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERSIONS_FILE = 'versions.json';
// Fields that hold a version number; anything else in an entry is metadata.
const VERSION_FIELDS = ['javaVersion', 'jsVersion', 'npmVersion', 'version'];
const MISSING = '-';

function git(...args) {
  return execFileSync('git', args, {
    cwd: path.resolve(__dirname, '..'),
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
}

function tryGit(...args) {
  try {
    return git(...args);
  } catch (e) {
    return null;
  }
}

function parseArgs(argv) {
  const options = {
    branches: [],
    entryFilters: [],
    sections: [],
    all: false,
    pattern: null,
    diffOnly: false,
    commonOnly: false,
    format: 'table'
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '--all':
        options.all = true;
        break;
      case '--diff-only':
        options.diffOnly = true;
        break;
      case '--common-only':
        options.commonOnly = true;
        break;
      case '--pattern':
        options.pattern = new RegExp(argv[++i]);
        break;
      case '--entry':
        options.entryFilters.push(argv[++i].toLowerCase());
        break;
      case '--section':
        options.sections.push(argv[++i]);
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
        if (arg.startsWith('-')) {
          console.error(`Unknown option: ${arg}`);
          process.exit(1);
        }
        options.branches.push(arg);
    }
  }
  if (!['table', 'csv', 'json'].includes(options.format)) {
    console.error(`Unknown format: ${options.format}`);
    process.exit(1);
  }
  return options;
}

function printHelp() {
  const source = fs.readFileSync(__filename, 'utf8');
  const comment = source.slice(source.indexOf('/*') + 2, source.indexOf('*/'));
  console.log(comment.replace(/^ \* ?/gm, '').trim());
}

/** All branch names known to git, local ones first, remotes without the `origin/` prefix. */
function allBranchNames() {
  const names = new Set();
  const list = (ref) =>
    (tryGit('for-each-ref', '--format=%(refname:short)', ref) || '').split('\n').filter(Boolean);
  list('refs/heads').forEach((n) => names.add(n));
  list('refs/remotes/origin').forEach((n) => {
    const short = n.replace(/^origin\//, '');
    if (short !== 'HEAD') {
      names.add(short);
    }
  });
  return [...names];
}

/** Sorts `24.9` before `25.0` and puts non numeric names last. */
function compareBranchNames(a, b) {
  const numeric = (name) => /^\d+(\.\d+)*$/.test(name);
  if (numeric(a) && numeric(b)) {
    const as = a.split('.').map(Number);
    const bs = b.split('.').map(Number);
    for (let i = 0; i < Math.max(as.length, bs.length); i++) {
      const diff = (as[i] || 0) - (bs[i] || 0);
      if (diff) {
        return diff;
      }
    }
    return 0;
  }
  if (numeric(a)) return -1;
  if (numeric(b)) return 1;
  return a.localeCompare(b);
}

function resolveBranches(options) {
  let names = options.branches;

  if (options.pattern) {
    names = names.concat(allBranchNames().filter((n) => options.pattern.test(n)));
  }
  if (options.all) {
    names = names.concat(allBranchNames().filter((n) => /^\d+\.\d+$/.test(n)));
  }
  if (names.length === 0) {
    // Default: what is checked out plus the three newest release branches.
    const current = tryGit('rev-parse', '--abbrev-ref', 'HEAD') || 'main';
    const releases = allBranchNames()
      .filter((n) => /^\d+\.\d+$/.test(n))
      .sort(compareBranchNames)
      .slice(-3);
    names = [...releases, current];
  }

  const seen = new Set();
  return names
    .filter((n) => !seen.has(n) && seen.add(n))
    .sort(compareBranchNames)
    .map((name) => ({ name, ref: resolveRef(name) }))
    .filter((branch) => {
      if (!branch.ref) {
        console.error(`Skipping unknown branch: ${branch.name}`);
      }
      return branch.ref;
    });
}

/** Maps a user supplied branch name to something `git show` understands. */
function resolveRef(name) {
  if (name === 'WORKTREE') {
    return name;
  }
  for (const candidate of [name, `origin/${name}`]) {
    if (tryGit('rev-parse', '--verify', '--quiet', `${candidate}^{commit}`)) {
      return candidate;
    }
  }
  return null;
}

function readVersions(branch) {
  const content =
    branch.ref === 'WORKTREE'
      ? fs.readFileSync(path.resolve(__dirname, '..', VERSIONS_FILE), 'utf8')
      : tryGit('show', `${branch.ref}:${VERSIONS_FILE}`);
  if (content === null) {
    console.error(`Skipping ${branch.name}: no ${VERSIONS_FILE} on that branch`);
    return null;
  }
  try {
    return JSON.parse(content);
  } catch (e) {
    console.error(`Skipping ${branch.name}: ${VERSIONS_FILE} is not valid JSON (${e.message})`);
    return null;
  }
}

/**
 * Flattens versions.json into `{ 'core/button:jsVersion': '25.3.0-alpha8', ... }`.
 * Entries carrying several version fields produce one row per field, so that a
 * component with both a Java and a JS version is compared field by field.
 */
function flatten(versions, options) {
  const flat = {};
  for (const [section, entries] of Object.entries(versions)) {
    if (!entries || typeof entries !== 'object') {
      continue; // e.g. "platform": "{{version}}"
    }
    if (options.sections.length && !options.sections.includes(section)) {
      continue;
    }
    for (const [name, entry] of Object.entries(entries)) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }
      const key = `${section}/${name}`;
      if (options.entryFilters.length && !options.entryFilters.some((f) => key.toLowerCase().includes(f))) {
        continue;
      }
      for (const field of VERSION_FIELDS) {
        if (entry[field] !== undefined) {
          flat[`${key}:${field}`] = String(entry[field]);
        }
      }
    }
  }
  return flat;
}

function buildTable(branches, options) {
  const columns = [];
  for (const branch of branches) {
    const versions = readVersions(branch);
    if (versions) {
      columns.push({ branch: branch.name, ref: branch.ref, entries: flatten(versions, options) });
    }
  }
  if (columns.length === 0) {
    console.error(`No branch provided a readable ${VERSIONS_FILE}`);
    process.exit(1);
  }

  const keys = [...new Set(columns.flatMap((c) => Object.keys(c.entries)))].sort();
  const rows = [];
  for (const key of keys) {
    const values = columns.map((c) => (key in c.entries ? c.entries[key] : MISSING));
    const present = values.filter((v) => v !== MISSING);
    if (options.commonOnly && present.length !== columns.length) {
      continue;
    }
    if (options.diffOnly && new Set(values).size === 1) {
      continue;
    }
    rows.push({ key, values, differs: new Set(present).size > 1 });
  }
  return { columns, rows };
}

function printTable({ columns, rows }) {
  const header = ['entry', ...columns.map((c) => c.branch)];
  const body = rows.map((r) => [r.key, ...r.values]);
  const widths = header.map((h, i) => Math.max(h.length, ...body.map((r) => r[i].length), 0));
  const line = (cells) => cells.map((c, i) => c.padEnd(widths[i])).join('  ').trimEnd();

  console.log(line(header));
  console.log(widths.map((w) => '-'.repeat(w)).join('  '));
  body.forEach((r) => console.log(line(r)));

  const differing = rows.filter((r) => r.differs).length;
  console.log();
  console.log(`${rows.length} entries, ${differing} differing across ${columns.length} branches`);
}

function printCsv({ columns, rows }) {
  const escape = (value) => (/[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  console.log(['entry', ...columns.map((c) => c.branch)].map(escape).join(','));
  rows.forEach((r) => console.log([r.key, ...r.values].map(escape).join(',')));
}

function printJson({ columns, rows }) {
  const result = {
    branches: columns.map((c) => ({ name: c.branch, ref: c.ref })),
    entries: rows.map((r) => ({
      entry: r.key,
      differs: r.differs,
      versions: Object.fromEntries(columns.map((c, i) => [c.branch, r.values[i]]))
    }))
  };
  console.log(JSON.stringify(result, null, 2));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const branches = resolveBranches(options);
  if (branches.length === 0) {
    console.error('No branches to compare');
    process.exit(1);
  }
  const table = buildTable(branches, options);
  ({ table: printTable, csv: printCsv, json: printJson })[options.format](table);
}

main();
