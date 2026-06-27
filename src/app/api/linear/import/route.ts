import { NextRequest, NextResponse } from "next/server";
import { getDb, initTables } from "@/lib/db";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { issue_id, issue_title, issue_identifier, created_by } = body;

  if (!issue_id || !issue_title) {
    return NextResponse.json({ error: "issue_id and issue_title required" }, { status: 400 });
  }

  initTables();
  const db = getDb();
  const id = randomUUID();
  const branch = `ws/${issue_title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${id.slice(0, 6)}`;
  const now = Date.now();

  // Create worktree
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

  // Create workspace
  db.prepare(
    "INSERT INTO workspaces (id, name, branch, base_branch, status, created_by, repo_path, worktree_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, issue_title, branch, "main", "active", created_by || null, repoPath, worktreePath, now, now);

  // Create linked goal
  const goalId = randomUUID();
  db.prepare(
    "INSERT INTO goals (id, title, description, status, progress, milestones, workspace_id, linear_issue_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(goalId, issue_title, `Imported from Linear ${issue_identifier || issue_id}`, "active", 0, null, id, issue_id, now, now);

  return NextResponse.json({ workspace_id: id, goal_id: goalId, branch });
}
