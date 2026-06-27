'use client';

import { useState, useEffect } from 'react';
import { useUIStore, useSessionStore } from '@/stores';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';

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
      { id: 'designer', label: 'Designer', icon: '🧬', panel: 'designer' },
      { id: 'spaces', label: 'Spaces', icon: '📁', panel: 'spaces' },
    ],
  },
  {
    id: 'operate',
    label: 'OPERATE',
    items: [
      { id: 'mission', label: 'Mission Control', icon: '🛸', panel: 'mission' },
      { id: 'taskboard', label: 'Task Board', icon: '📋', panel: 'taskboard' },
      { id: 'deploy', label: 'Deployments', icon: '🚀', panel: 'deploy' },
      { id: 'loop', label: 'Loops', icon: '🔄', panel: 'loop' },
      { id: 'goals', label: 'Goals', icon: '🎯', panel: 'goals' },
      { id: 'workspaces', label: 'Workspaces', icon: '🌳', panel: 'workspaces' },
    ],
  },
  {
    id: 'observe',
    label: 'OBSERVE',
    items: [
      { id: 'memory', label: 'Memory', icon: '🧠', panel: 'memory' },
      { id: 'devtools', label: 'DevTools', icon: '🛠️', panel: 'devtools' },
      { id: 'skills', label: 'Skills', icon: '⚡', panel: 'skills' },
      { id: 'session', label: 'Sessions', icon: '💬', panel: 'session' },
    ],
  },
  {
    id: 'insight',
    label: 'INSIGHT',
    items: [
      { id: 'analytics', label: 'Analytics', icon: '📈', panel: 'analytics' },
      { id: 'journal', label: 'Journal', icon: '📓', panel: 'journal' },
      { id: 'failureLogs', label: 'Failure Logs', icon: '🔥', panel: 'failureLogs' },
      { id: 'insights', label: 'Insights', icon: '💡', panel: 'insights' },
    ],
  },
  {
    id: 'automate',
    label: 'AUTOMATE',
    items: [
      { id: 'research', label: 'Research', icon: '🔬', panel: 'research' },
      { id: 'researchQueue', label: 'Research Queue', icon: '📋', panel: 'researchQueue' },
      { id: 'contentPipeline', label: 'Content Pipeline', icon: '⚡', panel: 'contentPipeline' },
      { id: 'automationQueue', label: 'Auto Queue', icon: '🔄', panel: 'automationQueue' },
      { id: 'substack', label: 'Content', icon: '✨', panel: 'substack' },
    ],
  },
  {
    id: 'jarvis',
    label: 'JARVIS',
    items: [
      { id: 'jarvis', label: 'Jarvis', icon: '🎙️', panel: 'jarvis' },
    ],
  },
  {
    id: 'config',
    label: 'CONFIG',
    items: [
      { id: 'settings', label: 'Settings', icon: '⚙️', panel: 'settings' },
      { id: 'linear', label: 'Linear', icon: '📐', panel: 'linear' },
    ],
  },
];

export function Sidebar({ activePanel, onNavigate }: { activePanel: string; onNavigate: (panel: string) => void }) {
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const renameSession = useSessionStore((s) => s.renameSession);
  const memoryEntries = useSharedMemoryStore((s) => s.memory);

  const [systemStats, setSystemStats] = useState({ sessions: 0, memory: 0 });
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    setSystemStats({
      sessions: sessions.length,
      memory: memoryEntries.length,
    });
  }, [sessions.length, memoryEntries.length]);

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
          <span className="text-[var(--text-secondary)] font-mono">{systemStats.memory} entries</span>
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
        <div className="px-3 py-2 border-t border-[var(--border)] max-h-[220px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1.5 px-1">
            Recent
          </p>
          {sessions.slice(0, 6).map((s) => (
            <div
              key={s.id}
              className={`group flex items-center gap-1 px-2 py-1.5 rounded text-left text-xs transition-colors ${
                s.id === activeSessionId
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className="shrink-0">💬</span>
              {editingSessionId === s.id ? (
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => {
                    if (editTitle.trim()) renameSession(s.id, editTitle.trim());
                    setEditingSessionId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (editTitle.trim()) renameSession(s.id, editTitle.trim());
                      setEditingSessionId(null);
                    } else if (e.key === 'Escape') {
                      setEditingSessionId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 min-w-0 px-1 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded text-xs text-[var(--text)] outline-none"
                />
              ) : (
                <>
                  <span
                    className="truncate flex-1 cursor-pointer"
                    onClick={() => { setActiveSession(s.id); onNavigate('chat'); }}
                  >
                    {s.title}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingSessionId(s.id);
                      setEditTitle(s.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] transition-opacity"
                    title="Rename"
                  >
                    ✏️
                  </button>
                </>
              )}
            </div>
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
