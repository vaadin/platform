# branch-release

When platform `X.Y.0-beta1` is released, for every repo on the `X.Y` train:

1. create the `X.Y` maintenance branch from `main`, and
2. open a PR moving `main` to `X.(Y+1)-SNAPSHOT`.

Both start from the **same commit** of `main`, so nothing that lands during the run ends up on one side only.

## Quick start

It runs by itself on the beta1 release (`.github/workflows/branch-release.yml`, `release: published`). By hand:

```bash
./scripts/dispatch-branch-release.sh --version 25.4 --dry-run          # preview in Actions
./scripts/dispatch-branch-release.sh --version 25.4                    # do it in Actions
./scripts/dispatch-branch-release.sh --version 25.4 --local --dry-run  # preview here
./scripts/dispatch-branch-release.sh --version 25.4 --repos flow,hilla --local
```

| option | meaning |
| --- | --- |
| `--version X.Y` | train to branch (required); `main` moves to `X.(Y+1)-SNAPSHOT` |
| `--repos a,b` | subset of the train's repos (default: all) |
| `--no-branch` | only open bump PRs; never create `X.Y` |
| `--local` | run here in temp clones with your `gh` login, instead of in Actions. This also works before the workflow is on `main`. |
| `--dry-run` | report what would change; no branches, no PRs |
| `--no-follow`, `--json` | as in `dispatch-spring-boot-bump.sh` |

Your own checkouts are never touched. The cell creates branches, sets a bot git identity and commits in whatever directory it is given, so it only ever runs in throwaway clones.

## Which repos

`src/select.ts` reads platform's `versions.json`: the release tag for the release trigger, `main` for manual runs. It picks every product whose `javaVersion`/`version`/`jsVersion` is a prerelease or SNAPSHOT of `X.Y`, or `{{version}}`. Products are mapped to repos by the table in `src/repos.ts` (`PRODUCT_REPOS`). `mpr-v7` and `mpr-v8` are the same repo, so it is processed once. Platform is always included.

- A product on the train **with no mapping** is listed as *unmapped* in the run summary and not processed. Add it to `PRODUCT_REPOS` and to `MERGE_ORDER`; a test enforces the latter.
- **Branch-only repos** (`BRANCH_ONLY_REPOS`): `vaadin-core` and its companion `vaadin` (`COMPANION_REPOS`; it is not in versions.json). Both are npm meta-packages whose `package.json` version is written by the release process, so `main` never carries a SNAPSHOT. They get the `X.Y` branch, but no bump PR. The branch is cut only while `main`'s `package.json` is on the train (`X.Y.0-*`).
- Some products are **excluded** on purpose (`EXCLUDED_PRODUCTS`) and show up as such in the report:
  - `vaadin-feature-pack` (feature-pack-internal): branched and bumped by hand.
- web-components is not in versions.json at all, and is not touched.

## What a cell does (`src/index.ts`)

1. Fetch `origin/main` and read the root `pom.xml` project version.
2. **Branch.** If `X.Y` exists on origin, it is left alone (`exists`). If main is not on `X.Y-SNAPSHOT`, the branch is not created (`skipped`): cutting it from a main that has already moved would give the maintenance branch the wrong version. Otherwise `X.Y` is pushed at main's SHA (a plain push, never a force push).
3. **Bump**, on `bot/bump-main-X.(Y+1)-SNAPSHOT`:
   - **Whole-token `X.Y-SNAPSHOT` → `X.(Y+1)-SNAPSHOT` in every tracked text file.** Lock files, `node_modules` and binaries are skipped. This one rule covers every pom (including `pom-dev*.xml`, `pom-production.xml`, `pom-portal.xml` …), `gradle.properties`, Gradle test fallbacks such as flow's `AbstractGradleTest.kt`, and READMEs. Those are the files past manual bumps went after one by one.
   - **Pom `<*.version>` properties pinned to a train prerelease** (`X.Y.0-alphaN|betaN|rcN`) → `X.(Y+1)-SNAPSHOT`. This catches `testbench.version`, and copilot's `flow.version`, `hilla.version` and so on, which pin releases instead of snapshots.
   - **Platform `versions.json`:** `javaVersion`/`version` values on the train → `X.(Y+1)-SNAPSHOT`. `jsVersion`, `{{version}}` and other trains (sso-kit 4.x …) are untouched.
   - **Per-repo extras** (`EXTRA_EDITS`): collaboration-kit's `COLLABORATION_ENGINE_VERSION = "X.Y"`, and in platform, `X.Y` is added after `main` in `.github/supported-branches.json` (the shared branch list for check-versions, bump-spring-boot and the license-checker audit). If an extra edit changes nothing, a warning is shown in the PR and in the report.
   - **Safety check:** the root pom must now read `X.(Y+1)-SNAPSHOT` and no pom may still contain `X.Y-SNAPSHOT`, or the cell fails without pushing.
4. Commit, push and open the PR `chore: bump main to X.(Y+1)-SNAPSHOT`. The PR body lists changed properties, warnings, the merge order and follow-ups. Re-running resets the existing PR's branch to main, recommits and force-pushes, so the PR stays one commit.

Every cell writes a `result.json`, even on failure. The workflow's report job and the dispatch script render them into one table.

## Merge order

A downstream repo's CI resolves upstream `X.(Y+1)-SNAPSHOT` artifacts, which only exist once the upstream bump is merged and published. Merge in the order given by `MERGE_ORDER`: flow → flow-components, hilla, testbench → the rest → platform.

## Not done (listed in each PR as follow-ups)

- Adding `X.Y` to other repos' workflow branch lists: flow `validation.yml` and `update-frontend-dependencies.yml`, testbench `bump-dependencies.yml`.
- npm package versions, such as hilla's `packages/ts/*/package.json`. Their release tooling owns them.

## Credentials

Same as `bump-spring-boot`: the workflow uses `secrets.VAADIN_BOT_TOKEN`, which needs **contents: write** and **pull_requests: write** on every train repo, including the private `*-internal` ones. Creating `X.Y` may also be blocked by branch-protection rules that restrict who can create matching branches. If so, the report shows the push error for that repo.

## Development

```bash
npm install
npm test          # node:test; add new test files to the "test" script explicitly
npx tsc --noEmit
```

Git/gh primitives are imported from `../bump-spring-boot/src/repo.ts`. `src/git.ts` adds the few that job didn't need.

| file | responsibility |
| --- | --- |
| `src/index.ts` | one repo: branch, bump, PR, result file |
| `src/select.ts` | CLI: train + versions.json → repo list |
| `src/repos.ts` | product → repo map, exclusions, extra edits, merge order |
| `src/bump.ts` | pure text transforms |
| `src/version.ts` | train parsing and version strings |
| `src/git.ts` | extra git primitives |
