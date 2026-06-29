import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// ─── /api/social/verticals ──────────────────────────────────────────

export async function GET() {
  const db = getDb();
  const verticals = db.prepare('SELECT * FROM social_verticals ORDER BY created_at DESC').all();
  return NextResponse.json({ verticals });
}

export async function POST(req: Request) {
  const { name, description } = await req.json();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare('INSERT INTO social_verticals (id, name, description, created_at) VALUES (?, ?, ?, ?)').run(id, name, description || '', Date.now());

  return NextResponse.json({ id, name, description });
}
