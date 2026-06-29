'use client';

import { useState, useEffect } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { RefreshCw, Filter, MessageSquare, AlertTriangle, ThumbsUp, HelpCircle } from 'lucide-react';

const CLASSIFICATION_STYLES: Record<string, { icon: typeof MessageSquare; color: string; bg: string }> = {
  lead: { icon: ThumbsUp, color: 'text-green-400', bg: 'bg-green-500/10' },
  complaint: { icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10' },
  praise: { icon: ThumbsUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  irrelevant: { icon: HelpCircle, color: 'text-gray-400', bg: 'bg-gray-500/10' },
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

export function ListeningTab() {
  const mentions = useSocialStore((s) => s.mentions);
  const refreshMentions = useSocialStore((s) => s.refreshMentions);
  const verticals = useSocialStore((s) => s.verticals);
  const activeVerticalId = useSocialStore((s) => s.activeVerticalId);
  const setActiveVertical = useSocialStore((s) => s.setActiveVertical);
  const [filterType, setFilterType] = useState<'all' | 'brand' | 'competitor' | 'keyword'>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    await refreshMentions();
    setLoading(false);
  };

  const filtered = mentions.filter((m) => {
    if (activeVerticalId && m.vertical_id !== activeVerticalId) return false;
    if (filterType !== 'all' && m.mention_type !== filterType) return false;
    return true;
  });

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

      {/* Type Filter */}
      <div className="flex gap-1">
        {(['all', 'brand', 'competitor', 'keyword'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-2 py-1 text-[10px] rounded capitalize ${
              filterType === type
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Mention Feed */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-8">
            No mentions found. Connect accounts and add watch terms to start listening.
          </p>
        ) : (
          filtered.slice(0, 30).map((mention) => {
            const style = mention.classification
              ? CLASSIFICATION_STYLES[mention.classification]
              : null;
            const Icon = style?.icon || MessageSquare;

            return (
              <div
                key={mention.id}
                className={`p-3 rounded-lg border border-[var(--border)] ${style?.bg || 'bg-[var(--bg-secondary)]'}`}
              >
                <div className="flex items-start gap-2">
                  <div className="text-sm mt-0.5">{PLATFORM_ICONS[mention.platform] || '💬'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-medium text-[var(--text)]">
                        {mention.author_handle}
                      </span>
                      {style && <Icon className={`w-3 h-3 ${style.color}`} />}
                      <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                        {formatTime(mention.posted_at)}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                      {mention.content}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        mention.mention_type === 'brand' ? 'bg-blue-500/10 text-blue-400' :
                        mention.mention_type === 'competitor' ? 'bg-orange-500/10 text-orange-400' :
                        'bg-purple-500/10 text-purple-400'
                      }`}>
                        {mention.mention_type}
                      </span>
                      {mention.engagement_count > 0 && (
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {mention.engagement_count} engagements
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
