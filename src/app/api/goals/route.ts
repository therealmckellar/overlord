import { NextRequest, NextResponse } from "next/server";
import { getDb, initTables } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  initTables();
  const db = getDb();
  const goals = db.prepare("SELECT * FROM goals ORDER BY created_at DESC").all();
  // Parse milestones JSON
  const parsed = goals.map((g: any) => ({
    ...g,
    milestones: g.milestones ? JSON.parse(g.milestones) : [],
  }));
  return NextResponse.json({ goals: parsed });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, milestones, workspace_id } = body;

  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const db = getDb();
  const id = randomUUID();
  const now = Date.now();

  db.prepare(
    "INSERT INTO goals (id, title, description, status, progress, milestones, workspace_id, linear_issue_id, github_issue_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
  ).run(
    id, title, description || null, "active", 0,
    milestones ? JSON.stringify(milestones) : null,
    workspace_id || null,
    now, now
  );

  return NextResponse.json({ id, title, description, status: "active", progress: 0, milestones: milestones || [] });
}
