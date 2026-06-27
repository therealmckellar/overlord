import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { execSync } from "child_process";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ws: any = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!ws.pr_number) return NextResponse.json({ error: "no PR to merge" }, { status: 400 });

  try {
    const repoSlug = execSync(
      `git -C ${ws.repo_path} remote get-url origin | sed 's/.*[:/]//;s/\.git$//'`,
      { encoding: "utf-8" }
    ).trim();

    execSync(
      `gh pr merge ${ws.pr_number} --repo ${repoSlug} --squash --delete-branch`,
      { stdio: "pipe", cwd: ws.repo_path }
    );

    // Remove worktree
    try {
      execSync(`git -C ${ws.repo_path} worktree remove ${ws.worktree_path} --force`, { stdio: "pipe" });
    } catch {}

    db.prepare("UPDATE workspaces SET status = ?, updated_at = ? WHERE id = ?")
      .run("merged", Date.now(), id);

    return NextResponse.json({ success: true, status: "merged" });
  } catch (e: any) {
    return NextResponse.json({ error: `merge failed: ${e.message}` }, { status: 500 });
  }
}
