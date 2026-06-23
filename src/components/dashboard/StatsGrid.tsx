'use client';

import { ReactNode } from 'react';

interface StatsGridProps {
  stats: {
    activeSessions: number;
    totalTokens: number;
    costToday: number;
    activeAgents: number;
    uptime: number;
    errorsLast24h: number;
    messagesToday: number;
  };
  loading: boolean;
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red';
  subtitle?: string;
}

function StatCard({ title, value, icon, color = 'blue', subtitle }: StatCardProps) {
  const colorMap = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    red: 'border-red-500/20 bg-red-500/5',
  };
  const iconColorMap = {
    blue: 'text-blue-400',
    green: 'text-green-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--text-muted)]">{title}</span>
        <div className={`w-5 h-5 ${iconColorMap[color]}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-[var(--text)] font-mono">{value}</div>
      {subtitle && (
        <div className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</div>
      )}
    </div>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 3h12a1 1 0 011 1v7a1 1 0 01-1 1H5l-3 2V4a1 1 0 011-1z" />
      <path d="M5 7h6M5 9.5h3" />
    </svg>
  );
}

function AgentIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
    </svg>
  );
}

function TokenIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 4v8M5 6h6M5 10h6" />
    </svg>
  );
}

function CostIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6" />
      <path d="M8 3.5V5M8 11v1.5M10.5 6.5C10.5 5.4 9.4 4.5 8 4.5S5.5 5.4 5.5 6.5c0 1.1 1.1 2 2.5 2s2.5.9 2.5 2c0 1.1-1.1 2-2.5 2s-2.5-.9-2.5-2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="8" cy="8" r="6.5" />
      <path d="M8 4v4l2.5 2.5" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M8 1.5L1 14h14L8 1.5z" />
      <path d="M8 6v4M8 12h.01" />
    </svg>
  );
}

export function StatsGrid({ stats, loading }: StatsGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-[var(--border)] p-4 animate-pulse">
            <div className="h-3 w-20 bg-[var(--bg-tertiary)] rounded mb-3" />
            <div className="h-6 w-12 bg-[var(--bg-tertiary)] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <StatCard
        title="Active Sessions"
        value={stats.activeSessions}
        icon={<ChatIcon />}
        color="blue"
        subtitle="Currently open"
      />
      <StatCard
        title="Active Agents"
        value={stats.activeAgents}
        icon={<AgentIcon />}
        color="green"
        subtitle="Running now"
      />
      <StatCard
        title="Tokens Used"
        value={formatTokens(stats.totalTokens)}
        icon={<TokenIcon />}
        color="purple"
        subtitle="Total processed"
      />
      <StatCard
        title="Cost Today"
        value={`$${stats.costToday.toFixed(2)}`}
        icon={<CostIcon />}
        color="amber"
        subtitle="Estimated"
      />
      <StatCard
        title="Uptime"
        value={formatUptime(stats.uptime)}
        icon={<ClockIcon />}
        color={stats.errorsLast24h > 0 ? 'red' : 'green'}
        subtitle={stats.errorsLast24h > 0 ? `${stats.errorsLast24h} errors` : 'No errors'}
      />
    </div>
  );
}
