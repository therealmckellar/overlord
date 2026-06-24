'use client';

import { useState, useEffect } from 'react';
import { useUIStore, useSessionStore } from '@/stores';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  panel: string;
}

const navGroups = [
  {
    id: 'core',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '📊', panel: 'dashboard' },
      { id: 'chat', label: 'Chat', icon: '💬', panel: 'chat' },
      { id: 'pipeline', label: 'Pipeline', icon: '⚡', panel: 'pipeline' },
    ],
  },
  {
    id: 'observe',
    label: 'OBSERVE',
    items: [
      { id: 'memory', label: 'Memory', icon: '🧠', panel: 'memory' },
      { id: 'loop', label: 'Loops', icon: '🔄', panel: 'loop' },
      { id: 'studio', label: 'Studio', icon: '🎨', panel: 'studio' },
    ],
  },
  {
    id: 'automate',
    label: 'AUTOMATE',
    items: [
      { id: 'research', label: 'Research', icon: '📊', panel: 'research' },
      { id: 'substack', label: 'Content', icon: '✨', panel: 'substack' },
    ],
  },
  {
    id: 'jarvis',
    label: 'JARVIS',
    items: [
      { id: 'jarvis', label: 'Voice Agent', icon: '🎙️', panel: 'jarvis' },
    ],
  },
];

export function Sidebar({ activePanel, onNavigate }: { activePanel: string; onNavigate: (panel: string) => void }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);

  const [systemStats, setSystemStats] = useState({ sessions: 0, memory: '' });

  useEffect(() => {
    setSystemStats({
      sessions: sessions.length,
      memory: `${Math.round(Math.random() * 30 + 40)}%`,
    });
  }, [sessions.length]);

  return (
    <aside
      className={`
        shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]
        transition-[width] duration-200 ease
        ${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border)] shrink-0">
        <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
          <span className="text-white font-bold text-xs">O</span>
        </div>
        <span className="font-semibold text-sm">Overlord</span>
        <span className="ml-auto text-[10px] text-[var(--text-muted)] font-mono">v0.1</span>
      </div>

      {/* System Stats */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[var(--text-muted)]">Sessions</span>
          <span className="text-[var(--text-secondary)] font-mono">{systemStats.sessions}</span>
        </div>
        <div className="flex items-center justify-between text-xs mt-1">
          <span className="text-[var(--text-muted)]">Memory</span>
          <span className="text-[var(--text-secondary)] font-mono">{systemStats.memory}</span>
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              connectionStatus === 'connected' ? 'bg-[var(--success)]' :
              connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' :
              'bg-[var(--error)]'
            }`}
          />
          <span className="text-[10px] text-[var(--text-muted)] capitalize">{connectionStatus}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.id}>
            {group.label && (
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 px-1">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.panel)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                    transition-colors duration-150
                    ${activePanel === item.panel
                      ? 'bg-[var(--accent)] text-white'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]'
                    }
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Active Sessions List */}
      {sessions.length > 0 && (
        <div className="px-3 py-2 border-t border-[var(--border)] max-h-[180px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 px-1">
            Recent
          </p>
          {sessions.slice(0, 4).map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSession(s.id); onNavigate('chat'); }}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs truncate transition-colors ${
                s.id === activeSessionId
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span>💬</span>
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Theme Switcher */}
      <div className="p-3 border-t border-[var(--border)]">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
          Theme
        </p>
        <ThemeSwitcher />
      </div>
    </aside>
  );
}

function ThemeSwitcher() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const themes = [
    { id: 'dark', color: '#6366f1' },
    { id: 'light', color: '#6366f1' },
    { id: 'midnight', color: '#8b5cf6' },
    { id: 'forest', color: '#34d399' },
    { id: 'arctic', color: '#0ea5e9' },
  ];

  return (
    <div className="flex gap-1.5">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as any)}
          className={`
            w-7 h-7 rounded-full border-2 flex items-center justify-center
            transition-all duration-150
            ${theme === t.id ? 'border-white scale-110' : 'border-transparent hover:border-[var(--border)]'}
          `}
          style={{ backgroundColor: t.color }}
          title={t.id}
        >
          {theme === t.id && <span className="text-white text-[10px]">✓</span>}
        </button>
      ))}
    </div>
  );
}
