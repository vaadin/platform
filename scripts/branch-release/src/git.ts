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

export interface OpenPr {
    number: number;
    title: string;
    url: string;
    headRefName: string;
    /** True when the head branch lives in a fork; such a PR cannot be updated from here. */
    isCrossRepository: boolean;
}

/**
 * The first open PR against `base` whose title mentions `needle` (e.g.
 * `25.5-SNAPSHOT`), or null. Matching on the version rather than this job's
 * exact title also finds a bump PR someone opened by hand.
 *
 * In a dry run, gh may not be authenticated; a failed lookup is then treated
 * as "no PR" instead of failing the preview.
 */
export function findOpenPrMentioning(repo: Repo, base: string, needle: string, tolerateFailure: boolean): OpenPr | null {
    const res = spawnSync(
        "gh",
        ["pr", "list", "-R", repo.slug, "--base", base, "--state", "open", "--search", `${needle} in:title`, "--json", "number,title,url,headRefName,isCrossRepository", "--limit", "50"],
        { cwd: repo.dir, encoding: "utf8" },
    );
    if (res.error || res.status !== 0) {
        if (tolerateFailure) return null;
        const detail = [res.stdout, res.stderr, res.error?.message].filter(Boolean).join("\n").trim();
        throw new Error(`\`gh pr list\` failed${detail ? `:\n${detail}` : ""}`);
    }
    const prs: OpenPr[] = JSON.parse(res.stdout || "[]");
    return prs.find((pr) => pr.title.includes(needle)) ?? null;
}

function ghApi(repo: Repo, args: string[]): { code: number; stdout: string; stderr: string } {
    const res = spawnSync("gh", ["api", ...args], { cwd: repo.dir, encoding: "utf8" });
    if (res.error) throw res.error;
    return { code: res.status ?? 1, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

export interface RepoLabel {
    name: string;
    color: string;
    description: string | null;
}

/** Every label of the repo (paginated). */
export function listLabels(repo: Repo): RepoLabel[] {
    const res = ghApi(repo, ["--paginate", `repos/${repo.slug}/labels?per_page=100`, "--jq", ".[] | {name, color, description}"]);
    if (res.code !== 0) throw new Error(`could not list labels of ${repo.slug}: ${res.stderr.trim() || res.stdout.trim()}`);
    return res.stdout
        .split("\n")
        .filter(Boolean)
        .map((line) => JSON.parse(line) as RepoLabel);
}

export function createLabel(repo: Repo, name: string, color: string, description: string): void {
    const args = ["-X", "POST", `repos/${repo.slug}/labels`, "-f", `name=${name}`, "-f", `color=${color}`];
    if (description) args.push("-f", `description=${description}`);
    const res = ghApi(repo, args);
    if (res.code !== 0) throw new Error(`could not create label ${name} in ${repo.slug}: ${res.stderr.trim() || res.stdout.trim()}`);
}

/** Fetch `branch` from origin into `refs/remotes/origin/<branch>`. */
export function fetchRemoteBranch(repo: Repo, branch: string): void {
    git(repo, ["fetch", "--quiet", "origin", `+refs/heads/${branch}:refs/remotes/origin/${branch}`]);
}

/** Check out a local `branch` at `origin/<branch>`, replacing any local copy. */
export function checkoutRemoteBranch(repo: Repo, branch: string): void {
    git(repo, ["checkout", "--quiet", "-B", branch, `origin/${branch}`]);
}

/**
 * Push `branch` to origin as a plain fast-forward. Never forced: commits
 * someone else added to the PR branch are kept, and if the branch moved
 * since it was fetched the push fails instead of overwriting.
 */
export function pushFastForward(repo: Repo, branch: string): void {
    git(repo, ["push", "--quiet", "origin", `HEAD:refs/heads/${branch}`]);
}

export function commentOnPr(repo: Repo, prNumber: number, body: string): void {
    const res = spawnSync("gh", ["pr", "comment", String(prNumber), "-R", repo.slug, "--body", body], {
        cwd: repo.dir,
        encoding: "utf8",
    });
    if (res.error || res.status !== 0) {
        const detail = [res.stdout, res.stderr, res.error?.message].filter(Boolean).join("\n").trim();
        throw new Error(`\`gh pr comment\` failed${detail ? `:\n${detail}` : ""}`);
    }
}
