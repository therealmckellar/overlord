'use client';

import { useState, useEffect } from 'react';

interface EventItem {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  source: string;
  message: string;
}

const typeStyles = {
  info: { dot: 'bg-blue-400', text: 'text-blue-400', bg: 'bg-blue-500/10' },
  success: { dot: 'bg-green-400', text: 'text-green-400', bg: 'bg-green-500/10' },
  warning: { dot: 'bg-amber-400', text: 'text-amber-400', bg: 'bg-amber-500/10' },
  error: { dot: 'bg-red-400', text: 'text-red-400', bg: 'bg-red-500/10' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleTimeString();
}

export function ActivityTimeline() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setEvents(data.events || []);
        }
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 h-full">
        <div className="h-4 w-32 bg-[var(--bg-tertiary)] rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-2 h-2 rounded-full bg-[var(--bg-tertiary)]" />
              <div className="flex-1 h-3 bg-[var(--bg-tertiary)] rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-[var(--text)]">Activity</h3>
        <span className="text-xs text-[var(--text-muted)]">{events.length} events</span>
      </div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto">
        {events.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-8">No recent activity</p>
        ) : (
          events.map((event) => {
            const style = typeStyles[event.type];
            return (
              <div
                key={event.id}
                className={`flex items-start gap-3 px-3 py-2 rounded-lg ${style.bg} transition-colors`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--text)] truncate">{event.message}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-medium ${style.text}`}>{event.source}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">·</span>
                    <span className="text-[10px] text-[var(--text-muted)]">{formatTime(event.timestamp)}</span>
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
