import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { execSync } from "child_process";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { title, description } = body;
  const db = getDb();
  const ws: any = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });

  try {
    // Push branch
    execSync(`git -C ${ws.repo_path} push origin ${ws.branch}`, { stdio: "pipe" });

    // Create PR via gh CLI
    const prTitle = title || `Workspace: ${ws.name}`;
    const prBody = description || `Auto-created from workspace ${ws.name}`;
    const prOutput = execSync(
      `gh pr create --repo $(git -C ${ws.repo_path} remote get-url origin | sed 's/.*[:/]//;s/\.git$//') --head ${ws.branch} --base ${ws.base_branch} --title "${prTitle.replace(/"/g, '\\"')}" --body "${prBody.replace(/"/g, '\\"')}" --json url,number`,
      { stdio: "pipe", encoding: "utf-8", cwd: ws.repo_path }
    );

    const prData = JSON.parse(prOutput);

    db.prepare("UPDATE workspaces SET pr_url = ?, pr_number = ?, updated_at = ? WHERE id = ?")
      .run(prData.url, prData.number, Date.now(), id);

    return NextResponse.json({ pr_url: prData.url, pr_number: prData.number });
  } catch (e: any) {
    return NextResponse.json({ error: `PR creation failed: ${e.message}` }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const ws: any = db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id);
  if (!ws) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (!ws.pr_number) return NextResponse.json({ status: "no_pr" });

  try {
    const status = execSync(
      `gh pr view ${ws.pr_number} --repo $(git -C ${ws.repo_path} remote get-url origin | sed 's/.*[:/]//;s/\.git$//') --json state,mergeable,reviewDecision,statusCheckRollup`,
      { stdio: "pipe", encoding: "utf-8", cwd: ws.repo_path }
    );
    return NextResponse.json(JSON.parse(status));
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
