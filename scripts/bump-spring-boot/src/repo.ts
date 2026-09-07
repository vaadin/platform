import { spawnSync } from "node:child_process";

/**
 * git/gh primitives for a repo checkout at an arbitrary path.
 *
 * This mirrors `scripts/check-versions/src/git.ts`, with one deliberate
 * difference: that module resolves a module-level `REPO_ROOT` pointing at the
 * platform checkout and runs every command there. This job operates on
 * *clones of other repos*, so the working directory is per-call state, not a
 * constant. Threading it through is what keeps a flow bump from being
 * committed into platform.
 */
export interface Repo {
    /** Short repo name, e.g. `flow`. */
    readonly name: string;
    /** `owner/name`, as `gh -R` wants it. */
    readonly slug: string;
    /** Absolute path to the checkout. */
    readonly dir: string;
}

interface RunOptions {
    allowFailure?: boolean;
}

interface RunResult {
    code: number;
    stdout: string;
    stderr: string;
}

function run(cmd: string, args: string[], cwd: string, opts: RunOptions = {}): RunResult {
    const res = spawnSync(cmd, args, { cwd, encoding: "utf8", shell: false });
    if (res.error) throw res.error;
    const code = res.status ?? 1;
    if (code !== 0 && !opts.allowFailure) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`\`${cmd} ${args.join(" ")}\` failed (exit ${code})${detail ? `:\n${detail}` : ""}`);
    }
    return { code, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

const git = (repo: Repo, args: string[], opts?: RunOptions) => run("git", args, repo.dir, opts);
const gh = (repo: Repo, args: string[], opts?: RunOptions) => run("gh", args, repo.dir, opts);

export function assertGhAvailable(cwd: string): void {
    const probe = run("gh", ["auth", "status"], cwd, { allowFailure: true });
    if (probe.code !== 0) {
        throw new Error(
            "`gh` CLI is not installed or not authenticated. Install from https://cli.github.com/ and run `gh auth login`.",
        );
    }
}

export function configureBotIdentity(repo: Repo): void {
    git(repo, ["config", "user.name", "github-actions[bot]"]);
    git(repo, ["config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com"]);
}

export function fetchOrigin(repo: Repo, refs: string[]): void {
    git(repo, ["fetch", "--quiet", "origin", ...refs]);
}

/**
 * Fetch, but tolerate failure when every ref is already available locally.
 *
 * A real bump must fetch: basing a branch on a stale `origin/<base>` would
 * push a commit that silently reverts whatever landed since. A dry run only
 * reads, so falling back to the remote-tracking ref lets it work offline or
 * against a checkout whose remote needs credentials this process doesn't have.
 * Mirrors the hard-vs-best-effort split in `check-versions/src/index.ts`.
 */
export function fetchOriginBestEffort(repo: Repo, refs: string[]): string | null {
    const res = git(repo, ["fetch", "--quiet", "origin", ...refs], { allowFailure: true });
    if (res.code === 0) return null;

    const missing = refs.filter(
        (ref) =>
            git(repo, ["rev-parse", "--verify", "--quiet", `refs/remotes/origin/${ref}`], {
                allowFailure: true,
            }).code !== 0,
    );
    if (missing.length > 0) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`Could not fetch origin/${missing.join(", origin/")}${detail ? `:\n${detail}` : ""}`);
    }
    return `could not reach origin, using local origin/${refs.join(", origin/")} which may be stale`;
}

/**
 * Read a file as of a git ref without checking that ref out. Lets the job
 * inspect a release branch's pom while sitting on a fresh clone's default
 * branch.
 */
export function readFileFromRef(repo: Repo, ref: string, path: string): string {
    return git(repo, ["show", `${ref}:${path}`]).stdout;
}

export function branchExistsOnOrigin(repo: Repo, branch: string): boolean {
    const res = git(repo, ["ls-remote", "--exit-code", "--heads", "origin", branch], { allowFailure: true });
    return res.code === 0;
}

/** Append `-2`..`-99` until the branch name is free both locally and on origin. */
export function findUniqueBranchName(repo: Repo, base: string): string {
    for (let i = 1; i < 100; i++) {
        const candidate = i === 1 ? base : `${base}-${i}`;
        const local = git(repo, ["show-ref", "--verify", "--quiet", `refs/heads/${candidate}`], {
            allowFailure: true,
        });
        if (local.code === 0) continue;
        if (branchExistsOnOrigin(repo, candidate)) continue;
        return candidate;
    }
    throw new Error(`Could not find an unused branch name based on ${base}`);
}

export function checkoutNewBranchFromBase(repo: Repo, branch: string, base: string): void {
    git(repo, ["checkout", "--quiet", "-b", branch, `origin/${base}`]);
}

/**
 * Point `branch` back at `origin/<base>`, discarding whatever the previous run
 * put there. Keeps the rolling PR at a single commit instead of accumulating
 * one bump commit per run.
 */
export function resetBranchToBase(repo: Repo, branch: string, base: string): void {
    git(repo, ["fetch", "origin", `${branch}:refs/remotes/origin/${branch}`], { allowFailure: true });
    // Detach first so `branch -D` can delete the branch even when it is the
    // one currently checked out.
    git(repo, ["checkout", "--quiet", "--detach", `origin/${base}`], { allowFailure: true });
    git(repo, ["branch", "-D", branch], { allowFailure: true });
    git(repo, ["checkout", "--quiet", "-b", branch, `origin/${base}`]);
}

export function commitFiles(repo: Repo, files: string[], title: string, body: string): void {
    git(repo, ["add", ...files]);
    git(repo, ["commit", "--quiet", "-m", title, "-m", body]);
}

export function pushBranch(repo: Repo, branch: string): void {
    git(repo, ["push", "--quiet", "-u", "origin", branch]);
}

export function forcePushBranch(repo: Repo, branch: string): void {
    git(repo, ["push", "--quiet", "--force-with-lease", "-u", "origin", branch]);
}

export function diffStat(repo: Repo): string {
    return git(repo, ["diff", "--stat"]).stdout.trim();
}

export interface ExistingPr {
    number: number;
    headRefName: string;
    title: string;
    url: string;
}

/**
 * Find this job's own open PR for `base`.
 *
 * `titlePrefix` is a parameter on purpose. The check-versions equivalent
 * hardcodes its own prefix, and matching that one would make this job hijack
 * and overwrite the unrelated maintenance-bump PR.
 */
export function findExistingPr(repo: Repo, base: string, titlePrefix: string): ExistingPr | null {
    const { stdout } = gh(repo, [
        "pr",
        "list",
        "-R",
        repo.slug,
        "--base",
        base,
        "--state",
        "open",
        "--json",
        "number,headRefName,title,url",
        "--limit",
        "100",
    ]);
    const prs: ExistingPr[] = JSON.parse(stdout || "[]");
    return prs.find((pr) => pr.title.startsWith(titlePrefix)) ?? null;
}

export function openPullRequest(
    repo: Repo,
    base: string,
    title: string,
    body: string,
    labels: string[],
): string {
    const args = ["pr", "create", "-R", repo.slug, "--base", base, "--title", title, "--body", body];
    for (const label of labels) args.push("--label", label);

    // A label that doesn't exist in the target repo is a repo-config problem,
    // not a reason to lose the bump -- retry unlabelled rather than failing.
    const res = run("gh", args, repo.dir, { allowFailure: true });
    if (res.code === 0) return res.stdout.trim();
    if (labels.length === 0) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`\`gh pr create\` failed (exit ${res.code})${detail ? `:\n${detail}` : ""}`);
    }
    console.warn(`  warning: \`gh pr create\` with labels [${labels.join(", ")}] failed, retrying without labels`);
    return openPullRequest(repo, base, title, body, []);
}

export function updatePullRequest(repo: Repo, prNumber: number, title: string, body: string): void {
    gh(repo, ["pr", "edit", String(prNumber), "-R", repo.slug, "--title", title, "--body", body]);
}

export function prNumberFromUrl(url: string): number | null {
    const match = url.match(/\/pull\/(\d+)/);
    return match ? Number(match[1]) : null;
}
