import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { StabilityReport, renderStabilityMarkdown } from "./stability.js";

export interface Update {
    section: string;
    name: string;
    field: "javaVersion" | "jsVersion";
    from: string;
    to: string;
}

/**
 * Hidden marker used to recognize and update the sticky stability-check
 * comment across runs. Lives inside an HTML comment so it doesn't render in
 * the PR UI but is still searchable in the raw body.
 */
export const STABILITY_COMMENT_MARKER = "<!-- check-versions:stability-v1 -->";

interface RunOptions {
    cwd?: string;
    allowFailure?: boolean;
}

// All git/gh commands run from the repo root regardless of where the script
// was invoked from. Required because the GitHub Actions workflow sets
// `working-directory: scripts/check-versions`, so without this override
// `git add versions.json` would look in the wrong directory.
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function run(cmd: string, args: string[], opts: RunOptions = {}): { code: number; stdout: string; stderr: string } {
    const res = spawnSync(cmd, args, {
        cwd: opts.cwd ?? REPO_ROOT,
        encoding: "utf8",
        shell: false,
    });
    if (res.error) throw res.error;
    const code = res.status ?? 1;
    if (code !== 0 && !opts.allowFailure) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`\`${cmd} ${args.join(" ")}\` failed (exit ${code})${detail ? `:\n${detail}` : ""}`);
    }
    return { code, stdout: res.stdout ?? "", stderr: res.stderr ?? "" };
}

const git = (args: string[], opts?: RunOptions) => run("git", args, opts);
const gh = (args: string[], opts?: RunOptions) => run("gh", args, opts);

export function assertCleanWorkingTree(): void {
    const { stdout } = git(["status", "--porcelain"]);
    if (stdout.trim() !== "") {
        throw new Error(
            "Working tree is not clean. Commit, stash, or discard local changes before using --create-pr:\n" +
                stdout.trimEnd(),
        );
    }
}

export function assertGhAvailable(): void {
    const probe = run("gh", ["auth", "status"], { allowFailure: true });
    if (probe.code !== 0) {
        throw new Error(
            "`gh` CLI is not installed or not authenticated. Install from https://cli.github.com/ and run `gh auth login`.",
        );
    }
}

export function currentBranch(): string {
    return git(["branch", "--show-current"]).stdout.trim();
}

export function findUniqueBranchName(base: string): string {
    const exists = (name: string): boolean => {
        const local = git(["rev-parse", "--verify", "--quiet", `refs/heads/${name}`], { allowFailure: true });
        if (local.code === 0) return true;
        const remote = git(["ls-remote", "--exit-code", "--heads", "origin", name], { allowFailure: true });
        return remote.code === 0;
    };
    if (!exists(base)) return base;
    for (let i = 2; i < 100; i++) {
        const candidate = `${base}-${i}`;
        if (!exists(candidate)) return candidate;
    }
    throw new Error(`Could not find a free branch name under ${base}-{2..99}`);
}

/** Stable prefix used both in commit/PR titles and to find existing PRs to update. */
export const PR_TITLE_PREFIX = "chore: maintenance version bumps";

export function commitTitle(date: string, base: string): string {
    // The base branch is always included so the title is self-explanatory in
    // the PR list (otherwise reviewers have to open each PR to see which
    // branch it targets).
    return `${PR_TITLE_PREFIX} [${base}] (${date})`;
}

export function commitBody(updates: Update[], base: string, stability?: StabilityReport): string {
    const lines: string[] = [];
    // Stability warnings go at the very top so the reviewer sees them before
    // scrolling through the updates list. A horizontal rule separates the two
    // sections.
    if (stability && stability.violations.length > 0) {
        lines.push(renderStabilityMarkdown(stability));
        lines.push("");
        lines.push("---");
        lines.push("");
    }
    if (updates.length > 0) {
        lines.push(
            `Automated maintenance-version updates against \`${base}\`, discovered by \`scripts/check-versions\`.`,
            "",
            "## Updates",
            "",
        );
        for (const u of updates) {
            lines.push(`- \`${u.section}/${u.name}\`: ${u.field} \`${u.from}\` → \`${u.to}\``);
        }
    } else {
        // Stability-only PR: no versions.json diff, exists solely as a hook
        // for the warning above. Carries an empty commit so the branch can be
        // pushed and a PR opened against `base`.
        lines.push(
            `Automated check against \`${base}\` by \`scripts/check-versions\`.`,
            "",
            "No maintenance version updates were available this run — this PR exists solely to surface the stability warning above. Closing this PR is fine once the underlying modules are bumped (or once the warning is acknowledged as expected).",
        );
    }
    lines.push("", "_Generated by `scripts/check-versions/src/index.ts`._");
    return lines.join("\n");
}

export function fetchOrigin(refs: string[]): void {
    git(["fetch", "origin", ...refs]);
}

/** Read a file's contents at a given git ref (e.g. `origin/main`). */
export function readFileFromRef(ref: string, path: string): string {
    return git(["show", `${ref}:${path}`]).stdout;
}

export interface ExistingPr {
    number: number;
    headRefName: string;
    title: string;
    url: string;
}

/** Find an open PR targeting `base` whose title starts with PR_TITLE_PREFIX. */
export function findExistingPr(base: string): ExistingPr | null {
    const { stdout } = gh([
        "pr",
        "list",
        "--base",
        base,
        "--state",
        "open",
        "--json",
        "number,headRefName,title,url",
        "--limit",
        "100",
    ]);
    const list = JSON.parse(stdout) as ExistingPr[];
    return list.find((p) => p.title.startsWith(PR_TITLE_PREFIX)) ?? null;
}

/** Create a fresh branch off `origin/<base>` and check it out. */
export function checkoutNewBranchFromBase(branch: string, base: string): void {
    git(["checkout", "-b", branch, `origin/${base}`]);
}

/**
 * Reset an existing remote branch to `origin/<base>` and check it out locally.
 * Used when updating an open PR — the new commit replaces the old one so the
 * PR always reflects a single, current delta against the base.
 */
export function resetBranchToBase(branch: string, base: string): void {
    // Fetch the remote branch in case we don't have it locally yet.
    git(["fetch", "origin", `${branch}:refs/remotes/origin/${branch}`], { allowFailure: true });
    // Delete any stale local copy so we can re-create it at origin/<base>.
    git(["branch", "-D", branch], { allowFailure: true });
    git(["checkout", "-b", branch, `origin/${base}`]);
}

export function commitFiles(files: string[], title: string, body: string): void {
    git(["add", ...files]);
    git(["commit", "-m", title, "-m", body]);
}

/**
 * Make an empty commit. Used for the stability-warning-only PR path, where
 * there's no versions.json diff but a PR still needs to exist as a hook for
 * the warning body + sticky comment.
 */
export function commitEmpty(title: string, body: string): void {
    git(["commit", "--allow-empty", "-m", title, "-m", body]);
}

export function pushBranch(branch: string): void {
    git(["push", "-u", "origin", branch]);
}

/**
 * Force-push a branch, refusing if the remote has diverged from our knowledge
 * of it. Used for the existing-PR update path.
 */
export function forcePushBranch(branch: string): void {
    git(["push", "--force-with-lease", "-u", "origin", branch]);
}

export function openPullRequest(title: string, body: string, base: string): string {
    const res = gh(["pr", "create", "--base", base, "--title", title, "--body", body]);
    return res.stdout.trim();
}

export function updatePullRequest(prNumber: number, title: string, body: string): void {
    gh(["pr", "edit", String(prNumber), "--title", title, "--body", body]);
}

interface IssueComment {
    id: number;
    body: string;
}

function listPrComments(prNumber: number): IssueComment[] {
    // The issues API serves PR comments too. {owner}/{repo} is resolved by
    // `gh api` from the current repo context, so no parsing needed.
    const { stdout } = gh([
        "api",
        "--paginate",
        `repos/{owner}/{repo}/issues/${prNumber}/comments`,
    ]);
    const parsed = JSON.parse(stdout) as Array<{ id: number; body?: string }>;
    return parsed.map((c) => ({ id: c.id, body: c.body ?? "" }));
}

function deleteIssueComment(commentId: number): void {
    gh([
        "api",
        "--method",
        "DELETE",
        `repos/{owner}/{repo}/issues/comments/${commentId}`,
    ]);
}

function patchIssueComment(commentId: number, body: string): void {
    // -F body=@- reads the field value from stdin, which is the only
    // newline-safe way to pass a multi-line body through `gh api`.
    const res = spawnSync(
        "gh",
        [
            "api",
            "--method",
            "PATCH",
            `repos/{owner}/{repo}/issues/comments/${commentId}`,
            "-F",
            "body=@-",
        ],
        {
            cwd: REPO_ROOT,
            input: body,
            encoding: "utf8",
            shell: false,
        },
    );
    if (res.error) throw res.error;
    const code = res.status ?? 1;
    if (code !== 0) {
        const detail = [res.stdout, res.stderr].filter(Boolean).join("\n").trim();
        throw new Error(`gh api PATCH comment failed (exit ${code})${detail ? `:\n${detail}` : ""}`);
    }
}

/**
 * Maintain a single sticky comment on the PR for stability warnings.
 * Identified by STABILITY_COMMENT_MARKER so subsequent runs find and
 * either edit or delete the same comment instead of accumulating duplicates.
 */
export function upsertStabilityComment(prNumber: number, report: StabilityReport): void {
    const existing = listPrComments(prNumber).find((c) =>
        c.body.includes(STABILITY_COMMENT_MARKER),
    );
    if (report.violations.length === 0) {
        if (existing) {
            deleteIssueComment(existing.id);
            console.log(`Stability check passes — removed prior warning comment #${existing.id}.`);
        }
        return;
    }
    const body = `${STABILITY_COMMENT_MARKER}\n\n${renderStabilityMarkdown(report)}`;
    if (existing) {
        patchIssueComment(existing.id, body);
        console.log(`Updated stability warning comment #${existing.id}.`);
    } else {
        gh(["pr", "comment", String(prNumber), "--body", body]);
        console.log(`Posted stability warning comment on PR #${prNumber}.`);
    }
}
