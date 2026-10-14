# checkUnreleased.js

Tells whether the products of a platform branch have unreleased commits, so you can
decide whether a maintenance release is needed and which products must be released
first.

For every product in the branch's `versions.json` the script:

1. finds the product's own repository,
2. finds the release tag of the pinned version (`25.3.3` or `v25.3.3`),
3. finds the product's maintenance branch: `<major>.<minor>` if the repository has
   it, otherwise the repository's default branch,
4. counts the commits on that branch after the tag, using the GitHub compare API.

A product pinned to a `-SNAPSHOT` version (e.g. `25.4-SNAPSHOT`) is marked
**MUST RELEASE**: it has to be released before platform. Its commits are counted
from the latest tag on the same `<major>.<minor>` line.

`versions.json` and `pom.xml` are read from GitHub, so a stale local checkout does
not matter. Nothing is cloned.

Requires Node.js and the GitHub CLI (`gh`), logged in with access to the private
vaadin repositories. No npm dependencies.

## Usage

```bash
node scripts/checkUnreleased.js [options] [platformBranch]
```

`platformBranch` defaults to `main`.

## Options

| Option | Description |
| --- | --- |
| `--details` | List the unreleased commits of every product (sha, date, author, title) |
| `--product <filter>` | Only products whose name or repository contains the filter (case insensitive). Repeatable |
| `--pending-only` | Hide products that are up to date, and the skipped list |
| `--local` | Read `versions.json` and `pom.xml` from the working tree instead of GitHub |
| `--format table\|json` | Output format, defaults to `table` |
| `-h`, `--help` | Print the built-in help |

## Examples

Check a maintenance branch:

```bash
node scripts/checkUnreleased.js 25.3
```

```
Platform 25.3 (vaadin/platform@25.3), {{version}} = 25.3.2

product           repo             pinned  base tag  branch  unreleased  status
----------------  ---------------  ------  --------  ------  ----------  ----------
flow              flow             25.3.3  25.3.3    25.3    9           UNRELEASED
flow-cdi          cdi              16.1.2  16.1.2    main    1           UNRELEASED
    ! no 16.1 branch, using default branch main
flow-components   flow-components  25.3.2  25.3.2    25.3    2           UNRELEASED
...
testbench         testbench        25.3.1  25.3.1    25.3    0           up to date

Must be released before platform: none
Unreleased commits:               flow, flow-cdi, flow-components, ...
```

Show the unreleased commits of Flow only:

```bash
node scripts/checkUnreleased.js 25.3 --product flow --details
```

Only what needs attention, with commits:

```bash
node scripts/checkUnreleased.js 25.3 --pending-only --details
```

Check an uncommitted `versions.json` change:

```bash
node scripts/checkUnreleased.js main --local
```

## Statuses

| Status | Meaning |
| --- | --- |
| `MUST RELEASE` | The pinned version is a `-SNAPSHOT`; release the product before platform |
| `UNRELEASED` | The maintenance branch has commits after the pinned release |
| `up to date` | No commits after the pinned release |
| `ERROR` | The product could not be checked, e.g. the tag does not exist or the repository is not accessible. The reason is printed under the row |

## Product mapping

The `PRODUCTS` constant at the top of the script maps `versions.json` keys to
repositories. Add or fix entries there. An entry can set:

- `repo`: the repository, a list of candidates (the first one that has the tag
  wins), or a function of the platform `[major, minor]`
- `prefix`: the usual tag prefix (`v`); the other form is tried as well
- `branch`: a fixed maintenance branch instead of `<major>.<minor>`

Some entries are grouped into one row:

- every web component (`mode: "lit"`) → `vaadin/web-components`
- `react-components` and `react-components-pro` → `vaadin/react-components` up
  to 25.3, `vaadin/web-components` from 25.4
- `flow-components` and the Java `{{version}}` entries (lumo/aura themes,
  messages, ordered layout, renderer) → `vaadin/flow-components`, where
  `{{version}}` is the latest platform release of the branch
- `mpr-v7` and `mpr-v8` → `vaadin/multiplatform-runtime-internal`

## Notes

- When there is no `<major>.<minor>` branch, the default branch is used and a note
  is printed. If the repository already has a release on a newer line, a second
  note warns that the default branch may have moved past the pinned line, so the
  count may include commits that are already released there.
- Entries without a version (`vaadin-designer`, `vaadin-spreadsheet`) and
  `vaadin-core` (released with platform) are listed as skipped.
- The compare API lists at most 250 commits per product; the count is always exact.
- A missing tag or a repository you cannot access gives an `ERROR` row; the
  other products are still checked.
