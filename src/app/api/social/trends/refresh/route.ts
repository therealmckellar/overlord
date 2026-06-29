import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/trends/refresh (dedicated endpoint) ───────────────

export async function POST() {
  const db = getDb();
  const verticals = db.prepare('SELECT * FROM social_verticals').all() as any[];
  const watchTerms = db.prepare('SELECT * FROM social_watch_terms').all() as any[];

  const now = Date.now();
  const platforms = ['x', 'linkedin', 'reddit'];

  for (const vertical of verticals) {
    const terms = watchTerms.filter((w: any) => w.vertical_id === vertical.id);
    for (const term of terms) {
      for (const platform of platforms) {
        const id = `${vertical.id}_${term.id}_${platform}`;
        const velocityScore = Math.random() * 100;
        const velocity = velocityScore > 66 ? 'rising' : velocityScore > 33 ? 'steady' : 'cooling';

        db.prepare(
          `INSERT OR REPLACE INTO social_trends
           (id, vertical_id, platform, topic, volume, velocity, velocity_score, snippet, url, sentiment_score, trending_at, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(id, vertical.id, platform, term.term, Math.floor(Math.random() * 10000), velocity, velocityScore, `Trending in ${vertical.name}`, null, (Math.random() * 2 - 1), now, now);
      }
    }
  }

  revalidatePath('/api/social/trends');
  const trends = db.prepare('SELECT * FROM social_trends ORDER BY velocity_score DESC LIMIT 50').all();
  return NextResponse.json({ trends });
}
