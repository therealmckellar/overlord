import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/mentions/refresh (dedicated endpoint) ─────────────

export async function POST() {
  const db = getDb();
  const verticals = db.prepare('SELECT * FROM social_verticals').all() as any[];
  const watchTerms = db.prepare('SELECT * FROM social_watch_terms').all() as any[];
  const competitors = db.prepare('SELECT * FROM social_competitors').all() as any[];

  const now = Date.now();
  const platforms = ['x', 'linkedin', 'reddit'];

  for (const vertical of verticals) {
    const terms = watchTerms.filter((w: any) => w.vertical_id === vertical.id);
    for (const term of terms) {
      for (const platform of platforms) {
        if (Math.random() > 0.5) continue;
        const id = `mention_${vertical.id}_${term.id}_${platform}_${now}_${Math.random().toString(36).slice(2, 6)}`;
        const classifications = ['lead', 'complaint', 'praise', 'irrelevant'];
        const classification = classifications[Math.floor(Math.random() * classifications.length)];

        db.prepare(
          `INSERT OR IGNORE INTO social_mentions
           (id, vertical_id, platform, content, author_handle, author_name, url, mention_type, classification, sentiment_score, engagement_count, tracked_term, posted_at, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id, vertical.id, platform,
          `Someone mentioned "${term.term}" in a post about ${vertical.name}`,
          `@user_${Math.floor(Math.random() * 9999)}`,
          `User ${Math.floor(Math.random() * 9999)}`,
          `https://${platform}.com/post/${id}`,
          'brand',
          classification,
          (Math.random() * 2 - 1),
          Math.floor(Math.random() * 500),
          term.term,
          now - Math.floor(Math.random() * 86400000),
          now
        );
      }
    }

    const verticalCompetitors = competitors.filter((c: any) => c.vertical_id === vertical.id);
    for (const comp of verticalCompetitors) {
      const id = `comp_${comp.id}_${now}_${Math.random().toString(36).slice(2, 6)}`;
      db.prepare(
        `INSERT OR IGNORE INTO social_mentions
         (id, vertical_id, platform, content, author_handle, author_name, url, mention_type, classification, sentiment_score, engagement_count, tracked_term, posted_at, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, vertical.id, comp.platform,
        `${comp.handle} posted something new`,
        comp.handle,
        comp.handle,
        comp.url || `https://${comp.platform}.com/${comp.handle}`,
        'competitor',
        null,
        null,
        Math.floor(Math.random() * 1000),
        comp.handle,
        now - Math.floor(Math.random() * 86400000),
        now
      );
    }
  }

  revalidatePath('/api/social/mentions');
  const mentions = db.prepare('SELECT * FROM social_mentions ORDER BY posted_at DESC LIMIT 50').all();
  return NextResponse.json({ mentions });
}
