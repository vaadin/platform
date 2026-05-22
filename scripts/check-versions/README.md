# check-versions

A Node.js + TypeScript utility that scans the platform's [`versions.json`](../../versions.json)
and reports — or applies — the latest **maintenance** (patch-level) release
available for each module from upstream registries:

| Module field | Registry | URL pattern |
| --- | --- | --- |
| `javaVersion` | Maven Central | `https://repo.maven.apache.org/maven2/com/vaadin/<artifactId>/maven-metadata.xml` |
| `javaVersion` | Vaadin prereleases Nexus | `https://tools.vaadin.com/nexus/content/repositories/vaadin-prereleases/com/vaadin/<artifactId>/maven-metadata.xml` |
| `jsVersion` + `npmName` | npm registry | `https://registry.npmjs.org/<npmName>` |

Minor and major bumps are intentionally **not** applied — those need human
review. The script's job is to keep the patch level current, nothing more.

## Why this exists

Before this script:

- [`scripts/updateVersions.py`](../updateVersions.py) could write a known
  version into `versions.json`, but it required a caller to already know
  the target version.
- [`scripts/validateVersions.js`](../validateVersions.js) validates that
  the resulting npm tree resolves without duplicates, but doesn't look up
  new releases.

Neither of those answers the recurring question "is anything in
`versions.json` lagging its upstream patch line?" — which is what this
script does, in one read-only pass per module, with an optional in-place
write.

---

## Requirements

- **Node.js ≥ 24** (uses the built-in `fetch`, `node:test` runner, and
  `node:util.parseArgs`).

## Quick start

```bash
cd scripts/check-versions
npm install

# Preview what would change (no file edits):
npx tsx src/index.ts --dry-run

# Apply maintenance updates to ../../versions.json in place:
npx tsx src/index.ts
```

Or via the package scripts:

```bash
npm start              # apply
npm run check          # alias for --dry-run
npm test               # picker unit tests
```

---

## How it works

```
┌─────────────────────┐
│   versions.json     │  read once
└──────────┬──────────┘
           │
           │  iterateModules() yields every (section, name, module)
           ▼
┌──────────────────────────────────────────────────────────────┐
│  For each module:                                            │
│                                                              │
│   javaVersion?              jsVersion + npmName?             │
│       │                          │                           │
│       ▼                          ▼                           │
│  ┌─────────────┐           ┌─────────────┐                  │
│  │  maven.ts   │           │   npm.ts    │   8 in parallel  │
│  │             │           │             │                  │
│  │ fetch BOTH  │           │  GET        │                  │
│  │ Central +   │           │  registry   │                  │
│  │ prereleases │           │  .npmjs.org │                  │
│  └──────┬──────┘           └──────┬──────┘                  │
│         └────────────┬────────────┘                          │
│                      ▼                                       │
│              ┌───────────────┐                              │
│              │   semver.ts   │                              │
│              │ pickMaintenance(current, candidates)         │
│              └───────┬───────┘                              │
│                      ▼                                       │
│              update / up-to-date / skip-* / warn / error    │
└──────────────────────────────────────────────────────────────┘
           │
           │ if any update and not --dry-run
           ▼
┌─────────────────────┐
│   versions.json     │  written with 4-space indent,
│   (mutated)         │  sorted keys, trailing newline
└─────────────────────┘  (matches scripts/updateVersions.py)
```

### Update rules

- **Stable current** (e.g. `16.0.1`): pick the highest stable patch in
  the same `major.minor`. Never bump `major` or `minor`.
  - `16.0.1` + candidates `[16.0.2, 16.1.0, 17.0.0]` → `16.0.2`
- **Prerelease current** (e.g. `25.2.0-alpha12`):
  1. If a stable `25.2.x` exists, take the highest stable patch — `Z` may
     bump (e.g. `25.2.0-alpha12` → `25.2.1`).
  2. Otherwise take the highest prerelease for the exact same `X.Y.Z`
     base, with `alpha < beta < rc` (e.g. `alpha12` → `alpha13` or
     `beta1`).
  3. Otherwise no update.
- **Snapshots** (value is `{{version}}` or ends with `-SNAPSHOT`) are
  left untouched and logged as `skip-snap`.

### Stability invariant

After the maintenance picker runs, the script checks one more cross-cutting
rule on the resulting `versions.json`: every module's stability tier must
meet the floor established by the platform anchors.

- **Anchors:** `flow`, `hilla`, `copilot`.
- **Tier ordering:** `alpha < beta < rc < stable`.
- **Floor:** the *weakest* tier among the anchors present in `versions.json`
  on that branch (e.g. on `24.10` all three are stable → floor = `stable`;
  on `main` all three are alpha → floor = `alpha`).
- **Rule:** every other module's tier must be `>=` the floor. Snapshots and
  unparseable values are skipped.

A violation is reported as `stability-warn` in the per-module output. The
exit code is **not** changed — a violation is a warning, not an error, and
the PR still opens/updates so the bot's valid bumps aren't held up. The
warning is surfaced in two more places when `--create-pr` is set:

1. **PR body:** a `## Stability check warnings` section is prepended above
   the updates list, so the reviewer sees it first.
2. **Sticky PR comment:** a single comment identified by a hidden
   `<!-- check-versions:stability-v1 -->` marker. The comment is edited in
   place on subsequent runs (no duplicates) and deleted once the situation
   resolves, so the PR timeline stays clean.
3. **Stability-only PR:** if there are no maintenance version bumps to make
   *and* no PR already exists on the base branch, the script opens a PR
   anyway — with an empty commit — so the warning has a place to live. This
   is the only case in which the bot creates a PR without a `versions.json`
   diff. The PR can be closed once the underlying modules are bumped (or
   once the warning is acknowledged as expected).

This catches the case where a maintenance release is about to ship with a
prerelease module — e.g. `vaadin-spring-bom-24.10.6` going out with
`mpr.v8.version=7.1.0-alpha1` while flow/hilla/copilot were all on stable
`24.10.x`.

> ⚠️ **Vaadin's prerelease format quirk.** Vaadin uses non-dotted
> identifiers like `alpha12`, which the standard semver spec compares
> **lexically** — meaning `alpha12 < alpha9`. This script applies a
> custom comparator that splits the suffix into `(label, integer)` and
> orders by label (alpha < beta < rc) then by the integer.
> Without this fix, every `25.2.0-alpha12` entry would be "downgraded"
> to `alpha9` on each run.

---

## CLI reference

```
npx tsx src/index.ts [flags]
```

| Flag | Effect |
| --- | --- |
| `--dry-run` | Don't write `versions.json`; just report. |
| `--check` | Implies `--dry-run`. Exits 2 if updates are pending — useful for CI. |
| `--only <section>` | Restrict to one top-level section (`core`, `vaadin`, `kits`, `react`). Repeatable. |
| `--module <name>` | Restrict to a specific module key. Repeatable. |
| `--artifact-id <key>=<artifactId>` | Override the Maven `artifactId` for one module. Wins over `src/artifact-overrides.ts`. Repeatable. |
| `--skip <key>` | Force-skip a module entirely (same effect as `"skip"` in the override map). Repeatable. |
| `--skip-version <key>=<version>` | Filter one specific upstream version out of the candidate pool for one module (e.g. a known-bad RC). Repeatable. Augments `VERSION_BLOCKLIST` in `src/artifact-overrides.ts`. |
| `--create-pr` | After writing `versions.json`, create a branch, commit the diff, push to `origin`, and open (or update an existing) PR via `gh`. See [Creating a PR](#creating-a-pr) below. Cannot be combined with `--dry-run` / `--check`. |
| `--base <branch>` | Target branch for the PR. Default `main`. When `--create-pr` is set, `versions.json` is read from `origin/<branch>` (not the local working tree), so the proposed diff is always against the live tip of the target. |
| `--verbose` | Print resolved artifact IDs and per-repo hit counts on stderr. |

### Exit codes

| Code | Meaning |
| --- | --- |
| `0` | Clean run; no warnings or errors. |
| `1` | At least one `error` (transient HTTP) or `warn-not-found` (artifact missing on all upstreams). |
| `2` | `--check` mode found pending maintenance updates. |

### Examples

```bash
# What would change across the whole file?
npx tsx src/index.ts --dry-run

# Just inspect the kits section
npx tsx src/index.ts --dry-run --only kits

# Look at a couple of modules with full URLs printed
npx tsx src/index.ts --dry-run --verbose --module copilot --module flow

# Try a hypothetical artifactId without editing TS
npx tsx src/index.ts --dry-run --module my-thing --artifact-id my-thing=vaadin-my-thing

# CI step that fails if anything is stale
npx tsx src/index.ts --check

# Avoid one known-bad upstream release for one module
npx tsx src/index.ts --dry-run --skip-version kubernetes-kit-starter=25.1.0-rc1

# Apply updates AND open a GitHub PR with the diff
npx tsx src/index.ts --create-pr

# Target a release branch instead of main
npx tsx src/index.ts --create-pr --base 24.8
```

---

## Output tags

Every per-module line uses one tag in the first column, followed by
`<section>/<name>` and a detail string.

| Tag | Meaning |
| --- | --- |
| `up-to-date` | No in-scope upgrade exists. |
| `update` | A maintenance upgrade is available (or has been applied). |
| `skip-snap` | Current value is `{{version}}` or ends with `-SNAPSHOT`. |
| `skip-major` | Newer release exists but is a minor/major bump (out of scope). |
| `skip-listed` | Module is in `SKIP_MODULES` (or `--skip` was passed). Both Maven and npm checks bypassed. |
| `skip-private` | `src/artifact-overrides.ts` marks the module as `"skip"` (legacy alias for `SKIP_MODULES`). |
| `warn-not-found` | The artifactId/npmName isn't published — almost certainly a wrong mapping. Treated as a warning that flips exit code to 1. |
| `error` | Transient HTTP error from Maven/npm. Treated as an error that flips exit code to 1. |
| `stability-warn` | The module's stability tier (alpha/beta/rc) is below the floor set by the `flow`/`hilla`/`copilot` anchors. Surfaced in the PR body and as a sticky PR comment. Does **not** change the exit code. See [Stability invariant](#stability-invariant). |

The run ends with a one-line summary, e.g.

```
Summary: 90 up-to-date, 1 updated, 7 snapshot, 0 skip-listed, 0 private, 0 not-found, 0 errors, 0 stability-warn
```

---

## Skipping a module entirely

Sometimes a module must be pinned and **must not** auto-bump, even within
its maintenance line. Common reasons: ongoing bug investigation, a
downstream compatibility constraint, deliberate hold for the current
platform release, or the artifact lives behind a private repo we can't
hit.

The single source of truth is the `SKIP_MODULES` set in
[`src/artifact-overrides.ts`](src/artifact-overrides.ts):

```ts
export const SKIP_MODULES: ReadonlySet<string> = new Set<string>([
    "vaadin-quarkus",   // pinned to 3.1.1 until quarkus 4.x upgrade lands
    "flow-cdi",         // held back, see PLAT-1234
]);
```

A module listed here is reported as `skip-listed` and **both** its
Maven and npm checks are bypassed — `javaVersion` and `jsVersion` are
left untouched in `versions.json`.

**Ad-hoc / one-off:** the `--skip <moduleKey>` CLI flag does the same
thing for a single run, repeatable for multiple modules:

```bash
npx tsx src/index.ts --dry-run --skip vaadin-quarkus --skip flow-cdi
```

**Why this is separate from `ARTIFACT_ID_OVERRIDES`:** the two concerns
are different. The override map fixes *name mismatches* (key ≠
artifactId). The skip list freezes *what we check at all*. Keeping them
separate keeps the override map's purpose obvious and makes the skip
list easy to scan and review.

> The `"skip"` sentinel value in `ARTIFACT_ID_OVERRIDES` is a deprecated
> back-compat alias that produces a `skip-private` log line. New entries
> should go in `SKIP_MODULES` instead.

---

## Skipping a specific upstream version

Sometimes the module is fine but one **published version** is known-bad —
a withdrawn release, a broken RC, a version with a regression you can't
ship. You want the script to keep checking that module, just not propose
*that one* version.

The source of truth is `VERSION_BLOCKLIST` in
[`src/artifact-overrides.ts`](src/artifact-overrides.ts):

```ts
export const VERSION_BLOCKLIST: Record<string, readonly string[]> = {
    "kubernetes-kit-starter": ["25.1.0-rc1"],   // known-bad RC, skip
    "flow":                   ["25.2.0-alpha9"], // withdrawn release
};
```

Each blocklisted version is filtered out of the candidate list *before*
the maintenance picker runs — the picker behaves as if that version had
never been published. The module otherwise checks normally; other
versions in its release line still apply.

When at least one version is filtered for a module, the log line gets a
visible suffix:

```
up-to-date    core/browserless-test    javaVersion=1.1.0-alpha1 [blocklist: 1.1.0-alpha2]
```

**Ad-hoc / one-off:** `--skip-version <moduleKey>=<version>` does the
same thing for a single run, repeatable:

```bash
npx tsx src/index.ts --dry-run \
    --skip-version kubernetes-kit-starter=25.1.0-rc1 \
    --skip-version kubernetes-kit-starter=25.1.0-rc2
```

**When to use which list:**

| Need | Use |
| --- | --- |
| Module must never auto-update | `SKIP_MODULES` |
| Module updates normally, except *one specific upstream version* is off-limits | `VERSION_BLOCKLIST` |
| Module's Maven `artifactId` doesn't match its versions.json key | `ARTIFACT_ID_OVERRIDES` |

---

## Creating a PR

`--create-pr` automates the full hand-off after a successful run:

```bash
npx tsx src/index.ts --create-pr
npx tsx src/index.ts --create-pr --base 24.8     # target a release branch
```

What it does, in order:

1. **Pre-flight (before touching anything):**
   - Working tree must be clean (`git status --porcelain` empty). Refuses to run otherwise.
   - `gh` must be installed and authenticated (`gh auth status` must succeed).
   - `git fetch origin <base>` — the script always reads `versions.json` from `origin/<base>`, so the proposed diff is against the live tip of the target branch (not whatever you have checked out locally).
2. Run the normal version check.
3. If at least one module updated:
   - **Check for an existing open PR** targeting `<base>` whose title starts with `chore: maintenance version bumps`. If found → **update path**; otherwise → **create path**.
   - **Update path** (idempotent):
     - Reset that PR's branch hard to `origin/<base>` so the new commit is the only one on the branch.
     - Write the new `versions.json`, commit, `git push --force-with-lease`, and `gh pr edit` to refresh the title + body.
     - The PR always shows a single current delta against base — no commit history pile-up across daily runs.
   - **Create path**:
     - New branch `bot/versions-<YYYY-MM-DD>` (or `bot/versions-<base>-<YYYY-MM-DD>` when targeting a non-main branch), created off `origin/<base>`. If that name already exists locally or on `origin`, appends `-2`, `-3`, etc.
     - `git add versions.json && git commit` with a title like `chore: maintenance version bumps (2026-05-18)` (suffixed with ` [<base>]` when not main).
     - `git push -u origin <branch>` and `gh pr create --base <base>`.
   - Prints the resulting PR URL.

Behavior notes:

- **Idempotent across daily runs.** Run it every workday on the same base; you'll always end up with at most one open PR per base, kept current.
- **Cannot be combined with `--dry-run` / `--check`** — the script errors at argument parsing.
- **Refuses to PR if errors or warnings remain** (`error` or `warn-not-found` lines bump exit code to 1; the PR step is skipped). Fix mappings first.
- **No updates → no PR**, *unless* the stability invariant is violated. If everything is up-to-date and no stability warning fires, the script prints `No updates — nothing to PR.` and exits 0; an existing PR is not touched. If a stability warning *does* fire and no PR is open, the script opens a stability-only PR with an empty commit so the warning has a home (see [Stability invariant](#stability-invariant)). If an existing PR is open, its sticky stability comment is refreshed (or removed when warnings clear) but its `versions.json` commit is left untouched.
- **Leaves you on the bot branch** after success. `git checkout <previous-branch>` when done.
- **Force-push uses `--force-with-lease`** so a manual edit on the PR branch by a reviewer will block the script rather than overwrite silently.

Requirements:

- `gh` CLI ([install](https://cli.github.com/)) authenticated against this repo's GitHub host.
- Push access to `origin`.

---

## Scheduled GitHub Actions workflow

This script is wired up to run automatically on a schedule via
[`.github/workflows/check-versions.yml`](../../.github/workflows/check-versions.yml):

- **Schedule:** Mon–Fri at **08:00 UTC** (`cron: '0 8 * * 1-5'`). GitHub Actions cron is UTC-only; edit the hour to anchor to a different local time.
- **Maintained-branch matrix:** scheduled runs fan out across every maintained branch in parallel — currently `main`, `25.2`, `25.1`, `24.10`, `24.9`, `23.7`, `23.6`, `14.14`. Each branch gets its own rolling PR. `fail-fast: false` so one branch failing doesn't cancel the others. The list lives in the `resolve-matrix` job in [`check-versions.yml`](../../.github/workflows/check-versions.yml) — update it there when adding or dropping a maintained branch.
- **Manual runs:** the workflow exposes a `workflow_dispatch` trigger with an optional `base` input. Leave it **blank** to fire a full matrix run on demand, or set it to a single branch to target just that one:

  ```bash
  # Full matrix, on demand
  gh workflow run check-versions.yml

  # Just one branch
  gh workflow run check-versions.yml -f base=24.10
  ```

- **Per-base concurrency:** the job uses `concurrency.group: check-versions-${{ matrix.base }}` so two runs targeting the same base serialize (no PR-update race), while different bases proceed in parallel.
- **Permissions:** `contents: write` + `pull-requests: write` granted to the job's `GITHUB_TOKEN`. No additional secrets needed.
- **Git identity:** commits as `github-actions[bot]`.
- **Behavior:** each matrix entry is identical to `npx tsx src/index.ts --create-pr --base <entry>` — the workflow just provides the schedule, identity, and fan-out.

Because the script is idempotent (see [Creating a PR](#creating-a-pr)), repeated runs maintain a single rolling PR per base branch rather than producing a new PR each weekday.

> **Where the workflow file lives matters.** GitHub Actions only honors `.github/workflows/check-versions.yml` from the **default branch (`main`)** — that's the copy used for every scheduled tick and every `workflow_dispatch`, even when the matrix targets a release branch. Any older copy of this workflow on a maintained release branch (e.g. 24.10) is ignored. The same goes for the script itself: the runner checks out `main`, then `scripts/check-versions/` runs from main and reads `versions.json` from `origin/<base>` over the network. So **changes to the workflow or the script only take effect after they're merged to `main`** — pushing them to a release branch alone won't change scheduled behavior.

---

## Maven artifactId overrides

Some `versions.json` keys don't match their Maven `artifactId`. The
single source of truth for these is [`src/artifact-overrides.ts`](src/artifact-overrides.ts):

```ts
export const ARTIFACT_ID_OVERRIDES: Record<string, string | "skip"> = {
    "flow-cdi": "vaadin-cdi",
    "vaadin-license-checker": "license-checker",
    "vaadin-collaboration-engine": "collaboration-engine",
    "swing-kit": "vaadin-swing-kit-flow",
    "vaadin-feature-pack": "vaadin-feature-pack-flow",
};
```

**Adding a new override:**

1. Run the script — if a module's artifactId is wrong, you'll see
   `warn-not-found  <section>/<key>  Maven: 404 on both repos for "<key>"`.
2. Find the correct artifactId on Maven Central
   (`https://repo.maven.apache.org/maven2/com/vaadin/<artifactId>/`).
3. Add an entry to the map above and re-run.

**Sentinel value `"skip"`** marks a module as deliberately not checked
(e.g., a commercial-only artifact hosted on a private repo). It produces
`skip-private` output and does not attempt any lookup.

**Ad-hoc overrides without code edits:** the `--artifact-id key=value`
and `--skip key` CLI flags do the same thing per run.

---

## Adding new modules

You don't normally need to do anything when a new entry lands in
`versions.json`. The script auto-discovers everything with a
`javaVersion` and/or `jsVersion`+`npmName`. Just run `--dry-run` after
adding the module and one of these will happen:

| Outcome | What it means |
| --- | --- |
| `up-to-date` / `update` | The default `com/vaadin/<module-key>` path works. Nothing to do. |
| `warn-not-found` | Add an override to `src/artifact-overrides.ts` — the artifactId doesn't match the module key. |
| `error` | Transient — retry. |

---

## File preservation

The writer matches [`scripts/updateVersions.py`](../updateVersions.py)
exactly:

- 4-space indent
- Keys sorted alphabetically (`sort_keys=True`)
- Trailing newline at EOF
- All non-version fields (`mode`, `npmName`, `pro`, `releasenotes`,
  `exclusions`, etc.) are preserved untouched.

This is on purpose: a normal run that touches only the `javaVersion` /
`jsVersion` fields produces a minimal `git diff` (just the version
strings).

---

## Project layout

```
scripts/check-versions/
├── package.json              # Node ≥24, type=module, deps: semver, fast-xml-parser
├── tsconfig.json             # strict, ES2023, NodeNext
├── README.md                 # this file
└── src/
    ├── index.ts              # CLI entry, iteration, logging, summary
    ├── versionsJson.ts       # read/write versions.json (sorted, 4-space, trailing \n)
    ├── semver.ts             # pickMaintenance, custom alphaN comparator, isSnapshotValue
    ├── semver.test.ts        # picker unit tests (node:test)
    ├── stability.ts          # post-update anchor-floor invariant check
    ├── stability.test.ts     # stability check unit tests (node:test)
    ├── maven.ts              # fetch maven-metadata.xml from both repos
    ├── npm.ts                # GET registry.npmjs.org/<pkg>
    ├── git.ts                # --create-pr support: pre-flight, branch, commit, push, gh pr create, sticky stability comment
    └── artifact-overrides.ts # editable: ARTIFACT_ID_OVERRIDES + SKIP_MODULES + VERSION_BLOCKLIST
```

The script is self-contained — it has its own `package.json` and
`node_modules`, mirroring the pattern already used by
`scripts/generator/`. No root-level changes.

---

## Testing

```bash
npm test
```

Runs the test files under `src/*.test.ts` via Node's built-in test
runner — currently [`src/semver.test.ts`](src/semver.test.ts) (maintenance
picker and the `alphaN` numeric ordering fix) and
[`src/stability.test.ts`](src/stability.test.ts) (anchor-floor invariant
across the four stability tiers).

To add a case, append to `semver.test.ts`:

```ts
test("description", () => {
    assert.equal(
        pickMaintenance("current.version", ["candidate1", "candidate2"]),
        "expected-pick",
    );
});
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `warn-not-found Maven: 404 on both repos for "xyz"` | Module key ≠ Maven artifactId. | Add `"xyz": "actual-artifact-id"` to `src/artifact-overrides.ts`. |
| `warn-not-found npm: 404 for "@vaadin/foo"` | Typo in `npmName` in `versions.json`, or the package was unpublished. | Fix `npmName` in `versions.json`. |
| `error  ... HTTP 403` from Maven Central | Maven Central rejects empty / certain User-Agents. | The script sets `User-Agent: vaadin-check-versions/1.0`. If you still see 403s, your proxy is interfering. |
| Script proposes a "downgrade" like `alpha12 → alpha9` | Older build of the script (pre-fix). | Pull latest; the `comparePrerelease` helper in `semver.ts` fixes this. |
| Wrong values for `mode`, `npmName`, `exclusions` after a write | These should never be touched. | If they were, it's a bug — file an issue. The writer should only mutate `javaVersion` / `jsVersion` strings. |
| Script writes `versions.json` even on no real changes | Idempotency bug. | `update` count being 0 means the file is left alone. If you see "Wrote …" with 0 updates, file an issue. |

---

## Related

- [`versions.json`](../../versions.json) — the file this script operates on.
- [`scripts/updateVersions.py`](../updateVersions.py) — writes a single
  known version. Format reference for this script's writer.
- [`scripts/validateVersions.js`](../validateVersions.js) — validates
  the resulting npm dep tree.
- [`.claude/check-versions-plan.md`](../../.claude/check-versions-plan.md) —
  full design plan including verification results and override decisions.
