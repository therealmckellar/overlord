import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/metrics ───────────────────────────────────────────

export async function POST(req: Request) {
  const body = await req.json();
  const { post_id, platform, vertical_id, content_type, title, url, impressions, engagements, likes, shares, comments, clicks, conversions, published_at, source_pipeline_id } = body;

  if (!post_id || !platform || !content_type) {
    return NextResponse.json({ error: 'post_id, platform, content_type required' }, { status: 400 });
  }

  const db = getDb();
  const id = `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  db.prepare(
    `INSERT INTO content_metrics
     (id, post_id, platform, vertical_id, content_type, title, url, impressions, engagements, likes, shares, comments, clicks, conversions, recorded_at, published_at, source_pipeline_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id, post_id, platform, vertical_id || null, content_type, title || null, url || null,
    impressions || 0, engagements || 0, likes || 0, shares || 0, comments || 0, clicks || 0, conversions || 0,
    Date.now(), published_at || null, source_pipeline_id || null
  );

  revalidatePath('/api/social/radar');
  return NextResponse.json({ id });
}
