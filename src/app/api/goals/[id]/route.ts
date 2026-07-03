import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id) as any;
  if (!goal) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ goal: { ...goal, milestones: goal.milestones ? JSON.parse(goal.milestones) : [] } });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const db = getDb();

  const goal = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
  if (!goal) return NextResponse.json({ error: "not found" }, { status: 404 });

  const fields: string[] = [];
  const values: any[] = [];
  for (const [key, val] of Object.entries(body)) {
    if (["title", "description", "status", "progress", "workspace_id"].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
    if (key === "milestones") {
      fields.push("milestones = ?");
      values.push(JSON.stringify(val));
    }
  }
  if (fields.length === 0) return NextResponse.json({ error: "no valid fields" }, { status: 400 });

  fields.push("updated_at = ?");
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE goals SET ${fields.join(", ")} WHERE id = ?`).run(...values);
  const updated: any = db.prepare("SELECT * FROM goals WHERE id = ?").get(id);
  return NextResponse.json({ goal: { ...updated, milestones: updated.milestones ? JSON.parse(updated.milestones) : [] } });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  db.prepare("DELETE FROM goals WHERE id = ?").run(id);
  return NextResponse.json({ success: true });
}
