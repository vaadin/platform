# bump-spring-boot

Keeps the `spring.boot.version` Maven property current across several Vaadin repos and their
maintained branches, opening one rolling pull request per repo/branch.

**Patch level only.** Minor and major bumps are intentionally *not* applied — those change what a
maintenance branch ships and need human review. The script's job is to keep the patch level current,
nothing more.

## Quick start

```bash
# See what would change, without creating anything
./scripts/dispatch-spring-boot-bump.sh --dry-run

# Do it: bump every default target and report the PRs
./scripts/dispatch-spring-boot-bump.sh

# Narrow it down
./scripts/dispatch-spring-boot-bump.sh --repos flow,hilla --branches 25.1

# Run the bump on this machine instead of in Actions
./scripts/dispatch-spring-boot-bump.sh --local
```

Defaults: repos `platform,flow,hilla,copilot-internal`, branches `main,25.2,25.1`.

## Two ways to run it

| | default (Actions) | `--local` |
| --- | --- | --- |
| where the bump runs | GitHub Actions, one job per repo/branch | your machine, sequentially |
| credential | `secrets.GHTK` | your own `gh` login |
| `gh` scopes needed | `workflow` (to dispatch) | `repo` only |
| your checkouts | untouched | untouched |
| requires the workflow on `main` | yes | **no** |
| parallelism | all cells at once | one at a time |

Both paths produce the same PRs and the same end-of-run report, and both are safe to re-run.

`--local` clones each repo to a temporary directory rather than using your checkouts, then deletes it.
That isolation is not cosmetic: the bump script creates branches, sets a bot git identity and commits
in whatever directory it is pointed at, so aiming it at a working checkout would switch your branch,
write `github-actions[bot]` into that repo's `.git/config`, and carry any uncommitted changes onto the
bot branch. Cloning sidesteps all of it and makes local behave exactly like CI.

`--local` is also the only way to run this **before** the workflow is merged to `main`, since
`workflow_dispatch` is only honored from the default branch.

One clone per repo is reused across that repo's branches — each cell branches from `origin/<base>`
anyway. Clones use `--filter=blob:none`, so even flow is quick.

The script prints a per-target table and then the collection of pull requests with their links:

```
repo               branch  result
copilot-internal   25.1    4.0.7 -> 4.0.8  created
copilot-internal   25.2    4.1.0 -> 4.1.1  created
copilot-internal   main    up to date (4.1.1)
...
platform           25.1    4.0.7 -> 4.0.8  created
platform           25.2    up to date (4.1.1)
platform           main    up to date (4.1.1)

Pull requests (7 created, 0 updated):
  copilot-internal   25.1    4.0.7 -> 4.0.8     https://github.com/vaadin/copilot-internal/pull/884
  copilot-internal   25.2    4.1.0 -> 4.1.1     https://github.com/vaadin/copilot-internal/pull/883
  flow               25.1    4.0.7 -> 4.0.8     https://github.com/vaadin/flow/pull/2202
  flow               25.2    4.1.0 -> 4.1.1     https://github.com/vaadin/flow/pull/2201
  hilla              25.1    4.0.7 -> 4.0.8     https://github.com/vaadin/hilla/pull/3313
  hilla              25.2    4.1.0 -> 4.1.1     https://github.com/vaadin/hilla/pull/3312
  platform           25.1    4.0.7 -> 4.0.8     https://github.com/vaadin/platform/pull/9370

5 of 12 target(s) already up to date. Run: https://github.com/vaadin/platform/actions/runs/123
```

The same collection is rendered in the workflow run's job summary, so the PR list is available on
GitHub even when the run was dispatched from the Actions UI rather than this script.

## How the pieces fit

| piece | role |
| --- | --- |
| `scripts/dispatch-spring-boot-bump.sh` | Local trigger. Checks targets, dispatches, follows the run, prints the PR report. Does not edit anything itself. |
| `.github/workflows/bump-spring-boot.yml` | Runs the bump in CI, one matrix cell per repo/branch. Holds the write credential. |
| `scripts/bump-spring-boot/` (this package) | The actual bump: resolve version, edit the pom, open or update the PR. One process per cell. |

The default path runs the bump in Actions so the credential that can push to four repos stays a
repository secret and never has to exist on a laptop; the local script then only needs enough access
to dispatch a workflow and read its artifacts. `--local` trades that for immediacy, pushing with your
own `gh` credentials instead.

### Why a central workflow

The workflow lives only in `vaadin/platform` and clones the target repos. The alternative — copying a
workflow into all four repos — would mean four places to keep in sync, and the release branches of
those repos carry far fewer workflows than `main` does (flow's `25.2` has two), so per-branch
automation would have to be back-ported branch by branch.

## Running the bump directly

Normally you don't — use `--local` on the dispatch script, which handles cloning, looping and
reporting for you. This is the debugging entry point for a single cell:

```bash
cd scripts/bump-spring-boot
npm install
npx tsx src/index.ts --repo flow --branch 25.1 --repo-dir /path/to/clone --dry-run
```

> [!WARNING]
> `--repo-dir` is written to, not just read. Without `--dry-run` this script checks out a new branch,
> sets `user.name`/`user.email` to `github-actions[bot]` in that repo's `.git/config`, commits and
> pushes. Point it at a throwaway clone, never at a checkout you work in. `--local` exists precisely
> so you don't have to think about this.

| flag | meaning |
| --- | --- |
| `--repo <name>` | repo name under `vaadin/`, used for `gh -R` and the PR body |
| `--branch <name>` | base branch to target |
| `--repo-dir <path>` | checkout to operate on |
| `--result-file <path>` | where to write the machine-readable outcome |
| `--dry-run` | resolve and report only; no branch, commit, push or PR |
| `--verbose` | log how many versions came back from Maven Central |

Exit code is 0 for a successful bump *and* for "already up to date"; 1 only on a real failure.

`--result-file` is always written, including on failure, so a broken cell shows up in the run report
as an error rather than disappearing from it:

```json
{ "repo": "flow", "branch": "25.1", "status": "created",
  "from": "4.0.7", "to": "4.0.8",
  "pr": { "number": 2202, "url": "https://github.com/vaadin/flow/pull/2202" } }
```

`status` is `created`, `updated`, `up-to-date`, `dry-run` or `error`.

## How the version is chosen

`src/patch.ts` anchors on the value the branch already declares and filters Maven Central's
[`spring-boot-starter-parent` metadata](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/maven-metadata.xml)
down to:

1. the same `major.minor` as the current value, then
2. stable releases only, then
3. the highest of those, and only if it is greater than the current value.

Both filters matter, and each guards against a real trap:

- **The branch's own line is the anchor.** Different branches sit on entirely different Spring Boot
  lines — 25.x on 4.x, 24.x on 3.5.x, 23.x on 2.7.x. "Newest overall" would be wrong for all but one.
- **`<latest>` and `<release>` are not trustworthy here.** At the time of writing, Maven Central
  reports both as `4.2.0-M1` — a *milestone* of a *newer minor*. Trusting either field would push
  every branch onto a prerelease of the wrong line. The metadata is read for its full version list
  only; those two fields are ignored.

A version pinned by hand to a prerelease is left alone, on the assumption the pin was deliberate.

If a newer major/minor exists, the PR body says so in a note — visible, but never applied.

## Rolling PRs

Each repo/branch gets at most one open PR, identified by the title prefix `chore: bump Spring Boot`.
On a later run with a newer patch available, the existing PR's branch is reset to base, re-committed
and force-pushed, and the PR title/body updated — so it stays a single commit rather than
accumulating one bump commit per run.

Branch names are `bot/spring-boot-<base>-<YYYY-MM-DD>`, with `-2`…`-99` suffixing on collision.

> The title prefix is deliberately distinct from `check-versions`' `chore: maintenance version bumps`.
> `findExistingPr` takes the prefix as a parameter for the same reason — matching the wrong prefix
> would make one job hijack and overwrite the other's PR.

## The invariant this relies on

All four repos declare `spring.boot.version` **exactly once**, in the **root `pom.xml`**:

- `platform/pom.xml`, `flow/pom.xml`, `hilla/pom.xml`, `copilot-internal/pom.xml`

Everything else references `${spring.boot.version}` — 37 consumers in flow alone. That is what makes
the edit a single-line replace, done with a targeted string substitution rather than an XML
round-trip (re-emitting the document would reformat the whole pom and turn a one-line bump into an
unreviewable diff).

`src/pom.ts` **asserts** this rather than assuming it, and fails loudly on zero or multiple matches.
That matters more than it looks: hilla's Gradle builds read this property out of the root pom with
`XmlSlurper` at configuration time and throw a `GradleException` when it is missing
(`packages/java/gradle-plugin/build.gradle`,
`packages/java/tests/gradle/kotlin-gradle-test/settings.gradle`). Silently editing nothing, or one of
two declarations, would be much worse than a red job.

## Known Spring Boot pins this does *not* touch

Three repos carry hardcoded Spring Boot versions outside the property. They are deliberately left
alone — listed here so they stay tracked rather than forgotten.

- **flow — Gradle plugin functional tests.**
  `flow-plugins/flow-gradle-plugin/src/functionalTest/kotlin/com/vaadin/gradle/MiscSingleModuleTest.kt`
  hardcodes the version twice (a `val springBootVersion` and a bare `id 'org.springframework.boot'
  version '…'` literal). It is not driven by the Maven property and has already drifted from it.
  Bumping it changes what the Gradle plugin is tested against — a behavioral change that does not
  belong in a one-line pom PR.
- **hilla — a dead BOM entry.** `packages/java/tests/spring/native/pom.xml` hardcodes
  `spring-boot-dependencies` at an old 3.1.x. It is inert (the block omits
  `<type>pom</type><scope>import</scope>`, so it is not actually a BOM import) but will keep
  drifting. Worth a separate cleanup.
- **copilot-internal — test fixture starters.** Four archetype fixtures under
  `copilot/src/test/resources/com/vaadin/copilot/walkingskeletonstarters/` inherit
  `spring-boot-starter-parent` directly. Deliberately pinned fixtures; leave them.

## Overlap with other automation

- **`copilot-internal` has Dependabot doing patch-only Maven updates** for `main`, `25.0` and `24.9`,
  so on `main` both it and this job could open a Spring Boot patch PR. Either drop
  `copilot-internal`+`main` from the default set, or add an `ignore` entry for
  `org.springframework.boot:*` to that repo's `.github/dependabot.yml` so this job owns Spring Boot.
  Dependabot there does *not* cover `25.2`/`25.1`/`24.10`, which is the gap this job fills.
- **`scripts/check-versions/`** is the sibling job for `versions.json`. It never touches pom
  properties; this one never touches `versions.json`. They share conventions but no code — that
  package resolves a module-level `REPO_ROOT` pointing at the platform checkout and runs every git
  command there, which is exactly wrong when operating on a clone of another repo.

## Credentials

The workflow uses `secrets.GHTK`, the cross-repo PAT already used by `pit.yml`, because the job's own
`GITHUB_TOKEN` cannot write to other repositories. It needs **contents: write** and
**pull_requests: write** on all four repos, including private `copilot-internal`.

> A secret's scopes cannot be read from outside, and cloning a private repo only proves *read*. If
> pushes fail with a permission error, that is the first thing to check. flow's
> `update-frontend-dependencies.yml` pushes bump PRs with `secrets.VAADIN_BOT_TOKEN`, which is the
> established write-capable bot token in this org.

Locally, `gh` needs the `workflow` scope to dispatch (`gh auth refresh -h github.com -s workflow`).
`--local` dispatches nothing, so `repo` scope alone is enough there — and it uses your own login, so
it works even if `GHTK` turns out to lack write access.

## Development

```bash
npm install
npm test          # node:test unit tests for patch.ts and pom.ts
npx tsc --noEmit  # typecheck
```

`npm test` names its test files explicitly rather than globbing, matching `check-versions` — **add new
test files to the `test` script** or they will not run.

Files:

| file | responsibility |
| --- | --- |
| `src/index.ts` | CLI and orchestration |
| `src/maven.ts` | fetch + parse the Maven Central metadata (with retry) |
| `src/patch.ts` | pick the newest same-minor stable patch |
| `src/pom.ts` | locate and rewrite the single property declaration |
| `src/repo.ts` | git/gh primitives, parameterized on the checkout directory |

> **The workflow only runs from `main`.** GitHub Actions honors `workflow_dispatch` for the file on
> the default branch only, so changes to `.github/workflows/bump-spring-boot.yml` *or* to this
> package take effect only once merged to `main`. Pushing them to a release branch changes nothing.
