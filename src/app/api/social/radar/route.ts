import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// ─── /api/social/radar ─────────────────────────────────────────────

export async function GET() {
  const db = getDb();

  // Get all metrics
  const metrics = db.prepare('SELECT * FROM content_metrics ORDER BY recorded_at DESC LIMIT 100').all();

  // Platform breakdown
  const platformRows = db.prepare(`
    SELECT platform, COUNT(*) as posts, SUM(engagements) as engagements, SUM(impressions) as impressions
    FROM content_metrics GROUP BY platform
  `).all() as any[];

  const platformBreakdown: Record<string, { posts: number; engagements: number; avgRate: number }> = {};
  for (const row of platformRows) {
    platformBreakdown[row.platform] = {
      posts: row.posts,
      engagements: row.engagements,
      avgRate: row.impressions > 0 ? row.engagements / row.impressions : 0,
    };
  }

  // Top performers (by engagement rate)
  const topPerformers = db.prepare(`
    SELECT *, CASE WHEN impressions > 0 THEN CAST(engagements AS REAL) / impressions ELSE 0 END as engagement_rate
    FROM content_metrics ORDER BY engagement_rate DESC LIMIT 10
  `).all();

  // Evergreen posts (90+ days old, >5% engagement rate)
  const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
  const evergreen = db.prepare(`
    SELECT *, CASE WHEN impressions > 0 THEN CAST(engagements AS REAL) / impressions ELSE 0 END as engagement_rate
    FROM content_metrics
    WHERE published_at < ? AND impressions > 0 AND (CAST(engagements AS REAL) / impressions) > 0.05
    ORDER BY engagement_rate DESC LIMIT 10
  `).all(threeMonthsAgo);

  return NextResponse.json({ metrics, platformBreakdown, topPerformers, evergreen });
}
