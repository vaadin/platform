---
name: Extract Notable Changes
description: Extract the notable changes for platform release note. Use when generating the Notable Changes / New and Noteworthy section of a Vaadin platform release note for a given platform version.
argument-hint: [platform-version]
arguments: [version]
allowed-tools: Bash(gh api:*), Bash(gh api graphql:*), WebFetch, WebSearch
---

## Summary
The goal is to generate the Notable Changes section for the platform release note, based on the Vaadin Roadmap project board.

The board is the [Vaadin Roadmap](https://github.com/orgs/vaadin/projects/29) (org project `29`). Each item carries a **Status** single-select field that names its target release (e.g. `December 2025 (25.0)`, `March 2026 (25.1)`, `Under consideration`). The Notable Changes for a given release are the items whose `Status` equals that release.

## Input: platform version

The user provides the platform version as `$version` — for example `25.2`, `25.2.0-beta1`, or `25.2.0`. If it is missing, ask for it.

The board column is identified by the **major.minor** part only, so normalize first:

- Take the leading `MAJOR.MINOR` of `$version` (drop the patch and any `-beta`/`-alpha`/`-rc` suffix): `25.2.0-beta1` → `25.2`, `25.2.0` → `25.2`, `25.2` → `25.2`.
- The matching `Status` value is the one whose name **contains `(MAJOR.MINOR)`** — e.g. `25.2` matches `June 2026 (25.2)`. The date prefix and the exact release date are irrelevant to the match; rely on the parenthesized version.
- If no `Status` value contains `(MAJOR.MINOR)`, stop and report it (the release may not be on the board yet) rather than guessing the closest column.

## Prerequisites: GitHub access token

Reading an **organization** Project (v2) board needs a token with project read access — the default `GITHUB_TOKEN` available in CI only has `repo` + `workflow` scopes and will fail with `INSUFFICIENT_SCOPES`. You must supply your own token.

A token works only if **all** of these hold:

- **Type:** a fine-grained PAT, or a classic PAT with `read:project` (+ `read:org`).
- **Permission:** for a fine-grained PAT, set **Resource owner = `vaadin`** (the "Organization permissions" section only appears once the resource owner is the org), then grant **Organization permissions → Projects: Read-only**. A PAT scoped to a personal account can read the org's metadata but every project node comes back `null`.
- **Lifetime ≤ 366 days.** The `vaadin` org rejects fine-grained PATs whose lifetime exceeds 366 days (`FORBIDDEN ... forbids access via a fine-grained personal access tokens if the token's lifetime is greater than 366 days`).
- **SSO/approval:** if prompted, authorize the token for the `vaadin` org (classic PATs: **Configure SSO → Authorize**; fine-grained PATs may need org-admin approval).

Create one at https://github.com/settings/personal-access-tokens (fine-grained) or https://github.com/settings/tokens (classic).

**Provide the token via an environment variable — never hardcode it in this file or in scripts.**

Prefer exporting **`GH_TOKEN`** into your shell/session environment once (e.g. in your shell profile, or an untracked `settings.local.json` — never a committed file). `gh` uses `GH_TOKEN` in preference to `GITHUB_TOKEN`, so this works even when the harness sets an insufficient `GITHUB_TOKEN`, and it lets every command run as a **plain `gh api …`** call:

```bash
gh api graphql -f query='...'
```

This plain form is what the skill's `allowed-tools` (`Bash(gh api:*)`) pre-approves, so the read-only board/release queries run without permission prompts. If you instead inline the token per command (`GITHUB_TOKEN="" GH_TOKEN="<your-token>" gh api …`), it still works but the leading env-var assignments defeat the `allowed-tools` prefix match, so each call will prompt.

Quick sanity check (should print your login and a non-null project title):

```bash
gh api graphql -f query='
query {
  viewer { login }
  organization(login: "vaadin") {
    projectV2(number: 29) { title }
  }
}'
```

> Security: a token pasted into a chat or terminal history should be **revoked** once you are done.

## Classify items into groups

After collecting the items for the release, classify each one into a group using the **labels** on the issue (case-insensitive match):

- **Flow** — label `Flow` / `flow`
- **Hilla** — label `hilla`
- **Design System** — label `DS`
- **Copilot** — label `copilot`
- **Modernization** — label `modernization-toolkit`

Rules:
- An item may carry several labels; assign it to every group it matches (e.g. an item labelled both `DS` and `Flow` appears under both).
- The label is authoritative; do not infer the group from the issue's repository.
- If an item matches **none** of the groups above, do **not** drop it or guess — **ask the user to confirm** which group it belongs to (or whether to exclude it). Show the item title, its repository, and its current labels so the user can decide. Only after confirmation, place it in the chosen group.

## Steps
1. Check that the access prerequisites are met:
   1. A GitHub token with **Projects: Read-only** on the `vaadin` org is available in `GH_TOKEN` (see *Prerequisites* above), and the sanity-check query returns a non-null `projectV2.title`.
   2. The platform version `$version` is known; normalize it to `MAJOR.MINOR` as described in *Input: platform version*.
2. Fetch the board items with the query in *GraphQL query* below (it requests each item's `Status` field **and** its issue `labels`). As you page through, **keep only the items whose `Status` value contains `(MAJOR.MINOR)`** and discard the rest immediately — all later steps operate solely on this one column. If nothing matches, stop and report that the release column was not found.
3. Classify each item **in that column** into **Flow**, **Hilla**, **Design System**, **Copilot**, or **Modernization** using its labels (see *Classify items into groups*). For any item that matches no group, ask the user to confirm its group before continuing.
4. For each item, read its content (issue `title` and `body`) and write a **user-friendly description of the new feature/enhancement** (see *Writing the descriptions*).
5. Assemble the descriptions into a Markdown file, grouped under their respective headings (Flow / Hilla / Design System / Copilot / Modernization), following *Output format*.
6. For each feature, find its documentation under <https://vaadin.com/docs/next> and add a link (see *Linking to documentation*). Collect every feature with no matching docs page and report that list to the user.
7. **Proof the content against the product release notes** (see *Verifying against product release notes*): for each feature, confirm it is actually listed in the matching product's release notes for `$version`. Report every feature that cannot be confirmed.

## Writing the descriptions

For each item, describe the feature or enhancement in plain, user-facing language:

- **Under 100 words** per item.
- Focus on **what the user can now do and the benefit** — not the implementation, internal ticket details, or how it was built.
- Avoid jargon, issue numbers, and internal team references; write for an application developer reading the release note.
- **Tier labels:** if the item is labelled **`Pro`**, mark it as `(Pro)` in its heading/entry; if labelled **`Preview`**, call out that it is a **Preview** release. Apply both when both labels are present.
- Base it on the issue `title` and `body`. If the body is empty or too sparse to describe confidently, fall back to a concise rephrasing of the title and flag it to the user for review rather than inventing details.

## Linking to documentation

For each feature, look for a matching page in the **pre-release docs** at <https://vaadin.com/docs/next> (the `next` version matches an upcoming release).

- Search the docs for the feature, e.g. a web search scoped with `site:vaadin.com/docs/next <feature keywords>`, and/or browse the relevant section (Components, Styling, Flow/Hilla Reference, Tools, etc.). Pages follow the path pattern `/docs/next/<section>/<subsection>/<page>`.
- **Verify** the candidate page actually documents the feature — open it and confirm it covers the capability, not just a passing mention. Only then add the link to that feature's entry.
- **If no page covers the feature** (or only mentions it in passing), do **not** invent or guess a URL. Leave the entry without a doc link and add the feature to a "not yet documented" list.
- After processing all features, **report the "not yet documented" list to the user** so the docs gap can be followed up.

## Output format

Produce a single **Markdown file** that can be pasted directly into a GitHub release note. Write it to `notable-changes-$version.md` and also show it to the user.

- Use a top-level heading with the version, then one `##` section per group, in this order: **Flow**, **Hilla**, **Design System**, **Copilot**, **Modernization**. Omit a group that has no items.
- Each feature is a single bullet: a short **bold name** (append `(Pro)` when labelled Pro), an em-dash, the under-100-word description (note **Preview** when labelled Preview), and the docs link as `([📖 Docs](url))` when one was found (see *Linking to documentation*).
- **Emoji:** add a tasteful emoji to each `##` group heading and use light emoji to aid skimming (e.g. 📖 for docs, 🆕 for new, 🔬 for Preview). Keep it light — one per heading and the occasional inline marker, not on every word.
- Keep it clean and skimmable: blank line between sections, no internal issue numbers or jargon in the prose, no empty headings.

Example:

```markdown
# Vaadin 25.2 — New and Noteworthy ✨

## ⚙️ Flow

- **Faster production builds** — Production builds no longer require a separate profile, so apps build and deploy with fewer configuration steps. ([📖 Docs](https://vaadin.com/docs/next/flow/...))

## 🎨 Design System

- **AI-powered Charts and Grids (Pro)** — 🔬 *Preview.* Generate charts and grids from your data using AI assistance. ([📖 Docs](https://vaadin.com/docs/next/...))
```

## Verifying against product release notes

As a final proofing pass, confirm every feature is real by checking it against the **product's own release notes**. Each group maps to a release-note source on GitHub:

- **Flow** — <https://github.com/vaadin/flow/releases>
- **Copilot** — <https://github.com/vaadin/copilot-internal/releases> (private repo; the token must be granted access to it, otherwise the API returns `404` — treat that as *release note not available* and tell the user the token needs `copilot-internal` access)
- **Hilla** — <https://github.com/vaadin/hilla/releases>
- **Design System** — <https://github.com/vaadin/web-components/releases> and <https://github.com/vaadin/flow-components/releases>
- **Modernization** — no release-note source; verified by documentation only (see *Linking to documentation*). Skip the release-note check for these items.

Procedure:
- Find the product release(s) corresponding to the platform `$version` (use the GitHub Releases API, e.g. `gh api repos/<owner>/<repo>/releases`). The product's own version may differ from the platform version; match by release date / version family for `MAJOR.MINOR`, and include pre-release notes when `$version` is a `-alpha`/`-beta`/`-rc`.
- For each feature, check that it is actually listed in those release notes — match on the linked issue/PR number when present, otherwise on the feature wording.
- **If the product release note is not available** (e.g. the release is not published yet, or the repo/notes can't be reached), do not treat that as a failure — note it as **"release note not available"** and report it.
- **Every item found on the board still gets a feature description generated** — do not silently drop unverified items. Instead, keep the description, mark the item **unverified**, and **ask the user whether to remove it** from the notable changes (or keep it).
- If the user chooses to **keep** an unverified item, leave it in the output with a visible inline marker — `⚠️ _Unverified against product release notes._` — appended to its entry, so the gap is obvious to whoever publishes the note.
- Report to the user the **unverified** features and the **"release note not available"** cases, so nothing untrue is published without a decision.

A feature may legitimately ship in a **different product** than its label group suggests — commercial/Pro tools especially. For example, the Flow-labelled *Load Testing Tools* is actually released in **TestBench** (`vaadin/testbench`), not Flow. So when a feature is unverified, **report it to the user and ask whether it ships in another product**; if the user names a source (e.g. "it's in testbench 25.2.0-beta1"), re-check that repo's release notes and, if confirmed, treat the feature as verified.

## GraphQL query

We only want the items in the column for `MAJOR.MINOR`, but the ProjectV2 API has **no server-side field filter** — items cannot be queried by `Status` directly. So page through the board (100 per page) and filter client-side, **keeping only matching items and dropping the rest as each page arrives** so you never hold or classify the full board. Run the first page, then repeat with `-F cursor=<endCursor>` while `pageInfo.hasNextPage` is `true`. Make sure `GH_TOKEN` is exported (see *Prerequisites*) so these plain `gh api` calls authenticate and are covered by the skill's `allowed-tools`.

```bash
gh api graphql \
  -F cursor=null \
  -f query='
query($cursor: String) {
  organization(login: "vaadin") {
    projectV2(number: 29) {
      items(first: 100, after: $cursor) {
        pageInfo { hasNextPage endCursor }
        nodes {
          fieldValues(first: 20) {
            nodes {
              ... on ProjectV2ItemFieldSingleSelectValue {
                name
                field { ... on ProjectV2FieldCommon { name } }
              }
            }
          }
          content {
            ... on Issue {
              title
              number
              url
              state
              body
              repository { nameWithOwner }
              labels(first: 20) { nodes { name } }
            }
          }
        }
      }
    }
  }
}'
```

For each node:
- **Status** = the `fieldValues` entry whose `field.name == "Status"`; keep the node only if that value contains `(MAJOR.MINOR)`.
- **Labels** = `content.labels.nodes[].name`, used for classification.
- `content` is `null` for draft items — skip those.