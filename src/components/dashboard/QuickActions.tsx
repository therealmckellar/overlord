'use client';

interface QuickActionsProps {
  onNewChat: () => void;
}

export function QuickActions({ onNewChat }: QuickActionsProps) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-4">
      <h3 className="text-sm font-medium text-[var(--text)] mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors text-left"
        >
          <span className="text-base">💬</span>
          <div>
            <div className="text-xs font-medium text-[var(--text)]">New Chat</div>
            <div className="text-[10px] text-[var(--text-muted)]">Start fresh</div>
          </div>
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors text-left"
        >
          <span className="text-base">⚡</span>
          <div>
            <div className="text-xs font-medium text-[var(--text)]">Pipeline</div>
            <div className="text-[10px] text-[var(--text-muted)]">Idea → Build</div>
          </div>
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors text-left"
        >
          <span className="text-base">🧠</span>
          <div>
            <div className="text-xs font-medium text-[var(--text)]">Memory</div>
            <div className="text-[10px] text-[var(--text-muted)]">Knowledge base</div>
          </div>
        </button>
        <button
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/30 hover:bg-[var(--accent)]/5 transition-colors text-left"
        >
          <span className="text-base">📊</span>
          <div>
            <div className="text-xs font-medium text-[var(--text)]">Research</div>
            <div className="text-[10px] text-[var(--text-muted)]">Multi-format</div>
          </div>
        </button>
      </div>
    </div>
  );
}
