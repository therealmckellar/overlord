import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = params;
  const db = getDb();
  db.prepare('DELETE FROM social_watch_terms WHERE id = ?').run(id);
  revalidatePath('/api/social/watch-terms');
  return NextResponse.json({ success: true });
}
