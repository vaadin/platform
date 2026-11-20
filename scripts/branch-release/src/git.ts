import { spawnSync } from "node:child_process";
import type { Repo } from "../../bump-spring-boot/src/repo.js";

/**
 * The few git primitives this job needs beyond bump-spring-boot's repo.ts.
 * Like those, every call is bound to an explicit checkout directory.
 */
function git(repo: Repo, args: string[], allowFailure = false): { code: number; stdout: string } {
    const res = spawnSync("git", args, { cwd: repo.dir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    if (res.error) throw res.error;
    const code = res.status ?? 1;
    if (code !== 0 && !allowFailure) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`\`git ${args.join(" ")}\` failed (exit ${code})${detail ? `:\n${detail}` : ""}`);
    }
    return { code, stdout: res.stdout ?? "" };
}

export function revParse(repo: Repo, ref: string): string {
    return git(repo, ["rev-parse", "--verify", `${ref}^{commit}`]).stdout.trim();
}

/** SHA of `refs/heads/<branch>` on origin, or null when it does not exist. */
export function remoteBranchSha(repo: Repo, branch: string): string | null {
    const res = git(repo, ["ls-remote", "--heads", "origin", `refs/heads/${branch}`], true);
    const line = res.stdout.trim().split("\n")[0] ?? "";
    return res.code === 0 && line ? line.split(/\s+/)[0] : null;
}

/**
 * Create `branch` on origin pointing at `sha`, without touching any local
 * branch. Plain push (no force): if someone created the branch in the
 * meantime, this fails instead of moving it.
 */
export function createRemoteBranch(repo: Repo, branch: string, sha: string): void {
    git(repo, ["push", "--quiet", "origin", `${sha}:refs/heads/${branch}`]);
}

export function checkoutDetached(repo: Repo, sha: string): void {
    git(repo, ["checkout", "--quiet", "--detach", sha]);
}

export function listTrackedFiles(repo: Repo): string[] {
    return git(repo, ["ls-files", "-z"]).stdout.split("\0").filter(Boolean);
}

export function shortStat(repo: Repo): string {
    return git(repo, ["diff", "--shortstat"]).stdout.trim();
}

export function discardWorkingTreeChanges(repo: Repo): void {
    git(repo, ["checkout", "--quiet", "--", "."]);
}

/** Stage every modified tracked file and commit. The checkout is a throwaway clone. */
export function commitAllTracked(repo: Repo, title: string, body: string): void {
    git(repo, ["add", "--update"]);
    git(repo, ["commit", "--quiet", "-m", title, "-m", body]);
}
