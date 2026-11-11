#!/usr/bin/env python3
"""Lists the commits a repository adds in the audited release.

Window: `git log --first-parent <merge-base(shipped, dev)>..<dev>`. A window
commit is dropped when it already shipped in the previous minor:

- its subject mentions a PR number that also appears on the shipped side
  (`<merge-base>..<shipped>`): the cherry-pick bot keeps the original number,
  `subject (#orig) (CP: 25.3) (#cp)`;
- its normalized subject equals a subject on the shipped side (manual
  backports that got a new PR number);
- it is a merge whose merged-in parent is already contained in the shipped ref
  (forward merges of a maintenance branch).

Writes <out-dir>/<name>-kept.txt and <name>-excluded.txt (`<sha> <subject>`,
excluded lines end with the reason) and prints a JSON summary. Works on
--filter=blob:none / tree:0 clones without fetching blobs.

Usage:
  change_window.py --clone repo/flow --name flow --dev origin/main \
      [--shipped origin/25.3] --out-dir audit-tmp/excl
"""

import argparse
import json
import os
import re
import subprocess

PR = re.compile(r"#(\d+)")
# `(#123)`, `(CP: 25.3)`, `(25.3)`, `[25.3]`, `[CP 25.3]` style suffixes added by backports.
NOISE = re.compile(r"\s*(\(#\d+\)|\((CP:?\s*)?\d+\.\d+\)|\[(CP:?\s*)?\d+\.\d+\])", re.I)


def git(clone, *args):
    return subprocess.run(["git", "-C", clone, *args], capture_output=True, text=True, check=True).stdout


def normalize(subject):
    return NOISE.sub("", subject).strip().lower()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--clone", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--dev", required=True)
    parser.add_argument("--shipped", help="omit for a repository that is new in this release")
    parser.add_argument("--out-dir", required=True)
    args = parser.parse_args()

    if args.shipped:
        found = subprocess.run(["git", "-C", args.clone, "merge-base", args.shipped, args.dev],
                               capture_output=True, text=True)
        # No common history, e.g. a rewrite started from scratch: everything not in the shipped ref counts.
        base = found.stdout.strip() if found.returncode == 0 else None
        window = f"{base}..{args.dev}" if base else f"^{args.shipped} {args.dev}"
        shipped_subjects = git(args.clone, "log", "--format=%s", f"{base}..{args.shipped}" if base else args.shipped).splitlines()
    else:
        base, window, shipped_subjects = None, args.dev, []
    shipped_prs = {n for s in shipped_subjects for n in PR.findall(s)}
    shipped_titles = {normalize(s) for s in shipped_subjects}

    kept, excluded = [], []
    for line in git(args.clone, "log", "--first-parent", "--format=%H %P%x09%s", *window.split()).splitlines():
        shas, subject = line.split("\t", 1)
        sha, *parents = shas.split()
        reason = None
        prs = set(PR.findall(subject)) & shipped_prs
        if prs:
            reason = "PR already on the shipped side: " + ", ".join(f"#{n}" for n in sorted(prs))
        elif normalize(subject) in shipped_titles:
            reason = "same subject already on the shipped side"
        elif args.shipped and len(parents) > 1 and subprocess.run(
                ["git", "-C", args.clone, "merge-base", "--is-ancestor", parents[1], args.shipped]).returncode == 0:
            reason = "merges commits already in the shipped ref"
        (excluded if reason else kept).append((sha, subject, reason))

    os.makedirs(args.out_dir, exist_ok=True)
    with open(os.path.join(args.out_dir, f"{args.name}-kept.txt"), "w") as f:
        f.writelines(f"{sha[:10]} {subject}\n" for sha, subject, _ in kept)
    with open(os.path.join(args.out_dir, f"{args.name}-excluded.txt"), "w") as f:
        f.writelines(f"{sha[:10]} {subject}  -- {reason}\n" for sha, subject, reason in excluded)
    print(json.dumps({"name": args.name, "merge_base": base, "common_history": bool(base or not args.shipped), "window": len(kept) + len(excluded),
                      "excluded_already_shipped": len(excluded), "kept": len(kept)}))


if __name__ == "__main__":
    main()
