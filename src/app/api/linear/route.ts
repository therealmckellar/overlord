import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  const db = getDb();
  const token: any = db.prepare("SELECT * FROM linear_tokens LIMIT 1").get();
  if (!token) return NextResponse.json({ connected: false });

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token.api_key,
      },
      body: JSON.stringify({
        query: `{ issues(first: 50) { nodes { id title identifier state { name } team { name } assignee { name } priority } } }`,
      }),
    });
    const data = await res.json();
    if (!data.data) return NextResponse.json({ connected: false, error: data });
    return NextResponse.json({ connected: true, issues: data.data.issues.nodes });
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { api_key } = body;
  if (!api_key) return NextResponse.json({ error: "api_key required" }, { status: 400 });

  const db = getDb();
  const id = randomUUID();
  db.prepare("INSERT OR REPLACE INTO linear_tokens (id, api_key, created_at) VALUES (?, ?, ?)").run(id, api_key, Date.now());
  return NextResponse.json({ success: true });
}
