import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { execSync } from "child_process";
import path from "path";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ws = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });
  const comments = db.prepare("SELECT * FROM workspace_comments WHERE workspace_id = ? ORDER BY created_at DESC").all(id);
  return NextResponse.json({ workspace: ws, comments });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const ws = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });

  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (["name", "status", "pr_url", "pr_number"].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: "no valid fields" }, { status: 400 });

  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE workspaces SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  const updated = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  return NextResponse.json({ workspace: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ws: any = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });

  // Remove worktree
  if (ws.worktree_path && ws.repo_path) {
    try {
      execSync(`git -C ${ws.repo_path} worktree remove ${ws.worktree_path} --force`, { stdio: "pipe" });
      // Delete branch
      execSync(`git -C ${ws.repo_path} branch -D ${ws.branch}`, { stdio: "pipe" });
    } catch (e) {
      // ignore cleanup errors
    }
  }

  db.prepare("DELETE FROM workspace_comments WHERE workspace_id = ?").run(id);
  db.prepare("DELETE FROM workspaces WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
