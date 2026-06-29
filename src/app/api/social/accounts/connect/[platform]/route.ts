import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/accounts/connect/[platform] ──────────────────────

type Params = { params: { platform: string } };

export async function POST(req: Request, { params }: Params) {
  const { platform } = params;
  const { account_name } = await req.json();

  // For now, mark as connected directly. Full OAuth flows per-platform can be
  // wired in here later (xurl for X, etc.)
  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    'INSERT INTO social_accounts (id, platform, platform_user_id, account_name, status, last_sync, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, platform, null, account_name || null, 'connected', Date.now(), Date.now());

  revalidatePath('/api/social/accounts');
  return NextResponse.json({ id, platform, status: 'connected' });
}
