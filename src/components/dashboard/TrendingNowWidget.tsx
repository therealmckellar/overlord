'use client';

import { useState, useEffect } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { TrendingUp, Minus, TrendingDown, Zap, ChevronRight } from 'lucide-react';

const VELOCITY_ICONS = {
  rising: TrendingUp,
  steady: Minus,
  cooling: TrendingDown,
};

const VELOCITY_COLORS = {
  rising: 'text-red-400',
  steady: 'text-yellow-400',
  cooling: 'text-blue-400',
};

const VELOCITY_BG = {
  rising: 'bg-red-500/10',
  steady: 'bg-yellow-500/10',
  cooling: 'bg-blue-500/10',
};

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏',
  linkedin: 'in',
  reddit: '🤖',
  instagram: '📷',
  tiktok: '♪',
};

export function TrendingNowWidget() {
  const trends = useSocialStore((s) => s.trends);
  const refreshTrends = useSocialStore((s) => s.refreshTrends);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await refreshTrends();
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, [refreshTrends]);

  const topTrends = trends
    .sort((a, b) => b.velocity_score - a.velocity_score)
    .slice(0, 5);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
        <div className="h-4 w-24 bg-[var(--bg-tertiary)] rounded animate-pulse mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-3 h-3 rounded bg-[var(--bg-tertiary)]" />
              <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-[var(--accent)]" />
          <h3 className="text-sm font-medium text-[var(--text)]">Trending Now</h3>
        </div>
        <span className="text-[10px] text-[var(--text-muted)]">{topTrends.length} topics</span>
      </div>

      {topTrends.length === 0 ? (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">
          Add verticals to see trending topics
        </p>
      ) : (
        <div className="space-y-1.5">
          {topTrends.map((trend) => {
            const VelocityIcon = VELOCITY_ICONS[trend.velocity];
            const color = VELOCITY_COLORS[trend.velocity];
            const bg = VELOCITY_BG[trend.velocity];

            return (
              <div
                key={trend.id}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
              >
                <span className="text-xs">{PLATFORM_ICONS[trend.platform] || '💬'}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-[var(--text)] truncate block">{trend.topic}</span>
                </div>
                <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${bg}`}>
                  <VelocityIcon className={`w-3 h-3 ${color}`} />
                </div>
                <ChevronRight className="w-3 h-3 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
