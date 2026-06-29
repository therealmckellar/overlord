import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/watch-terms ───────────────────────────────────────

export async function GET() {
  const db = getDb();
  const terms = db.prepare('SELECT * FROM social_watch_terms ORDER BY weight DESC, created_at DESC').all();
  return NextResponse.json({ watchTerms: terms });
}

export async function POST(req: Request) {
  const { vertical_id, term, term_type, weight, platform } = await req.json();
  if (!vertical_id || !term) return NextResponse.json({ error: 'vertical_id and term required' }, { status: 400 });

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    'INSERT INTO social_watch_terms (id, vertical_id, term, term_type, weight, platform, alert_on_spike, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(id, vertical_id, term, term_type || 'keyword', weight || 1, platform || 'all', 0, Date.now());

  revalidatePath('/api/social/watch-terms');
  return NextResponse.json({ id });
}
