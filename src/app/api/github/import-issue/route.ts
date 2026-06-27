import { NextRequest, NextResponse } from "next/server";
import { getDb, initTables } from "@/lib/db";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { issue_number, issue_title, repo, created_by } = body;

  if (!issue_number || !issue_title) {
    return NextResponse.json({ error: "issue_number and issue_title required" }, { status: 400 });
  }

  initTables();
  const db = getDb();
  const id = randomUUID();
  const branch = `ws/gh-${issue_number}-${issue_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30)}`;
  const now = Date.now();

  const repoPath = process.env.REPO_PATH || path.join(process.cwd(), "..", "overlord");
  const worktreePath = path.join(repoPath, ".worktrees", branch);

  try {
    execSync(`git -C ${repoPath} worktree add -b ${branch} ${worktreePath} main`, {
      stdio: "pipe",
      cwd: repoPath,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `worktree creation failed: ${e.message}` }, { status: 500 });
  }

  db.prepare(
    "INSERT INTO workspaces (id, name, branch, base_branch, status, created_by, repo_path, worktree_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, issue_title, branch, "main", "active", created_by || null, repoPath, worktreePath, now, now);

  const goalId = randomUUID();
  db.prepare(
    "INSERT INTO goals (id, title, description, status, progress, milestones, workspace_id, github_issue_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(goalId, issue_title, `Imported from GitHub #${issue_number}`, "active", 0, null, id, String(issue_number), now, now);

  return NextResponse.json({ workspace_id: id, goal_id: goalId, branch });
}
