import { NextRequest, NextResponse } from "next/server";
import { getDb, initTables } from "@/lib/db";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

export async function GET() {
  initTables();
  const db = getDb();
  const workspaces = db.prepare("SELECT * FROM workspaces ORDER BY created_at DESC").all();
  return NextResponse.json({ workspaces });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, base_branch = "main", created_by } = body;

  if (!name) return NextResponse.json({ error: "name required" }, { status: 400 });

  const db = getDb();
  const id = randomUUID();
  const branch = `ws/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${id.slice(0, 6)}`;
  const now = Date.now();

  // Determine repo path
  const repoPath = process.env.REPO_PATH || path.join(process.cwd(), "..", "overlord");
  const worktreePath = path.join(repoPath, ".worktrees", branch);

  // Create git worktree
  try {
    execSync(`git -C ${repoPath} worktree add -b ${branch} ${worktreePath} ${base_branch}`, {
      stdio: "pipe",
      cwd: repoPath,
    });
  } catch (e: any) {
    return NextResponse.json({ error: `worktree creation failed: ${e.message}` }, { status: 500 });
  }

  db.prepare(
    "INSERT INTO workspaces (id, name, branch, base_branch, status, created_by, repo_path, worktree_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(id, name, branch, base_branch, "active", created_by || null, repoPath, worktreePath, now, now);

  return NextResponse.json({ id, name, branch, base_branch, status: "active", worktree_path: worktreePath });
}
