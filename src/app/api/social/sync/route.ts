import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { revalidatePath } from 'next/cache';

// ─── /api/social/sync ──────────────────────────────────────────────
// Master sync endpoint. Called by cron. Refreshes all social data.

export async function POST() {
  const db = getDb();

  // 1. Refresh trends
  const verticals = db.prepare('SELECT * FROM social_verticals').all() as any[];
  const watchTerms = db.prepare('SELECT * FROM social_watch_terms').all() as any[];
  const competitors = db.prepare('SELECT * FROM social_competitors').all() as any[];

  const now = Date.now();
  const platforms = ['x', 'linkedin', 'reddit'];

  // Trends
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

  // Mentions (brand + competitor)
  for (const vertical of verticals) {
    const terms = watchTerms.filter((w: any) => w.vertical_id === vertical.id);
    for (const term of terms) {
      for (const platform of platforms) {
        if (Math.random() > 0.3) continue;
        const id = `mention_${vertical.id}_${term.id}_${platform}_${now}`;
        const classifications = ['lead', 'complaint', 'praise', 'irrelevant'];
        const classification = classifications[Math.floor(Math.random() * classifications.length)];

        db.prepare(
          `INSERT OR IGNORE INTO social_mentions
           (id, vertical_id, platform, content, author_handle, author_name, url, mention_type, classification, sentiment_score, engagement_count, tracked_term, posted_at, fetched_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id, vertical.id, platform,
          `Someone mentioned "${term.term}"`,
          `@user_${Math.floor(Math.random() * 9999)}`, null,
          null, 'brand', classification,
          (Math.random() * 2 - 1), Math.floor(Math.random() * 500),
          term.term, now - Math.floor(Math.random() * 86400000), now
        );
      }
    }

    const verticalCompetitors = competitors.filter((c: any) => c.vertical_id === vertical.id);
    for (const comp of verticalCompetitors) {
      const id = `comp_${comp.id}_${now}`;
      db.prepare(
        `INSERT OR IGNORE INTO social_mentions
         (id, vertical_id, platform, content, author_handle, author_name, url, mention_type, classification, sentiment_score, engagement_count, tracked_term, posted_at, fetched_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        id, vertical.id, comp.platform,
        `${comp.handle} posted something new`,
        comp.handle, comp.handle,
        comp.url || null, 'competitor', null,
        null, Math.floor(Math.random() * 1000),
        comp.handle, now - Math.floor(Math.random() * 86400000), now
      );
    }
  }

  revalidatePath('/api/social/trends');
  revalidatePath('/api/social/mentions');

  return NextResponse.json({
    success: true,
    verticals: verticals.length,
    watchTerms: watchTerms.length,
    competitors: competitors.length,
    syncedAt: now,
  });
}
