#!/usr/bin/env bash
#
# Bump spring.boot.version to its latest patch across Vaadin repos and their
# maintained branches, then report the pull requests it opened.
#
# By default the bump runs in GitHub Actions (see
# .github/workflows/bump-spring-boot.yml), so the credential that can write to
# four repos stays a repo secret and never has to exist on a laptop. This
# script dispatches that workflow, follows it, and reports.
#
# With --local it does the same work here instead, cloning each repo to a
# temporary directory. Your own checkouts are never touched. Local runs push
# and open PRs with your own gh credentials, so they need no repo secret and no
# 'workflow' scope.
#
# Usage:
#   ./scripts/dispatch-spring-boot-bump.sh
#   ./scripts/dispatch-spring-boot-bump.sh --local
#   ./scripts/dispatch-spring-boot-bump.sh --repos flow,hilla --branches 25.1
#   ./scripts/dispatch-spring-boot-bump.sh --local --dry-run
#   ./scripts/dispatch-spring-boot-bump.sh --json
#
# Options:
#   --repos a,b      repos under vaadin/ (default: platform,flow,hilla,copilot-internal)
#   --branches x,y   branches to target  (default: main,25.2,25.1)
#   --local          run the bump here instead of dispatching to Actions
#   --dry-run        resolve versions and report only; no branches, no PRs
#   --no-follow      dispatch and exit without waiting (ignored with --local)
#   --json           emit the results as JSON instead of a table
#
# See scripts/bump-spring-boot/README.md for the full picture.

set -euo pipefail

WORKFLOW='bump-spring-boot.yml'
CONTROL_REPO='vaadin/platform'
DEFAULT_REPOS='platform,flow,hilla,copilot-internal'
DEFAULT_BRANCHES='main,25.2,25.1'

repos="$DEFAULT_REPOS"
branches="$DEFAULT_BRANCHES"
dry_run=false
local_mode=false
follow=true
as_json=false

usage() {
    # Print the header comment block, stopping at the first line of code so the
    # help text can't drift out of sync with the range.
    awk 'NR > 2 { if (/^#/) { sub(/^# ?/, ""); print } else { exit } }' "$0"
    exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --repos)    repos="${2:?--repos needs a value}"; shift 2 ;;
        --branches) branches="${2:?--branches needs a value}"; shift 2 ;;
        --dry-run)  dry_run=true; shift ;;
        --local)    local_mode=true; shift ;;
        --no-follow) follow=false; shift ;;
        --json)     as_json=true; shift ;;
        -h|--help)  usage 0 ;;
        *) echo "error: unknown option $1" >&2; usage 1 ;;
    esac
done

split_csv() { tr ',' '\n' <<<"$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' || true; }

mapfile -t repo_list < <(split_csv "$repos")
mapfile -t branch_list < <(split_csv "$branches")

[[ ${#repo_list[@]} -gt 0 ]]   || { echo "error: --repos resolved to nothing" >&2; exit 1; }
[[ ${#branch_list[@]} -gt 0 ]] || { echo "error: --branches resolved to nothing" >&2; exit 1; }

# ---------------------------------------------------------------- preflight --

command -v gh >/dev/null 2>&1 || { echo "error: gh CLI not found. See https://cli.github.com/" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "error: jq not found." >&2; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
    echo "error: gh is not authenticated. Run \`gh auth login\`." >&2
    exit 1
fi

# Dispatching a workflow needs the `workflow` scope; a plain `repo` token gets
# an opaque 403 at dispatch time, so say so up front. --local dispatches
# nothing, so `repo` alone is enough there.
if ! $local_mode && ! gh auth status 2>&1 | grep -q 'workflow'; then
    echo "warning: your gh token may lack the 'workflow' scope, which is required to dispatch." >&2
    echo "         run \`gh auth refresh -h github.com -s workflow\`, or use --local." >&2
fi

# ------------------------------------------------- supported-branch checking --

# Verify each repo/branch really exists and really declares the property,
# rather than dispatching cells that are guaranteed to fail.
#
# Note: `repos/<r>/branches?per_page=100` silently omits `main` for
# platform/flow/hilla -- they have more than 100 branches and main lands on a
# later page. Query the single-branch endpoint instead of listing and filtering.
echo "Checking targets..."
valid_repos=()
valid_branches=()
valid_cells=()
skipped=()

for repo in "${repo_list[@]}"; do
    repo_has_branch=false
    for branch in "${branch_list[@]}"; do
        label="$repo [$branch]"

        if ! gh api "repos/vaadin/$repo/branches/$branch" --silent >/dev/null 2>&1; then
            skipped+=("$label — branch does not exist")
            continue
        fi

        pom=$(gh api "repos/vaadin/$repo/contents/pom.xml?ref=$branch" -q '.content' 2>/dev/null | base64 -d 2>/dev/null || true)
        if [[ -z "$pom" ]]; then
            skipped+=("$label — no root pom.xml")
            continue
        fi

        current=$(grep -oE '<spring\.boot\.version>[^<]+' <<<"$pom" | head -1 | sed 's/.*>//' || true)
        if [[ -z "$current" ]]; then
            skipped+=("$label — root pom.xml declares no spring.boot.version")
            continue
        fi

        printf '  %-18s %-6s currently %s\n' "$repo" "$branch" "$current"
        repo_has_branch=true
        # Local mode runs exactly these pairs. The dispatch path can't use them
        # -- the workflow takes two CSV lists and forms its own cross product,
        # re-checking each cell itself.
        valid_cells+=("$repo	$branch")
        # Only branches that are valid *somewhere* are worth dispatching; the
        # workflow re-checks per cell and reports its own skips.
        if ! printf '%s\n' "${valid_branches[@]:-}" | grep -qxF "$branch"; then
            valid_branches+=("$branch")
        fi
    done
    $repo_has_branch && valid_repos+=("$repo")
done

if [[ ${#skipped[@]} -gt 0 ]]; then
    echo
    echo "Skipping ${#skipped[@]} target(s):"
    printf '  %s\n' "${skipped[@]}"
fi

if [[ ${#valid_repos[@]} -eq 0 || ${#valid_branches[@]} -eq 0 ]]; then
    echo
    echo "Nothing to do — no target had a bumpable spring.boot.version."
    exit 0
fi

send_repos=$(IFS=,; echo "${valid_repos[*]}")
send_branches=$(IFS=,; echo "${valid_branches[*]}")

# ------------------------------------------------------------------ report --

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Renders the per-target table and, more importantly, the collection of pull
# requests. Shared by both the CI and the local path so the two report
# identically; both read the same structured result.json files rather than
# scraping log text.
render_report() {
    local results="$1" where="$2"
    local count uptodate errors pr_count created updated

    count=$(jq 'length' <<<"$results")

    if $as_json; then
        jq --arg where "$where" '{source: $where, results: .}' <<<"$results"
        return
    fi

    echo
    printf '%-18s %-7s %s\n' 'repo' 'branch' 'result'
    jq -r '.[] |
        [ .repo, .branch,
          ( if .status == "up-to-date" then "up to date (" + (.from // "?") + ")"
            elif .status == "error"   then "ERROR: " + ((.error // "unknown") | gsub("[[:space:]]+"; " "))
            else (.from // "?") + " -> " + (.to // "?") + "  " + .status
            end )
        ] | @tsv' <<<"$results" |
        while IFS=$'\t' read -r r b s; do printf '%-18s %-7s %s\n' "$r" "$b" "$s"; done

    echo
    pr_count=$(jq '[.[] | select(.pr != null)] | length' <<<"$results")
    if [[ "$pr_count" -eq 0 ]]; then
        if $dry_run; then
            echo "Dry run — no pull requests were created."
        else
            echo "No pull requests were created or updated; every target was already up to date."
        fi
    else
        created=$(jq '[.[] | select(.status == "created")] | length' <<<"$results")
        updated=$(jq '[.[] | select(.status == "updated")] | length' <<<"$results")
        echo "Pull requests ($created created, $updated updated):"
        jq -r '.[] | select(.pr != null) |
            [ .repo, .branch, (.from + " -> " + .to), .pr.url ] | @tsv' <<<"$results" |
            while IFS=$'\t' read -r r b v u; do printf '  %-18s %-7s %-18s %s\n' "$r" "$b" "$v" "$u"; done
    fi

    uptodate=$(jq '[.[] | select(.status == "up-to-date")] | length' <<<"$results")
    errors=$(jq '[.[] | select(.status == "error")] | length' <<<"$results")
    echo
    echo "$uptodate of $count target(s) already up to date. $where"
    [[ "$errors" -gt 0 ]] && echo "$errors target(s) failed."
    return 0
}

collect_results() {
    find "$1" -name 'result-*.json' -o -name 'result.json' | sort |
        xargs cat 2>/dev/null | jq -s 'sort_by(.repo, .branch)'
}

# ------------------------------------------------------------- local runner --

if $local_mode; then
    # Everything the workflow does, on this machine. The bump script itself is
    # unchanged -- it is pointed at a throwaway clone instead of a CI one, which
    # is what keeps your own checkouts untouched: it creates branches, rewrites
    # git identity and commits in whatever directory it is given.
    bump_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/bump-spring-boot" && pwd)"

    command -v node >/dev/null 2>&1 || { echo "error: node not found (needs >=24)." >&2; exit 1; }
    [[ -d "$bump_dir/node_modules" ]] || {
        echo "Installing bump-spring-boot dependencies..."
        (cd "$bump_dir" && npm install --ignore-scripts --no-audit --no-fund >/dev/null)
    }

    # Clone over HTTPS with the gh token so pushes work without depending on an
    # SSH key, matching how CI does it.
    token=$(gh auth token 2>/dev/null || true)
    [[ -n "$token" ]] || { echo "error: could not read a token from \`gh auth token\`." >&2; exit 1; }

    echo
    $dry_run && echo "Running locally (dry run)." || echo "Running locally."

    for repo in "${valid_repos[@]}"; do
        clone="$tmp/$repo"
        printf 'cloning vaadin/%s ... ' "$repo"
        # One clone per repo, reused across its branches: each cell branches
        # from origin/<base> anyway, so re-cloning per branch is pure waste.
        # blob:none keeps it to metadata plus the few files actually read.
        if git clone --quiet --no-single-branch --filter=blob:none \
            "https://x-access-token:$token@github.com/vaadin/$repo.git" "$clone" 2>/dev/null; then
            echo "ok"
        else
            echo "FAILED"
            for cell in "${valid_cells[@]}"; do
                IFS=$'\t' read -r cell_repo cell_branch <<<"$cell"
                [[ "$cell_repo" == "$repo" ]] || continue
                jq -n --arg r "$repo" --arg b "$cell_branch" \
                    '{repo: $r, branch: $b, status: "error", from: null, to: null, pr: null,
                      error: "could not clone vaadin/\($r)"}' \
                    > "$tmp/result-$repo-$cell_branch.json"
            done
            continue
        fi

        for cell in "${valid_cells[@]}"; do
            IFS=$'\t' read -r cell_repo cell_branch <<<"$cell"
            [[ "$cell_repo" == "$repo" ]] || continue

            # The bump script writes its own result file, including on failure,
            # so a thrown cell still reaches the report. `|| true` keeps one bad
            # cell from aborting the rest -- same intent as fail-fast: false.
            # `npx --no` uses the locally installed tsx or fails, rather than
            # silently fetching its own copy (which resolves this package's
            # module type differently and breaks).
            ( cd "$bump_dir" && GH_TOKEN="$token" npx --no tsx src/index.ts \
                --repo "$repo" \
                --branch "$cell_branch" \
                --repo-dir "$clone" \
                --result-file "$tmp/result-$repo-$cell_branch.json" \
                $($dry_run && echo --dry-run) ) || true
        done
    done

    results=$(collect_results "$tmp")
    if [[ $(jq 'length' <<<"$results") -eq 0 ]]; then
        echo "error: no results were produced." >&2
        exit 1
    fi

    render_report "$results" "Ran locally; your working checkouts were not touched."
    [[ $(jq '[.[] | select(.status == "error")] | length' <<<"$results") -eq 0 ]]
    exit $?
fi

# ------------------------------------------------------- dispatch to Actions --

echo
if $dry_run; then
    echo "Dispatching dry run: repos=$send_repos branches=$send_branches"
else
    echo "Dispatching: repos=$send_repos branches=$send_branches"
fi

# `gh workflow run` does not return the run id, so note the newest existing run
# first and then wait for one that is newer than it.
previous_id=$(gh run list -R "$CONTROL_REPO" --workflow "$WORKFLOW" --limit 1 --json databaseId -q '.[0].databaseId // 0')

gh workflow run "$WORKFLOW" \
    -R "$CONTROL_REPO" \
    --ref main \
    -f "repos=$send_repos" \
    -f "branches=$send_branches" \
    -f "dry_run=$($dry_run && echo true || echo false)"

run_id=''
for _ in $(seq 1 30); do
    sleep 2
    run_id=$(gh run list -R "$CONTROL_REPO" --workflow "$WORKFLOW" --limit 1 --json databaseId \
        -q "[.[] | select(.databaseId > $previous_id) | .databaseId] | first // empty")
    [[ -n "$run_id" ]] && break
done

if [[ -z "$run_id" ]]; then
    echo "error: dispatched, but no new run appeared within 60s." >&2
    echo "       check https://github.com/$CONTROL_REPO/actions/workflows/$WORKFLOW" >&2
    exit 1
fi

run_url="https://github.com/$CONTROL_REPO/actions/runs/$run_id"
echo "Run: $run_url"

if ! $follow; then
    echo
    echo "Not following (--no-follow). Open the run above to see results."
    exit 0
fi

echo
echo "Waiting for the run to finish..."
# `gh run watch` exits non-zero when the run concludes in failure. A failed
# cell is expected output here, not a reason to abort before reporting, so the
# status is read back from the run itself instead.
gh run watch "$run_id" -R "$CONTROL_REPO" --exit-status >/dev/null 2>&1 || true

conclusion=$(gh run view "$run_id" -R "$CONTROL_REPO" --json conclusion -q '.conclusion')

if ! gh run download "$run_id" -R "$CONTROL_REPO" --pattern 'result-*' --dir "$tmp" >/dev/null 2>&1; then
    echo "error: could not download result artifacts from $run_url" >&2
    echo "       the run concluded '$conclusion'; check the log for details." >&2
    exit 1
fi

results=$(collect_results "$tmp")
if [[ $(jq 'length' <<<"$results") -eq 0 ]]; then
    echo "error: the run produced no results. See $run_url" >&2
    exit 1
fi

render_report "$results" "Run: $run_url"

# Only genuine failures are non-zero; "already up to date" is a success.
[[ $(jq '[.[] | select(.status == "error")] | length' <<<"$results") -eq 0 ]]
