'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUIStore, useSessionStore } from '@/stores';
import { StatsGrid } from './StatsGrid';
import { ActivityTimeline } from './ActivityTimeline';
import { QuickActions } from './QuickActions';
import { SystemHealth } from './SystemHealth';

interface DashboardStats {
  activeSessions: number;
  totalTokens: number;
  costToday: number;
  activeAgents: number;
  uptime: number;
  errorsLast24h: number;
  messagesToday: number;
}

export function Dashboard() {
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const createSession = useSessionStore((s) => s.createSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const [stats, setStats] = useState<DashboardStats>({
    activeSessions: 1,
    totalTokens: 0,
    costToday: 0,
    activeAgents: 1,
    uptime: 0,
    errorsLast24h: 0,
    messagesToday: 0,
  });
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const handleNewChat = useCallback(() => {
    const s = createSession('New Chat');
    setActiveSession(s.id);
  }, [createSession, setActiveSession]);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text)]">Dashboard</h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              System overview at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-[var(--success)]' :
                connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' :
                'bg-[var(--error)]'
              }`}
            />
            <span className="text-[var(--text-secondary)] capitalize">{connectionStatus}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <StatsGrid stats={stats} loading={loading} />

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Quick Actions + System Health */}
          <div className="space-y-6">
            <QuickActions onNewChat={handleNewChat} />
            <SystemHealth stats={stats} />
          </div>

          {/* Right: Activity Timeline (2 cols) */}
          <div className="lg:col-span-2">
            <ActivityTimeline />
          </div>
        </div>

        {/* Sessions Overview */}
        {sessions.length > 0 && (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
            <h3 className="text-sm font-medium text-[var(--text)] mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {sessions.slice(0, 5).map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSession(s.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${
                    s.id === activeSessionId
                      ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                      : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-sm">💬</span>
                    <span className="text-sm truncate text-[var(--text)]">{s.title}</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    {new Date(s.updatedAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
