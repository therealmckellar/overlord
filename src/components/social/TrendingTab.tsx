'use client';

import { useState, useEffect } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { RefreshCw, TrendingUp, Minus, TrendingDown, Zap } from 'lucide-react';

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

const PLATFORM_ICONS: Record<string, string> = {
  x: '𝕏',
  linkedin: 'in',
  instagram: '📷',
  facebook: 'f',
  tiktok: '♪',
  youtube: '▶',
  reddit: '🤖',
};

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

export function TrendingTab() {
  const trends = useSocialStore((s) => s.trends);
  const refreshTrends = useSocialStore((s) => s.refreshTrends);
  const verticals = useSocialStore((s) => s.verticals);
  const activeVerticalId = useSocialStore((s) => s.activeVerticalId);
  const setActiveVertical = useSocialStore((s) => s.setActiveVertical);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshTrends();
    setLoading(false);
  };

  const filtered = activeVerticalId
    ? trends.filter((t) => t.vertical_id === activeVerticalId)
    : trends;

  // Group by platform
  const byPlatform: Record<string, typeof trends> = {};
  for (const t of filtered) {
    if (!byPlatform[t.platform]) byPlatform[t.platform] = [];
    byPlatform[t.platform].push(t);
  }

  return (
    <div className="p-4 space-y-4">
      {/* Controls */}
      <div className="flex items-center gap-2">
        <select
          value={activeVerticalId || ''}
          onChange={(e) => setActiveVertical(e.target.value || null)}
          className="flex-1 px-2 py-1.5 text-xs rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] outline-none"
        >
          <option value="">All Verticals</option>
          {verticals.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Trending by Platform */}
      {Object.keys(byPlatform).length === 0 ? (
        <div className="text-center py-8">
          <Zap className="w-8 h-8 mx-auto mb-3 opacity-30 text-[var(--text-muted)]" />
          <p className="text-xs text-[var(--text-muted)]">
            No trending data yet. Add verticals and watch terms, then refresh.
          </p>
        </div>
      ) : (
        Object.entries(byPlatform).map(([platform, platformTrends]) => (
          <div key={platform}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">{PLATFORM_ICONS[platform] || '💬'}</span>
              <span className="text-xs font-medium text-[var(--text)] capitalize">{platform}</span>
              <span className="text-[10px] text-[var(--text-muted)]">{platformTrends.length} topics</span>
            </div>
            <div className="space-y-1.5">
              {platformTrends.slice(0, 10).map((trend, i) => {
                const VelocityIcon = VELOCITY_ICONS[trend.velocity];
                const velocityColor = VELOCITY_COLORS[trend.velocity];

                return (
                  <div
                    key={trend.id}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors cursor-pointer"
                  >
                    <span className="text-[10px] font-mono text-[var(--text-muted)] w-4 text-right">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text)] truncate">
                        {trend.topic}
                      </div>
                      {trend.snippet && (
                        <p className="text-[10px] text-[var(--text-muted)] truncate">{trend.snippet}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {trend.volume && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {(trend.volume / 1000).toFixed(1)}K
                        </span>
                      )}
                      <VelocityIcon className={`w-3.5 h-3.5 ${velocityColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
