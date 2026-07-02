import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/accounts/connect/[platform] ──────────────────────

type Params = { params: Promise<{ platform: string }> };

export async function POST(req: Request, { params }: Params) {
  const { platform } = await params;
  const { account_name, platform_user_id, access_token } = await req.json();

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    `INSERT INTO social_accounts 
     (id, platform, platform_user_id, account_name, access_token, status, last_sync, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, 
    platform, 
    platform_user_id || null, 
    account_name || null, 
    access_token || null, 
    'connected', 
    Date.now(), 
    Date.now()
  );

  revalidatePath('/api/social/accounts');
  return NextResponse.json({ id, platform, status: 'connected' });
}
