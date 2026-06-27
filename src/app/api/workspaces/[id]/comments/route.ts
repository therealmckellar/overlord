import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = getDb();
  const comments = db.prepare("SELECT * FROM workspace_comments WHERE workspace_id = ? ORDER BY created_at DESC").all(id);
  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { file_path, line_number, content, author } = body;

  if (!file_path || !line_number || !content) {
    return NextResponse.json({ error: "file_path, line_number, content required" }, { status: 400 });
  }

  const db = getDb();
  const commentId = randomUUID();
  db.prepare(
    "INSERT INTO workspace_comments (id, workspace_id, file_path, line_number, content, author, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(commentId, id, file_path, line_number, content, author || null, Date.now());

  return NextResponse.json({ id: commentId, workspace_id: id, file_path, line_number, content, author });
}
