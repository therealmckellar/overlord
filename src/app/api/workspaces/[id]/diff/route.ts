import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { execSync } from "child_process";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ws: any = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    // Get diff between worktree branch and base
    const diffOutput = execSync(
      `git -C ${ws.repo_path} diff ${ws.base_branch}...${ws.branch} --stat`,
      { stdio: "pipe", encoding: "utf-8" }
    );

    // Get file-level diffs
    const rawDiff = execSync(
      `git -C ${ws.repo_path} diff ${ws.base_branch}...${ws.branch} --unified=3`,
      { stdio: "pipe", encoding: "utf-8" }
    );

    // Parse into structured format
    const files: { path: string; additions: number; deletions: number; diff: string }[] = [];
    const fileBlocks = rawDiff.split(/^diff --git /m).filter(Boolean);

    for (const block of fileBlocks) {
      const lines = block.split("\n");
      const headerMatch = lines[0]?.match(/a\/(.+)\s+b\/(.+)/);
      if (!headerMatch) continue;
      const filePath = headerMatch[1];
      let additions = 0;
      let deletions = 0;
      for (const line of lines) {
        if (line.startsWith("+") && !line.startsWith("+++")) additions++;
        if (line.startsWith("-") && !line.startsWith("---")) deletions++;
      }
      files.push({ path: filePath, additions, deletions, diff: block });
    }

    return NextResponse.json({ stat: diffOutput, files });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
