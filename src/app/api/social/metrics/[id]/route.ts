import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

type Params = { params: { id: string } };

export async function PUT(req: Request, { params }: Params) {
  const { id } = params;
  const updates = await req.json();
  const db = getDb();

  const fields: string[] = [];
  const values: any[] = [];

  for (const [key, val] of Object.entries(updates)) {
    if (['impressions', 'engagements', 'likes', 'shares', 'comments', 'clicks', 'conversions'].includes(key)) {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }

  if (fields.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

  fields.push('recorded_at = ?');
  values.push(Date.now());
  values.push(id);

  db.prepare(`UPDATE content_metrics SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  revalidatePath('/api/social/radar');
  return NextResponse.json({ success: true });
}
