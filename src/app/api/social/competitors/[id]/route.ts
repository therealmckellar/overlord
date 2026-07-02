import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = getDb();
  db.prepare('DELETE FROM social_competitors WHERE id = ?').run(id);
  revalidatePath('/api/social/competitors');
  return NextResponse.json({ success: true });
}
