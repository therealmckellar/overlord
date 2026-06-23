'use client';

interface SystemHealthProps {
  stats: {
    errorsLast24h: number;
    uptime: number;
  };
}

function formatUptime(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h`;
  return `${hours}h`;
}

export function SystemHealth({ stats }: SystemHealthProps) {
  const health = stats.errorsLast24h > 0 ? 'warning' : 'good';
  const healthColor = health === 'good' ? 'text-[var(--success)]' : 'text-[var(--warning)]';
  const healthLabel = health === 'good' ? 'All Systems Go' : `${stats.errorsLast24h} warnings`;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <h3 className="text-sm font-medium text-[var(--text)] mb-3">System Health</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">Status</span>
          <span className={`text-xs font-medium ${healthColor}`}>{healthLabel}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">Uptime</span>
          <span className="text-xs font-mono text-[var(--text-secondary)]">{formatUptime(stats.uptime)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">Gateway</span>
          <span className="text-xs text-[var(--success)]">Connected</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--text-muted)]">Database</span>
          <span className="text-xs text-[var(--success)]">Online</span>
        </div>
        <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              health === 'good' ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'
            }`}
            style={{ width: health === 'good' ? '100%' : '75%' }}
          />
        </div>
      </div>
    </div>
  );
}
