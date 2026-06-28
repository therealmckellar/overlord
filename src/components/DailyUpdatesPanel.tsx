'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Sparkles, Wrench, Bug, Megaphone, Check, RefreshCw } from 'lucide-react';

interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix' | 'announcement';
  read: boolean;
}

interface UpdatesResponse {
  entries: ChangelogEntry[];
  unreadCount: number;
  lastUpdated: string;
}

const TYPE_CONFIG = {
  feature: { icon: Sparkles, color: 'text-[var(--accent)]', bg: 'bg-[var(--accent)]/10', label: 'New' },
  improvement: { icon: Wrench, color: 'text-[var(--success)]', bg: 'bg-[var(--success)]/10', label: 'Improved' },
  fix: { icon: Bug, color: 'text-[var(--warning)]', bg: 'bg-[var(--warning)]/10', label: 'Fixed' },
  announcement: { icon: Megaphone, color: 'text-[var(--info)]', bg: 'bg-[var(--info)]/10', label: 'Info' },
};

export function DailyUpdatesPanel() {
  const [data, setData] = useState<UpdatesResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/updates');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const markAsRead = useCallback(async (id: string) => {
    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) =>
          e.id === id ? { ...e, read: true } : e
        ),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      };
    });
    // Persist
    try {
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch {
      // Revert on failure would go here
    }
  }, []);

  const markAllRead = useCallback(async () => {
    if (!data) return;
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.map((e) => ({ ...e, read: true })),
        unreadCount: 0,
      };
    });
    // Mark all unread
    const unread = data.entries.filter((e) => !e.read);
    await Promise.all(
      unread.map((e) =>
        fetch('/api/updates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: e.id }),
        }).catch(() => {})
      )
    );
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] animate-pulse" />
        <p className="text-xs text-[var(--text-muted)]">Loading updates...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
        <Bell className="w-6 h-6 text-[var(--text-muted)]" />
        <p className="text-sm text-[var(--text-secondary)]">Updates unavailable</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Daily Updates</h2>
          {data.unreadCount > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent)] text-white">
              {data.unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {data.unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors"
            >
              <Check className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button
            onClick={loadData}
            className="p-1 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
      </div>

      {/* Live System Banner */}
      <div className="p-3 rounded-lg bg-[var(--accent)]/10 border border-[var(--accent)]/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />
          <span className="text-xs font-medium text-[var(--accent)]">Living System Active</span>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Overlord updates itself daily. New features, model improvements, and skill updates appear here automatically.
        </p>
      </div>

      {/* Changelog Entries */}
      <div className="space-y-3">
        {data.entries.map((entry) => {
          const config = TYPE_CONFIG[entry.type];
          const Icon = config.icon;
          return (
            <div
              key={entry.id}
              className={`p-3 rounded-lg border transition-all ${
                entry.read
                  ? 'bg-[var(--bg-secondary)] border-[var(--border)] opacity-70'
                  : 'bg-[var(--bg-secondary)] border-[var(--accent)]/30 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-md ${config.bg} mt-0.5`}>
                  <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-medium truncate">{entry.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${config.bg} ${config.color} font-medium`}>
                        {config.label}
                      </span>
                      {!entry.read && (
                        <button
                          onClick={() => markAsRead(entry.id)}
                          className="text-[10px] text-[var(--accent)] hover:underline"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {entry.description}
                  </p>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">{entry.date}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center py-2 border-t border-[var(--border)]">
        <p className="text-[10px] text-[var(--text-muted)]">
          Last synced: {new Date(data.lastUpdated).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
