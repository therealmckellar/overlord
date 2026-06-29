import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/accounts ──────────────────────────────────────────

export async function GET() {
  const db = getDb();
  const accounts = db.prepare('SELECT id, platform, platform_user_id, account_name, status, last_sync, created_at FROM social_accounts ORDER BY created_at DESC').all();
  return NextResponse.json({ accounts });
}

export async function POST(req: Request) {
  const { platform, account_name } = await req.json();
  if (!platform) return NextResponse.json({ error: 'platform required' }, { status: 400 });

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    'INSERT INTO social_accounts (id, platform, platform_user_id, account_name, status, last_sync, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, platform, null, account_name || null, 'disconnected', null, Date.now());

  revalidatePath('/api/social/accounts');
  return NextResponse.json({ id, platform, status: 'disconnected' });
}
