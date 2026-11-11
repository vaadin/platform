#!/usr/bin/env python3
"""Resolves the repositories and refs to audit for a Vaadin platform minor.

The products come from the platform's versions.json, mapped to repositories by
scripts/checkUnreleased.js in vaadin/platform (the single source of truth for
the mapping). The script runs it once for the target line and once for the
previous line and pairs the products by repository:

- dev ref:     what the target release ships (or will ship)
- shipped ref: what the previous minor already shipped, latest maintenance

Usage:
  resolve_repos.py --version 25.4 --check-unreleased repo/platform/scripts/checkUnreleased.js \
      --out audit-tmp/repos.json

Requires python3, node and an authenticated gh. Only reads from GitHub.
"""

import argparse
import json
import re
import subprocess
import sys

PLATFORM = "vaadin/platform"
WEB_COMPONENTS = "vaadin/web-components"
# Read by every analysis agent, not analyzed themselves unless they also ship.
REFERENCE_REPOS = ["vaadin/docs", "vaadin/browserless-test", "vaadin/testbench", "vaadin/flow-components"]


def gh_json(*args, optional=False):
    proc = subprocess.run(["gh", "api", *args], capture_output=True, text=True)
    if proc.returncode != 0:
        if optional and "HTTP 404" in proc.stderr:
            return None
        sys.exit(f"gh api {' '.join(args)} failed: {proc.stderr.strip()}")
    return json.loads(proc.stdout) if proc.stdout.strip() else None


def branch_exists(repo, branch):
    return gh_json(f"repos/{repo}/branches/{branch}", optional=True) is not None


def tag_exists(repo, tag):
    return gh_json(f"repos/{repo}/git/ref/tags/{tag}", optional=True) is not None


_default_branches = {}


def default_branch(repo):
    if repo not in _default_branches:
        _default_branches[repo] = gh_json(f"repos/{repo}")["default_branch"]
    return _default_branches[repo]


def ga_date(line):
    release = gh_json(f"repos/{PLATFORM}/releases/tags/{line}.0", optional=True)
    return release and release["published_at"]


def previous_line(major, minor):
    """X.(Y-1); for X.0 the newest (X-1).* line whose .0 shipped before X.0."""
    if minor > 0:
        return f"{major}.{minor - 1}"
    target_ga = ga_date(f"{major}.0")
    candidates = []
    for ref in gh_json("--paginate", f"repos/{PLATFORM}/git/matching-refs/heads/{major - 1}.", "--jq", "[.[].ref]") or []:
        m = re.fullmatch(rf"refs/heads/{major - 1}\.(\d+)", ref)
        if m:
            candidates.append(int(m.group(1)))
    for cand in sorted(candidates, reverse=True):
        published = ga_date(f"{major - 1}.{cand}")
        if published and (target_ga is None or published < target_ga):
            return f"{major - 1}.{cand}"
    sys.exit(f"cannot determine the platform line before {major}.0")


def check_unreleased(script, branch):
    proc = subprocess.run(["node", script, branch, "--format", "json"], capture_output=True, text=True)
    if proc.returncode != 0:
        sys.exit(f"checkUnreleased.js {branch} failed: {proc.stderr.strip()}")
    return json.loads(proc.stdout)


def is_live(version):
    """A SNAPSHOT or pre-release pin means the product is still being developed."""
    return version.endswith("-SNAPSHOT") or bool(re.search(r"\d[.-](alpha|beta|rc)", version))


def add_web_components(result, line):
    """Since 25.4 the web components are `{{version}}` and checkUnreleased skips them."""
    if any(p["repo"] == WEB_COMPONENTS for p in result["products"]):
        return
    version = result["platformVersion"]
    tag = f"v{version}" if tag_exists(WEB_COMPONENTS, f"v{version}") else None
    branch = line if branch_exists(WEB_COMPONENTS, line) else default_branch(WEB_COMPONENTS)
    result["products"].append({"name": "web-components", "repo": WEB_COMPONENTS, "version": version,
                               "base": tag, "branch": branch, "status": "added", "notes": []})


def add_platform(result, line, platform_branch):
    version = result["platformVersion"]
    result["products"].append({"name": "platform", "repo": PLATFORM, "version": version,
                               "base": version if tag_exists(PLATFORM, version) else None,
                               "branch": platform_branch, "status": "added", "notes": []})


def ref_for(product, live):
    """The maintenance branch when there is one, else the tip (live) or the pinned tag."""
    branch = product.get("branch")
    if branch and branch != default_branch(product["repo"]):
        return f"origin/{branch}"
    if live or not product.get("base"):
        return f"origin/{branch or default_branch(product['repo'])}"
    return product["base"]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--version", required=True, help="target platform minor, e.g. 25.4")
    parser.add_argument("--check-unreleased", required=True, help="path to vaadin/platform scripts/checkUnreleased.js")
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    m = re.fullmatch(r"(\d+)\.(\d+)", args.version)
    if not m:
        sys.exit("--version must be MAJOR.MINOR, e.g. 25.4")
    major, minor = int(m.group(1)), int(m.group(2))
    line = args.version
    prev = previous_line(major, minor)
    released = ga_date(line) is not None
    target_branch = line if branch_exists(PLATFORM, line) else "main"

    target = check_unreleased(args.check_unreleased, target_branch)
    previous = check_unreleased(args.check_unreleased, prev)
    for result, ln, branch in ((target, line, target_branch), (previous, prev, prev)):
        add_web_components(result, ln)
        add_platform(result, ln, branch)

    prev_by_repo = {}
    for p in previous["products"]:
        prev_by_repo.setdefault(p["repo"], p)

    repos, unresolved = {}, []
    for p in target["products"]:
        if p["status"] == "ERROR":
            unresolved.append({"product": p["name"], "repo": p["repo"], "version": p["version"], "notes": p["notes"]})
            continue
        if p["repo"] in repos:
            repos[p["repo"]]["products"].append(p["name"])
            continue
        live = not released and is_live(p["version"])
        prev_p = prev_by_repo.get(p["repo"])
        entry = {
            "repo": p["repo"],
            "name": p["repo"].split("/", 1)[1],
            "products": [p["name"]],
            "version": p["version"],
            "dev_ref": ref_for(p, live),
            "prev_version": prev_p and prev_p["version"],
            "shipped_ref": None,
            "notes": list(p["notes"]),
        }
        if prev_p is None:
            entry["notes"].append(f"not in platform {prev}: new in {line}, audit its whole history")
        elif prev_p["status"] == "ERROR":
            entry["notes"].append(f"previous pin {prev_p['version']} unresolved: {'; '.join(prev_p['notes'])}")
        else:
            entry["shipped_ref"] = ref_for(prev_p, False)
            entry["unchanged"] = entry["shipped_ref"] == entry["dev_ref"]
        repos[p["repo"]] = entry

    manifest = {
        "version": line,
        "prev": prev,
        "released": released,
        "platform_branch": target_branch,
        "platform_version": target["platformVersion"],
        "prev_platform_version": previous["platformVersion"],
        "prev_ga": ga_date(prev),
        "repos": list(repos.values()),
        "reference_repos": [r for r in REFERENCE_REPOS if r not in repos],
        "dropped_since_prev": sorted(set(prev_by_repo) - set(repos) - {u["repo"] for u in unresolved}),
        "unresolved": unresolved,
        "skipped": target["skipped"],
    }
    with open(args.out, "w") as f:
        json.dump(manifest, f, indent=2)
    for r in manifest["repos"]:
        same = "  (same as previous, nothing to audit)" if r.get("unchanged") else ""
        print(f"{r['repo']:45} {r['shipped_ref'] or '(new)':>22} .. {r['dev_ref']}{same}")
    for u in unresolved:
        print(f"UNRESOLVED {u['product']} ({u['repo']} {u['version']}): {'; '.join(u['notes'])}")
    if manifest["dropped_since_prev"]:
        print("no longer a separate product since", prev, ":", ", ".join(manifest["dropped_since_prev"]))


if __name__ == "__main__":
    main()
