'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Zap, ArrowRight } from 'lucide-react';

const PLATFORM_META: Record<string, { icon: string; label: string; color: string }> = {
  x:         { icon: '𝕏',  label: 'X',         color: 'bg-neutral-800' },
  linkedin:  { icon: 'in', label: 'LinkedIn',   color: 'bg-blue-700/50' },
  instagram: { icon: '📷', label: 'Instagram',  color: 'bg-pink-600/30' },
  facebook:  { icon: 'f',  label: 'Facebook',   color: 'bg-blue-600/30' },
  tiktok:    { icon: '♪',  label: 'TikTok',     color: 'bg-red-600/30'  },
  youtube:   { icon: '▶',  label: 'YouTube',    color: 'bg-red-700/30'  },
  reddit:    { icon: '🤖', label: 'Reddit',     color: 'bg-orange-600/30'},
};

const VELOCITY_ICON = {
  rising:  TrendingUp,
  steady:  Minus,
  cooling: TrendingDown,
};

const VELOCITY_COLOR = {
  rising:  'text-emerald-400',
  steady:  'text-amber-400',
  cooling: 'text-blue-400',
};

interface TrendingWidgetProps {
  /** Callback to navigate the user to the Social tab */
  onOpenSocial?: () => void;
}

export function TrendingWidget({ onOpenSocial }: TrendingWidgetProps) {
  const accounts      = useSocialStore((s) => s.accounts);
  const trends        = useSocialStore((s) => s.trends);
  const verticals     = useSocialStore((s) => s.verticals);
  const refreshTrends = useSocialStore((s) => s.refreshTrends);
  const getTopTrends  = useSocialStore((s) => s.getTopTrends);
  const syncAccounts  = useSocialStore((s) => s.syncAccounts);

  const [loading, setLoading] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const connectedAccounts = accounts.filter((a) => a.status === 'connected');

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    try {
      await refreshTrends();
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  }, [refreshTrends]);

  useEffect(() => {
    syncAccounts();
    if (trends.length === 0) {
      handleRefresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Top 8 trends across all verticals, sorted by velocity_score desc
  const topTrends = getTopTrends(8);

  // Group those top trends by platform for display
  const byPlatform: Record<string, typeof topTrends> = {};
  for (const t of topTrends) {
    if (!byPlatform[t.platform]) byPlatform[t.platform] = [];
    byPlatform[t.platform].push(t);
  }

  const platformKeys = Object.keys(byPlatform);

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-semibold text-[var(--text)]">What's Trending</span>
          {verticals.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] font-medium">
              {verticals.length} vertical{verticals.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {lastRefreshed && (
            <span className="text-[10px] text-[var(--text-muted)]">
              {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh trends"
            className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Connected Accounts Bar */}
      <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2 flex-wrap min-h-[36px]">
        {connectedAccounts.length === 0 ? (
          <span className="text-[10px] text-[var(--text-muted)]">No accounts connected</span>
        ) : (
          connectedAccounts.map((acct) => {
            const meta = PLATFORM_META[acct.platform];
            return (
              <span
                key={acct.id}
                title={meta?.label ?? acct.platform}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium text-[var(--text)] border border-[var(--border)] ${meta?.color ?? 'bg-[var(--bg-secondary)]'}`}
              >
                <span className="text-[11px] leading-none">{meta?.icon ?? acct.platform[0].toUpperCase()}</span>
                <span>{acct.account_name ?? meta?.label ?? acct.platform}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
              </span>
            );
          })
        )}
        {onOpenSocial && (
          <button
            onClick={onOpenSocial}
            className="ml-auto flex items-center gap-1 text-[10px] text-[var(--accent)] hover:opacity-80 transition-opacity shrink-0"
          >
            Manage <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Trend List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {topTrends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-6 text-center">
            <Zap className="w-7 h-7 text-[var(--text-muted)] opacity-30" />
            <p className="text-xs text-[var(--text-muted)] max-w-[180px]">
              {connectedAccounts.length === 0
                ? 'Connect a social account to start tracking what\'s trending.'
                : 'No trends yet. Add verticals and watch terms, then refresh.'}
            </p>
            {onOpenSocial && (
              <button
                onClick={onOpenSocial}
                className="flex items-center gap-1 px-3 py-1.5 text-[10px] rounded-lg bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
              >
                Open Social <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          platformKeys.map((platform) => {
            const meta = PLATFORM_META[platform];
            const platformTrends = byPlatform[platform];
            return (
              <div key={platform}>
                {/* Platform header */}
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="text-sm leading-none">{meta?.icon ?? '💬'}</span>
                  <span className="text-[11px] font-semibold text-[var(--text)] capitalize">{meta?.label ?? platform}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">· {platformTrends.length}</span>
                </div>
                <div className="space-y-1">
                  {platformTrends.map((trend, idx) => {
                    const VIcon   = VELOCITY_ICON[trend.velocity];
                    const vColor  = VELOCITY_COLOR[trend.velocity];
                    return (
                      <div
                        key={trend.id}
                        className="group flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-transparent hover:border-[var(--accent)]/30 hover:bg-[var(--bg-secondary)] transition-all cursor-default"
                      >
                        <span className="text-[10px] font-mono text-[var(--text-muted)] w-4 text-right shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-[var(--text)] truncate">{trend.topic}</div>
                          {trend.snippet && (
                            <div className="text-[10px] text-[var(--text-muted)] truncate">{trend.snippet}</div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {trend.volume != null && (
                            <span className="text-[10px] text-[var(--text-muted)]">
                              {trend.volume >= 1000
                                ? `${(trend.volume / 1000).toFixed(1)}K`
                                : trend.volume}
                            </span>
                          )}
                          <VIcon className={`w-3 h-3 ${vColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
