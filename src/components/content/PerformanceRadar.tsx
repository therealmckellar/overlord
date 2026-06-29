'use client';

import { useState, useEffect } from 'react';
import { useContentRadarStore } from '@/stores/contentRadarStore';
import { TrendingUp, Award, RefreshCw, Recycle, BarChart3 } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export function PerformanceRadar() {
  const metrics = useContentRadarStore((s) => s.metrics);
  const refreshRadarData = useContentRadarStore((s) => s.refreshRadarData);
  const getTopPerforming = useContentRadarStore((s) => s.getTopPerforming);
  const getPlatformBreakdown = useContentRadarStore((s) => s.getPlatformBreakdown);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshRadarData();
    setLoading(false);
  };

  const topPerforming = getTopPerforming(undefined, 5);
  const breakdown = getPlatformBreakdown();

  const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
  const totalEngagements = metrics.reduce((sum, m) => sum + m.engagements, 0);
  const avgRate = totalImpressions > 0 ? (totalEngagements / totalImpressions * 100).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text)]">Content Performance Radar</h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
          <div className="text-lg font-bold text-[var(--text)] font-mono">{formatNumber(totalImpressions)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Impressions</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
          <div className="text-lg font-bold text-[var(--text)] font-mono">{formatNumber(totalEngagements)}</div>
          <div className="text-[10px] text-[var(--text-muted)]">Engagements</div>
        </div>
        <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
          <div className="text-lg font-bold text-[var(--accent)] font-mono">{avgRate}%</div>
          <div className="text-[10px] text-[var(--text-muted)]">Avg Rate</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      {Object.keys(breakdown).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">By Platform</h4>
          <div className="space-y-1.5">
            {Object.entries(breakdown).map(([platform, data]) => (
              <div key={platform} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-secondary)]">
                <span className="text-xs font-medium text-[var(--text)] capitalize w-16">{platform}</span>
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)]"
                    style={{ width: `${Math.min(data.avgRate * 100, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-[var(--text-muted)] w-12 text-right">
                  {(data.avgRate * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerforming.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <h4 className="text-xs font-medium text-[var(--text-muted)]">Top Performers</h4>
          </div>
          <div className="space-y-1.5">
            {topPerforming.map((post) => {
              const rate = post.impressions > 0 ? (post.engagements / post.impressions * 100).toFixed(1) : '0';
              return (
                <div key={post.id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-[var(--text)] truncate">{post.title || 'Untitled'}</div>
                    <div className="text-[10px] text-[var(--text-muted)]">{post.platform} · {post.content_type}</div>
                  </div>
                  <span className="text-xs font-mono text-[var(--success)]">{rate}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {metrics.length === 0 && (
        <p className="text-xs text-[var(--text-muted)] text-center py-4">
          No content metrics yet. Published posts will appear here automatically.
        </p>
      )}
    </div>
  );
}

export function ContentRecycler() {
  const getRecyclingSuggestions = useContentRadarStore((s) => s.getRecyclingSuggestions);
  const suggestions = getRecyclingSuggestions();

  if (suggestions.length === 0) return null;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-1.5 mb-2">
        <Recycle className="w-3.5 h-3.5 text-green-400" />
        <h4 className="text-xs font-medium text-[var(--text-muted)]">Recycle Suggestions</h4>
      </div>
      <div className="space-y-1.5">
        {suggestions.slice(0, 3).map((sug) => (
          <div key={sug.id} className="p-2.5 rounded-lg bg-green-500/5 border border-green-500/20">
            <div className="text-xs text-[var(--text)] font-medium truncate">{sug.title}</div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{sug.reason}</div>
            <div className="flex items-center gap-1 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400">
                → {sug.suggestedFormat}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">on {sug.suggestedPlatform}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
