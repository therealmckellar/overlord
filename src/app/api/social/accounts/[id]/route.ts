import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM social_accounts WHERE id = ?').run(id);
  revalidatePath('/api/social/accounts');
  return NextResponse.json({ success: true });
}

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const { status } = await req.json();
  const db = getDb();
  db.prepare('UPDATE social_accounts SET status = ? WHERE id = ?').run(status, id);
  revalidatePath('/api/social/accounts');
  return NextResponse.json({ success: true });
}
