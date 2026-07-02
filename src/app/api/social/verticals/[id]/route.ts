import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const updates = await req.json();
  const db = getDb();

  const existing = db.prepare('SELECT * FROM social_verticals WHERE id = ?').get(id) as any;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const name = updates.name ?? existing.name;
  const description = updates.description ?? existing.description;

  db.prepare('UPDATE social_verticals SET name = ?, description = ? WHERE id = ?').run(name, description, id);
  revalidatePath('/api/social/verticals');
  return NextResponse.json({ id, name, description });
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const db = getDb();

  db.prepare('DELETE FROM social_watch_terms WHERE vertical_id = ?').run(id);
  db.prepare('DELETE FROM social_competitors WHERE vertical_id = ?').run(id);
  db.prepare('DELETE FROM social_verticals WHERE id = ?').run(id);

  revalidatePath('/api/social/verticals');
  return NextResponse.json({ success: true });
}
