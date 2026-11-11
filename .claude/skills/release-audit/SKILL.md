---
name: release-audit
description: Audit a Vaadin platform minor release (e.g. 25.4) for completeness. Resolves every product repository from vaadin/platform's versions.json, keeps only the work that is new compared to what the previous minor already shipped, analyzes each repository in parallel for features/fixes/breaking changes and their completeness (javadoc, docs, TestBench, browserless-test coverage), and produces an aggregated release-audit-<version>.html report.
argument-hint: [platform-version]
arguments: [version]
---

You are auditing a Vaadin platform minor release for completeness. The argument is the target minor, e.g. `25.4` (normalize `25.4.0-beta1` → `25.4`). If it is missing, use the line of the platform `main` branch (`platformVersion` in `versions.json`) and say which version you chose.

Call the target `$VERSION` and the previous minor `$PREV` below.

**The one rule that matters most: report only work that is new in `$VERSION`.** Anything that already shipped in any `$PREV.x` release (the `.0` or a later maintenance release) must not appear, no matter how it got there: through the branch point, a cherry-pick, a manual backport, a forward merge, or a feature that was already public as experimental. Steps 3 and 4 filter mechanically; step 5 makes every analysis agent prove each entry against the shipped sources.

## Workspace

Work in `$AUDIT_DIR`, default `~/scratch/release-audit` (never inside a repository checkout):

- `repo/<name>/` — clones; `repo/<name>/changes.md` and `repo/<name>/result.md` are the per-repo results
- `audit-tmp/` — manifest, commit lists, scratch
- `release-audit-$VERSION.html` — the deliverable

Re-runs reuse existing clones (`git -C repo/<name> fetch --all --tags --prune`). The per-repo result files are version-less: when the workspace holds results of another version, move them to `audit-tmp/results-<that version>/<name>/` first. For a re-run of the same version, keep the previous `result.md` of every repo whose window (step 4) gained no substantive commits since that run, re-analyze only the others, and say which repos were refreshed and which reused.

`SKILL_DIR` below is the directory containing this file.

## Step 1 — Clone the platform and resolve the repositories

```bash
mkdir -p repo audit-tmp
gh repo clone vaadin/platform repo/platform -- --filter=blob:none   # or fetch if present
git -C repo/platform checkout -q --detach origin/main
python3 "$SKILL_DIR/scripts/resolve_repos.py" --version $VERSION \
  --check-unreleased repo/platform/scripts/checkUnreleased.js --out audit-tmp/repos.json
```

The script reads `versions.json` of the platform branch for `$VERSION` (or `main` while that branch does not exist yet) and of `$PREV`, maps every product to its repository with `scripts/checkUnreleased.js` (the mapping lives there and only there — when a product is unmapped or mapped wrongly, fix `PRODUCTS` in that script rather than working around it here), and writes one entry per repository:

- `dev_ref` — what `$VERSION` ships: the repo's `<major>.<minor>` maintenance branch for the pinned version if it exists; otherwise the default-branch tip while the product is still in development (SNAPSHOT or alpha/beta/rc pin of an unreleased platform), else the pinned release tag.
- `shipped_ref` — what `$PREV` shipped, chosen the same way from the `$PREV` pins: the maintenance branch tip (covers every `$PREV.x` maintenance release, and cherry-picks that are about to ship in one) or the pinned tag. `null` when the repository is not part of `$PREV` — then it is new and its whole history is in scope.
- `unchanged: true` when both refs are the same (typically a kit pinned to the same release in both lines): nothing to audit.

It also adds `vaadin/web-components` (since 25.4 its version is `{{version}}`, which `checkUnreleased.js` skips) and `vaadin/platform` itself, picks `$PREV` (for `X.0`: the newest `(X-1).*` line whose `.0` was published before `X.0`), and reports:

- `unresolved` — products whose repository or tag cannot be read (usually no access to a private repo). List them in the final report; do not guess.
- `dropped_since_prev` — repositories that are no longer separate products, e.g. `vaadin/cdi` and `vaadin/quarkus` folded into `vaadin/flow`, `vaadin/react-components` into `vaadin/web-components` in 25.4. The importing repo's window then contains the imported history; only the move itself (new module location, changed coordinates) is a change.
- `reference_repos` — `vaadin/docs`, `vaadin/browserless-test`, `vaadin/testbench`, `vaadin/flow-components` are cloned as reference material for the agents even when they have nothing to audit.

Print the resolved list (repo, `shipped_ref .. dev_ref`) before continuing.

## Step 2 — Clone

For every repository in `repos` (skip `unchanged`) and in `reference_repos`:

```bash
gh repo clone vaadin/<name> repo/<name> -- --filter=blob:none    # fetch instead when it exists
```

Blobs are fetched lazily, through plain `git`. If that fails with `could not read Username` (private repos) or `GitHub is temporarily limiting some unauthenticated downloads`, configure `git -C repo/<name> config credential.helper '!gh auth git-credential'`, and if that is not enough send Basic auth on every request: `git -C repo/<name> config http.https://github.com/.extraheader "Authorization: Basic $(printf 'x-access-token:%s' "$(gh auth token)" | base64 -w0)"` (a `Bearer` header is rejected).

Check out `dev_ref` (detached) in every audited clone. Reference clones go to the branch matching `$VERSION` if one exists, else the default branch; for a released `$VERSION` use the state it shipped with, unless the reference repo did not exist yet (then keep the default branch and tell the agents coverage is judged against today's state).

## Step 3 — Compute the change windows

For every audited repository:

```bash
python3 "$SKILL_DIR/scripts/change_window.py" --clone repo/<name> --name <name> \
  --dev <dev_ref> [--shipped <shipped_ref>] --out-dir audit-tmp/excl
```

The window is `git log --first-parent $(merge-base shipped dev)..dev`. The script drops every window commit that already shipped: its PR number appears on the shipped side (the cherry-pick bot keeps the original number: `subject (#orig) (CP: 25.3) (#cp)`), its subject (minus backport suffixes) equals a shipped-side subject (manual backports with a new PR number), or it is a merge of commits the shipped ref already contains. Results go to `audit-tmp/excl/<name>-kept.txt` and `<name>-excluded.txt` (with the reason). Do not replace this with `git log --cherry-pick` / patch-ids: on blob-less clones that fetches every blob.

Record `window`, `excluded_already_shipped` and `kept` per repo in `audit-tmp/repos.json` (python, never hand-written JSON) and print one line per repo. Many kits land at 0 kept commits; that is correct. Typical minors: flow/flow-components/hilla/copilot 150–400 kept commits, others under 60. For a major (`X.0`) expect every repo to have a window and aligned repos with 500+ commits.

## Step 4 — Analyze in parallel

One analysis agent per repository with kept commits. Repos with 0 kept commits (or `unchanged`) get a `result.md` saying "No changes in $VERSION" without an agent. Use the Workflow tool if it is available (invoking this skill is the opt-in; one `agent()` per repo in a `pipeline()`, phase "Analyze"; normalize `args` with `typeof args === 'string' ? JSON.parse(args) : args`), otherwise parallel Agent calls in batches of about six. For more than ~200 kept commits tell the agent to process the log in ~150-commit slices and group per area, still producing one `changes.md` and `result.md`; for more than ~300 (majors), to fold minor fixes into grouped entries (30–60 entries in total). For a repository that is new in `$VERSION`, ask for the 5–15 major capabilities instead of a commit list.

Agents do not see this skill; give each one this self-contained prompt with the placeholders filled in:

````
You are auditing the repository clone at <abs>/repo/<name> for the Vaadin <VERSION> release. The working tree is checked out at <dev_ref>, the state that ships in <VERSION>. The previous platform minor <PREV> shipped <shipped_ref> of this repository.

Scope: ONLY the commits listed in <abs>/audit-tmp/excl/<name>-kept.txt. Commits in <name>-excluded.txt already shipped in <PREV>.x; ignore them, and when an entry would mix kept and excluded PRs, describe only the kept part.

Reference clones, READ-ONLY (never checkout, fetch or modify): <abs>/repo/docs (articles/), <abs>/repo/browserless-test, <abs>/repo/testbench, and the vaadin-*-testbench modules in <abs>/repo/flow-components.

a) Find the relevant changes: features, fixes, breaking changes and deprecations that affect users of the framework. Use the subjects (PR numbers; `gh pr view <nr> --repo vaadin/<name>` when unclear). EXCLUDE dependency bumps, CI/build/release chores, version bumps, formatting, test-only changes, and changes reverted within the window. A change is breaking if it uses a conventional-commit `!` or a BREAKING CHANGE footer, or removes or incompatibly changes public/protected API. Do not trust a `chore:` prefix alone: grep the subjects for deprecat/remov/renam/breaking.

   NEW-IN-<VERSION> CHECK — mandatory for every entry before you write it. The work must not already be available in <shipped_ref>:
   - For an entry with public API, look the symbol up at the shipped ref: `git -C <abs>/repo/<name> grep -n '<Symbol>' <shipped_ref> -- '*.java' '*.ts' '*.tsx' '*.js'`. If it already exists there with the same signature, the feature shipped in <PREV>: drop the entry (a later fix to it may stay as a fix).
   - For a behavior change or fix without API, check that the shipped ref does not already contain it, e.g. `git -C <abs>/repo/<name> log --oneline <shipped_ref> | grep -iF '<key words of the subject>'`, and for a PR number not in either list `git -C <abs>/repo/<name> log <shipped_ref> --format=%s | grep -F '#NNNN'`.
   - A feature that was already public in <PREV> as experimental or behind a feature flag is not new; if <VERSION> only removes the flag, report one entry "<Feature> is no longer experimental" of type feature and say in the description that it was available as experimental since <PREV> or earlier.
   Record entries that you dropped by this check in one intro line of changes.md ("Already in <PREV>: …") so the filtering can be reviewed.

   Write `changes.md`:

   # Changes in <name> for <VERSION>
   ## <User-facing title>
   - **Type:** feature | fix | breaking | deprecation
   - **PRs/commits:** #1234, abc1234
   - **Public API:** `com.vaadin.SomeClass#someMethod(...)` (or "none")
   - **Description:** 1–3 sentences from the user's point of view.

   The Public API line must come from the shipped source at <dev_ref>, never from PR titles, commit messages or diffs: find each class/method/constructor/field with `git grep` and copy the real name and signature. This catches revert-and-replace (an API added and later reshipped differently), renames within the window, titles that differ from the merged identifier, wrong class or package guessed from prose, and "removed" vs only `@Deprecated`. A symbol absent from the dev-ref tree does not ship; drop entries for work that was reverted with nothing reshipped.

b) Docs: decide whether each change should be documented (user-facing features and behavior changes: yes; internal fixes: N/A). If yes, search the docs clone. Record OK, PARTIAL (say what is missing) or MISSING (one line on where in the docs tree it belongs).

c) Browserless tests: does browserless-test cover it? OK / PARTIAL / MISSING / N/A (not testable that way); for PARTIAL/MISSING name the test and module that would be needed.

d) Javadoc: for every change to public/protected API read the javadoc at <dev_ref>. From a user's point of view: purpose and usage, params/returns/throws, `@since` on new API, no leaked implementation details. OK / PARTIAL / MISSING with the class/member names and what to fix.

e) TestBench: for new components or user-visible component features, does the TestBench element API (testbench core + the component's vaadin-*-testbench module) support it? OK / PARTIAL / MISSING / N/A.

Write `result.md` with EXACTLY this structure (machine-aggregated: keep the column order, use only OK, PARTIAL, MISSING, N/A):

   # <name> — <VERSION> completeness
   ## Status matrix
   | Change | Type | Javadoc | Docs | TestBench | Browserless tests | Notes |
   |---|---|---|---|---|---|---|
   | <title matching changes.md> | feature | OK | MISSING | N/A | PARTIAL | <short note> |
   ## Details
   One short subsection per non-OK, non-N/A cell: what exactly is missing and a concrete suggestion.
   ## Summary
   Counts by type; per-dimension OK/PARTIAL/MISSING/N/A counts; the 1–3 most important gaps.

Report only what the history and sources show; when unsure whether something is covered, say PARTIAL and why. Final message: one line per file written, the change count by type, and how many candidate entries the new-in-<VERSION> check dropped.
````

### Step 4b — Verify the entries

For `flow`, `flow-components`, `hilla`, `web-components`, and any repo with more than ~30 entries, run a second, cheaper agent per repo after its analysis. Give it the clone, `changes.md`, `dev_ref` and `shipped_ref`, and have it classify every entry:

- `OK` — the Public API symbols exist at `dev_ref` with the stated names and signatures, and the work is absent from `shipped_ref`;
- `MISMATCH` — a symbol exists but differs (fix the line);
- `NOT SHIPPED` — the symbol is missing at `dev_ref` (drop the entry);
- `ALREADY SHIPPED` — the symbol or behavior is already present at `shipped_ref` (drop the entry, or turn it into a "no longer experimental" entry).

Apply the findings to `changes.md` and the `result.md` matrix, titles included (the aggregator keys on them).

## Step 5 — Aggregate into release-audit-$VERSION.html

Generate the report with a python3 script that parses the status matrices of every `repo/*/result.md` (do not hand-aggregate):

- Single self-contained file: inline CSS, no external resources, at most a few lines of vanilla JS for filtering.
- Top: version, generation date, the baseline sentence "Changes compared to what platform $PREV shipped up to <prev_platform_version>", totals by type, per-dimension OK/PARTIAL/MISSING/N/A counts, and an **Attention needed** list of every MISSING cell grouped by dimension, linking to the repo section.
- Table of contents, then one section per repo: its refs and kept-commit count, the status matrix with color-coded badges (OK green, PARTIAL amber, MISSING red, N/A gray), and the Details in a collapsed `<details>`.
- One line at the bottom listing the repos without changes, and one listing `unresolved` products.

When running as the Slack bot, copy the file to `~/.claude/outbox/` so it is attached to the thread.

## Step 6 — Report

Short summary: the version and baseline, repos scanned, totals by type, the biggest gaps from Attention needed, how many already-shipped commits and entries were filtered out, any unresolved products or failed repos, and where the HTML is.
