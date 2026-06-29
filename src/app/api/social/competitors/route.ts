import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/competitors ───────────────────────────────────────

export async function GET() {
  const db = getDb();
  const competitors = db.prepare('SELECT * FROM social_competitors ORDER BY created_at DESC').all();
  return NextResponse.json({ competitors });
}

export async function POST(req: Request) {
  const { vertical_id, platform, handle, url } = await req.json();
  if (!vertical_id || !platform || !handle) return NextResponse.json({ error: 'vertical_id, platform, handle required' }, { status: 400 });

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    'INSERT INTO social_competitors (id, vertical_id, platform, handle, url, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, vertical_id, platform, handle, url || null, Date.now());

  revalidatePath('/api/social/competitors');
  return NextResponse.json({ id });
}
