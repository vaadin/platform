# compareVersions.js

Compares the entries of `versions.json` across git branches, so you can see at a
glance which version of a component, kit or Flow is used in each platform branch.

The script reads `versions.json` from every requested branch with
`git show <branch>:versions.json` — nothing is checked out and the working tree is
never touched. Each entry is flattened into a `section/entry:field` row, one row per
version field, so a component that has both a `javaVersion` and a `jsVersion` is
compared field by field.

Requires Node.js and a git checkout with the branches available locally (run
`git fetch` first if a branch looks out of date). No npm dependencies.

## Usage

```bash
node scripts/compareVersions.js [options] [branch...]
```

Branches can be given as local names (`24.9`), remote names (`origin/24.9`) or as
`WORKTREE` for the `versions.json` currently on disk. A plain name is resolved as a
local branch first and then as `origin/<name>`. When no branch is given, the script
compares the current branch with the three highest numbered release branches.

## Options

| Option | Description |
| --- | --- |
| `--all` | Compare all `<major>.<minor>` release branches |
| `--pattern <regexp>` | Compare all branches whose name matches the regexp |
| `--entry <filter>` | Only entries whose `section/name` key contains the filter (case insensitive). Repeatable |
| `--section <name>` | Only this top level section: `core`, `vaadin`, `kits` or `react`. Repeatable |
| `--diff-only` | Skip entries that have the same version on every branch |
| `--common-only` | Skip entries that are missing from at least one branch |
| `--format table\|csv\|json` | Output format, defaults to `table` |
| `-h`, `--help` | Print the built-in help |

## Examples

Compare Flow and Copilot on the default set of branches:

```bash
node scripts/compareVersions.js --entry flow --entry copilot
```

```
entry                             25.0         25.1         25.2         main
--------------------------------  -----------  -----------  -----------  -------------
core/flow-cdi:javaVersion         16.0.1       16.0.2       16.1.0       16.1.0
core/flow-components:javaVersion  {{version}}  {{version}}  {{version}}  {{version}}
core/flow:javaVersion             25.0.15      25.1.13      25.2.5       25.3.0-alpha6
kits/copilot:javaVersion          25.0.12      25.1.9       25.2.4       25.3.0-alpha5

4 entries, 3 differing across 4 branches
```

Show only the kits that differ between three specific branches:

```bash
node scripts/compareVersions.js 24.8 24.9 25.2 --section kits --diff-only
```

Export every 25.x branch to CSV for a spreadsheet:

```bash
node scripts/compareVersions.js --pattern '^25\.[0-9]+$' --format csv > versions.csv
```

Compare the local, uncommitted `versions.json` against a release branch:

```bash
node scripts/compareVersions.js WORKTREE 25.2 --diff-only
```

Machine readable output for further processing:

```bash
node scripts/compareVersions.js 24.9 main --entry testbench --format json
```

```json
{
  "branches": [
    { "name": "24.9", "ref": "24.9" },
    { "name": "main", "ref": "main" }
  ],
  "entries": [
    {
      "entry": "vaadin/vaadin-testbench:javaVersion",
      "differs": true,
      "versions": { "24.9": "9.5.6", "main": "25.2.0" }
    }
  ]
}
```

## Notes

- A `-` in a cell means the entry does not exist on that branch. Use `--common-only`
  to hide those rows.
- `{{version}}` placeholders are printed verbatim; they are resolved at build time
  and are not expanded by this script.
- Entries have been renamed over the years (for example `vaadin/vaadin-charts`
  became `vaadin/charts` around 24.0), so wide `--all` runs show the old and the new
  key as two separate rows with `-` gaps.
- Branches without a `versions.json`, or with an unparseable one, are reported on
  stderr and skipped instead of aborting the run — relevant for the oldest branches
  when using `--all`.
