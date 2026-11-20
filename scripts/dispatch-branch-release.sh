#!/usr/bin/env bash
#
# Cut the X.Y maintenance branch from main in every repo on the X.Y train and
# open PRs moving main to X.(Y+1)-SNAPSHOT. Normally this runs by itself when
# platform X.Y.0-beta1 is released (.github/workflows/branch-release.yml); use
# this script to re-run it, narrow it, preview it, or run it before the
# workflow is on main.
#
# By default it dispatches the workflow, follows it, and prints the report.
# With --local it does the work here instead, in throwaway clones under a temp
# directory, pushing with your own gh credentials. Your checkouts are never
# touched.
#
# Usage:
#   ./scripts/dispatch-branch-release.sh --version 25.4 --dry-run
#   ./scripts/dispatch-branch-release.sh --version 25.4
#   ./scripts/dispatch-branch-release.sh --version 25.4 --repos flow,hilla --local
#
# Options:
#   --version X.Y    train to branch (required); main moves to X.(Y+1)-SNAPSHOT
#   --repos a,b      subset of the train's repos (default: all of them)
#   --no-branch      do not create missing X.Y branches, only open bump PRs
#   --local          run here instead of dispatching to Actions
#   --dry-run        report only; no branches, no PRs
#   --no-follow      dispatch and exit without waiting (ignored with --local)
#   --json           print the raw results as JSON
#
# See scripts/branch-release/README.md for the full picture.

set -euo pipefail

WORKFLOW='branch-release.yml'
CONTROL_REPO='vaadin/platform'

version=''
repos=''
create_branch=true
dry_run=false
local_mode=false
follow=true
as_json=false

usage() {
    awk 'NR > 2 { if (/^#/) { sub(/^# ?/, ""); print } else { exit } }' "$0"
    exit "${1:-0}"
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --version)   version="${2:?--version needs a value}"; shift 2 ;;
        --repos)     repos="${2:?--repos needs a value}"; shift 2 ;;
        --no-branch) create_branch=false; shift ;;
        --dry-run)   dry_run=true; shift ;;
        --local)     local_mode=true; shift ;;
        --no-follow) follow=false; shift ;;
        --json)      as_json=true; shift ;;
        -h|--help)   usage 0 ;;
        *) echo "error: unknown option $1" >&2; usage 1 ;;
    esac
done

[[ "$version" =~ ^[0-9]+\.[0-9]+$ ]] || { echo "error: --version X.Y is required (e.g. 25.4)" >&2; exit 1; }

command -v gh >/dev/null 2>&1 || { echo "error: gh CLI not found. See https://cli.github.com/" >&2; exit 1; }
command -v jq >/dev/null 2>&1 || { echo "error: jq not found." >&2; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "error: gh is not authenticated. Run \`gh auth login\`." >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

render_report() {
    local results="$1" where="$2"
    if $as_json; then
        jq --arg where "$where" '{source: $where, results: .}' <<<"$results"
        return
    fi
    echo
    printf '%-32s %-22s %-36s %s\n' repo branch main 'pull request / notes'
    jq -r '.[] | [
        .repo,
        (.branch.status + (if .branch.sha then " " + .branch.sha[0:10] else "" end)),
        (.bump.status + (if .bump.from then " (" + .bump.from + " -> " + (.bump.to // "?") + ")" else "" end)),
        ((if .pr then .pr.url + " " else "" end)
          + (([.error // empty, .branch.reason // empty] + .warnings) | map(gsub("[[:space:]]+"; " ")) | join("; ")))
      ] | @tsv' <<<"$results" | tr -d '\r' |
        while IFS=$'\t' read -r r b m n; do printf '%-32s %-22s %-36s %s\n' "$r" "$b" "$m" "$n"; done
    local failed
    failed=$(jq '[.[] | select(.bump.status == "error" or .branch.status == "error")] | length' <<<"$results")
    echo
    echo "$failed of $(jq length <<<"$results") repo(s) failed. $where"
}

collect_results() {
    find "$1" -name 'result*.json' -type f | sort | xargs cat 2>/dev/null | jq -s 'sort_by(.repo)'
}

# ------------------------------------------------------------- local runner --

if $local_mode; then
    tool_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/branch-release" && pwd)"
    command -v node >/dev/null 2>&1 || { echo "error: node not found (needs >=24)." >&2; exit 1; }
    [[ -d "$tool_dir/node_modules" ]] || {
        echo "Installing branch-release dependencies..."
        (cd "$tool_dir" && npm install --ignore-scripts --no-audit --no-fund >/dev/null)
    }

    token=$(gh auth token 2>/dev/null || true)
    [[ -n "$token" ]] || { echo "error: could not read a token from \`gh auth token\`." >&2; exit 1; }

    # Select from main's versions.json, as the dispatched workflow does.
    gh api "repos/$CONTROL_REPO/contents/versions.json?ref=main" -H 'Accept: application/vnd.github.raw' > "$tmp/versions.json"
    selection=$(cd "$tool_dir" && npx --no tsx src/select.ts --versions-file "$tmp/versions.json" --version "$version" --repos "$repos")
    mapfile -t repo_list < <(jq -r '.repos[]' <<<"$selection" | tr -d '\r')

    echo "Train $version: ${repo_list[*]}"
    jq -r '.unmapped[] | "  warning: \(.) is on the train but has no repo mapping in src/repos.ts"' <<<"$selection"
    jq -r '.excluded[] | "  excluded \(.product): \(.reason)"' <<<"$selection"
    $dry_run && echo "Running locally (dry run)." || echo "Running locally."

    extra=()
    $dry_run && extra+=(--dry-run)
    $create_branch || extra+=(--no-branch)

    for repo in "${repo_list[@]}"; do
        echo
        clone="$tmp/$repo"
        if ! git clone --quiet --filter=blob:none --branch main \
            "https://x-access-token:$token@github.com/vaadin/$repo.git" "$clone" 2>/dev/null; then
            echo "vaadin/$repo: could not clone"
            jq -n --arg r "$repo" --arg v "$version" \
                '{repo: $r, version: $v, next: null, branch: {status: "error", sha: null},
                  bump: {status: "error", from: null, to: null, files: 0, properties: []},
                  pr: null, warnings: [], error: "could not clone vaadin/\($r)"}' > "$tmp/result-$repo.json"
            continue
        fi
        # `|| true`: one failing repo must not stop the rest; its result file says why.
        ( cd "$tool_dir" && GH_TOKEN="$token" npx --no tsx src/index.ts \
            --repo "$repo" --version "$version" --repo-dir "$clone" \
            --result-file "$tmp/result-$repo.json" "${extra[@]}" ) || true
        rm -rf "$clone"
    done

    results=$(collect_results "$tmp")
    render_report "$results" "Ran locally; your working checkouts were not touched."
    [[ $(jq '[.[] | select(.bump.status == "error" or .branch.status == "error")] | length' <<<"$results") -eq 0 ]]
    exit $?
fi

# ------------------------------------------------------- dispatch to Actions --

if ! gh auth status 2>&1 | grep -q 'workflow'; then
    echo "warning: your gh token may lack the 'workflow' scope, which is required to dispatch." >&2
    echo "         run \`gh auth refresh -h github.com -s workflow\`, or use --local." >&2
fi

echo "Dispatching: version=$version repos=${repos:-<all>} create_branch=$create_branch dry_run=$dry_run"
previous_id=$(gh run list -R "$CONTROL_REPO" --workflow "$WORKFLOW" --limit 1 --json databaseId -q '.[0].databaseId // 0')

gh workflow run "$WORKFLOW" -R "$CONTROL_REPO" --ref main \
    -f "version=$version" \
    -f "repos=$repos" \
    -f "create_branch=$create_branch" \
    -f "dry_run=$dry_run"

run_id=''
for _ in $(seq 1 30); do
    sleep 2
    run_id=$(gh run list -R "$CONTROL_REPO" --workflow "$WORKFLOW" --limit 1 --json databaseId \
        -q "[.[] | select(.databaseId > $previous_id) | .databaseId] | first // empty")
    [[ -n "$run_id" ]] && break
done
[[ -n "$run_id" ]] || { echo "error: dispatched, but no new run appeared within 60s." >&2; exit 1; }

run_url="https://github.com/$CONTROL_REPO/actions/runs/$run_id"
echo "Run: $run_url"
$follow || { echo "Not following (--no-follow)."; exit 0; }

echo "Waiting for the run to finish..."
gh run watch "$run_id" -R "$CONTROL_REPO" --exit-status >/dev/null 2>&1 || true

if ! gh run download "$run_id" -R "$CONTROL_REPO" --pattern 'result-*' --dir "$tmp" >/dev/null 2>&1; then
    echo "error: could not download results from $run_url" >&2
    exit 1
fi
results=$(collect_results "$tmp")
render_report "$results" "Run: $run_url"
[[ $(jq '[.[] | select(.bump.status == "error" or .branch.status == "error")] | length' <<<"$results") -eq 0 ]]
