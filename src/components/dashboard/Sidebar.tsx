'use client';

import { useState, useEffect } from 'react';
import { useUIStore, useSessionStore } from '@/stores';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';
import { usePanelLayoutStore } from '@/stores/panelLayoutStore';
import { ChevronRight, ChevronDown } from 'lucide-react';

// ── Nav Structure ─────────────────────────────────────────────────────────────
// Primary items always visible at top (Chat + Jarvis + Spaces)
// Then collapsible groups with a parent nav item and indented children

const PRIMARY_ITEMS = [
  { id: 'chat',   label: 'Chat',   icon: '◈', panel: 'chat' },
  { id: 'jarvis', label: 'Jarvis', icon: '◎', panel: 'jarvis' },
  { id: 'spaces', label: 'Spaces', icon: '⬡', panel: 'spaces' },
];

interface NavGroupDef {
  id: string;
  label: string;
  icon: string;
  panel: string;        // primary panel for the parent button
  children: { id: string; label: string; panel: string }[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '⊞',
    panel: 'dashboard',
    children: [
      { id: 'analytics',    label: 'Analytics',     panel: 'analytics' },
      { id: 'insights',     label: 'Insights',      panel: 'insights' },
      { id: 'updates',      label: 'Updates',       panel: 'updates' },
      { id: 'tokens',       label: 'Token Costs',   panel: 'tokens' },
    ],
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: '◉',
    panel: 'agent',
    children: [
      { id: 'mission',   label: 'Mission Control', panel: 'mission' },
      { id: 'designer',  label: 'Designer',        panel: 'designer' },
      { id: 'deploy',    label: 'Deployments',     panel: 'deploy' },
      { id: 'loop',      label: 'Loop Engine',     panel: 'loop' },
      { id: 'agentOffice', label: 'Agent Office',  panel: 'agentOffice' },
    ],
  },
  {
    id: 'work',
    label: 'Work',
    icon: '▣',
    panel: 'taskboard',
    children: [
      { id: 'goals',      label: 'Goals',      panel: 'goals' },
      { id: 'journal',    label: 'Journal',    panel: 'journal' },
      { id: 'devtools',   label: 'DevTools',   panel: 'devtools' },
      { id: 'session',    label: 'Sessions',   panel: 'session' },
      { id: 'workspaces', label: 'Workspaces', panel: 'workspaces' },
    ],
  },
  {
    id: 'knowledge',
    label: 'Knowledge',
    icon: '◐',
    panel: 'memory',
    children: [
      { id: 'skills',       label: 'Skills',        panel: 'skills' },
      { id: 'research',     label: 'Research',      panel: 'research' },
      { id: 'promptStudio', label: 'Prompt Studio', panel: 'promptStudio' },
      { id: 'pipeline',     label: 'Pipeline',      panel: 'pipeline' },
    ],
  },
  {
    id: 'automate',
    label: 'Automate',
    icon: '⚙',
    panel: 'cron',
    children: [
      { id: 'automationQueue',  label: 'Queue',           panel: 'automationQueue' },
      { id: 'substack',         label: 'Content Studio',  panel: 'substack' },
      { id: 'contentPipeline',  label: 'Content Pipeline',panel: 'contentPipeline' },
      { id: 'social',           label: 'Social',          panel: 'social' },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: '◧',
    panel: 'settings',
    children: [
      { id: 'channels',      label: 'Channels',      panel: 'channels' },
      { id: 'pairing',       label: 'Pairing',       panel: 'pairing' },
      { id: 'configEditor',  label: 'Config',        panel: 'configEditor' },
      { id: 'plugins',       label: 'Plugins',       panel: 'plugins' },
      { id: 'achievements',  label: 'Achievements',  panel: 'achievements' },
      { id: 'failureLogs',   label: 'Failure Logs',  panel: 'failureLogs' },
    ],
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function Sidebar({ activePanel, onNavigate }: { activePanel: string; onNavigate: (panel: string) => void }) {
  const sidebarOpen   = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const sessions         = useSessionStore((s) => s.sessions);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
  const activeSessionId  = useSessionStore((s) => s.activeSessionId);
  const renameSession    = useSessionStore((s) => s.renameSession);
  const memoryEntries    = useSharedMemoryStore((s) => s.memory);
  const getVisiblePanels = usePanelLayoutStore((s) => s.getVisiblePanels);
  const visiblePanels    = getVisiblePanels();
  const visibleIds       = new Set(visiblePanels.map((p) => p.id as string));

  // Track which groups are expanded (by group id)
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand the group containing the active panel
    const initial = new Set<string>();
    for (const g of NAV_GROUPS) {
      if (g.panel === activePanel || g.children.some(c => c.panel === activePanel)) {
        initial.add(g.id);
      }
    }
    return initial;
  });

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Expand the group when activePanel changes
  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      for (const g of NAV_GROUPS) {
        if (g.panel === activePanel || g.children.some(c => c.panel === activePanel)) {
          next.add(g.id);
        }
      }
      return next;
    });
  }, [activePanel]);

  // Auto-close sidebar on mobile → desktop transition
  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');
    const handler = (e: MediaQueryListEvent) => {
      if (e.matches) useUIStore.getState().setSidebarOpen(true);
    };
    mql.addEventListener('change', handler);
    if (!mql.matches) useUIStore.getState().setSidebarOpen(false);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const handleNavigate = (panel: string) => {
    onNavigate(panel);
    if (window.innerWidth < 768) toggleSidebar();
  };

  const toggleGroup = (groupId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const isActive = (panel: string) => activePanel === panel;

  return (
    <aside
      className={`
        shrink-0 flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]
        transition-[width] duration-200 ease
        fixed md:relative z-40 h-full overflow-hidden
        ${sidebarOpen ? 'w-[190px]' : 'w-0 md:w-0'}
        ${sidebarOpen ? 'max-md:shadow-2xl' : ''}
      `}
    >
      {/* Logo / Header */}
      <div className="flex items-center gap-2.5 px-4 h-[52px] border-b border-[var(--border)] shrink-0">
        <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center flex-shrink-0" style={{ boxShadow: '0 0 12px var(--accent-glow)' }}>
          <span className="text-white text-[11px] font-bold">O</span>
        </div>
        <span className="font-semibold text-[13px] text-[var(--text)] tracking-tight">Overlord</span>
        <span className="ml-auto text-[9px] text-[var(--text-muted)] font-mono tracking-tight">v0.1</span>
      </div>

      {/* Connection indicator */}
      <div className="px-3 py-2 border-b border-[var(--border)] flex items-center gap-2">
        <span className={`status-dot ${
          connectionStatus === 'connected' ? 'online' :
          connectionStatus === 'reconnecting' ? 'warning' : 'offline'
        }`} />
        <span className="text-[10px] text-[var(--text-muted)] capitalize">{connectionStatus}</span>
        <span className="ml-auto text-[9px] text-[var(--text-muted)] font-mono">
          {memoryEntries.length}m · {sessions.length}s
        </span>
      </div>

      {/* Scrollable nav */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-2 space-y-0.5">

        {/* "NAV" section label */}
        <p className="nav-section-label px-2 mb-2">NAV</p>

        {/* Primary items — Chat, Jarvis, Spaces */}
        {PRIMARY_ITEMS.filter(item => visibleIds.has(item.id)).map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigate(item.panel)}
            className={`nav-item ${isActive(item.panel) ? 'active' : ''}`}
          >
            <span className="text-[var(--accent)] text-[15px] font-light leading-none w-4 text-center flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}

        {/* Divider */}
        <div className="my-3 mx-1 h-px bg-[var(--border-subtle)]" />

        {/* Collapsible groups */}
        {NAV_GROUPS.map((group) => {
          const visibleChildren = group.children.filter(c => visibleIds.has(c.id));
          const isGroupVisible = visibleIds.has(group.id) || visibleChildren.length > 0;
          if (!isGroupVisible) return null;

          const isOpen = expanded.has(group.id);
          const parentActive = isActive(group.panel) || visibleChildren.some(c => isActive(c.panel));

          return (
            <div key={group.id}>
              {/* Parent button */}
              <button
                onClick={() => {
                  handleNavigate(group.panel);
                  if (!isOpen) toggleGroup(group.id);
                }}
                onContextMenu={(e) => { e.preventDefault(); toggleGroup(group.id); }}
                className={`nav-item ${parentActive ? 'active' : ''}`}
                title={`Click to open · Right-click to expand`}
              >
                <span className="text-[var(--text-muted)] text-[14px] font-light leading-none w-4 text-center flex-shrink-0"
                  style={parentActive ? { color: 'var(--accent)' } : {}}>
                  {group.icon}
                </span>
                <span className="flex-1">{group.label}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleGroup(group.id); }}
                  className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors p-0.5 rounded"
                >
                  {isOpen
                    ? <ChevronDown size={10} />
                    : <ChevronRight size={10} />
                  }
                </button>
              </button>

              {/* Children */}
              {isOpen && visibleChildren.map((child) => (
                <button
                  key={child.id}
                  onClick={() => handleNavigate(child.panel)}
                  className={`nav-item child ${isActive(child.panel) ? 'active' : ''}`}
                >
                  <span className="text-[var(--text-muted)] text-[9px] leading-none w-2 flex-shrink-0">—</span>
                  <span>{child.label}</span>
                </button>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="px-2 py-2 border-t border-[var(--border)] max-h-[180px] overflow-y-auto">
          <p className="nav-section-label px-2 mb-1.5">Recent</p>
          {sessions.slice(0, 5).map((s) => (
            <div
              key={s.id}
              className={`group flex items-center gap-1.5 px-2 py-1.5 rounded-md text-left transition-colors cursor-pointer ${
                s.id === activeSessionId
                  ? 'bg-[var(--nav-active-bg)] text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.04)] hover:text-[var(--text-secondary)]'
              }`}
            >
              <span className="text-[9px] opacity-50">◈</span>
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
                  className="flex-1 min-w-0 px-1 py-0.5 bg-[var(--bg-tertiary)] border border-[var(--accent)] rounded text-[10px] text-[var(--text)] outline-none"
                />
              ) : (
                <>
                  <span
                    className="truncate flex-1 text-[10.5px] cursor-pointer"
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
                    className="opacity-0 group-hover:opacity-100 shrink-0 text-[var(--text-muted)] hover:text-[var(--text)] transition-opacity text-[9px]"
                    title="Rename"
                  >
                    ✎
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Theme Switcher */}
      <div className="px-3 py-3 border-t border-[var(--border)] flex-shrink-0">
        <p className="nav-section-label mb-2">Theme</p>
        <ThemeSwitcher />
      </div>
    </aside>
  );
}

// ── Theme Switcher ────────────────────────────────────────────────────────────

function ThemeSwitcher() {
  const theme    = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const themes = [
    { id: 'dark',     color: '#0ea5e9', label: 'Navy' },
    { id: 'midnight', color: '#8b5cf6', label: 'Midnight' },
    { id: 'forest',   color: '#34d399', label: 'Forest' },
    { id: 'arctic',   color: '#0ea5e9', label: 'Arctic' },
    { id: 'light',    color: '#6366f1', label: 'Light' },
  ];

  return (
    <div className="flex gap-1.5 flex-wrap">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id as any)}
          title={t.label}
          className={`
            w-5 h-5 rounded-full border-2 flex items-center justify-center
            transition-all duration-150
            ${theme === t.id ? 'border-white scale-110' : 'border-transparent hover:border-[var(--border)] opacity-60 hover:opacity-100'}
          `}
          style={{ backgroundColor: t.color }}
        >
          {theme === t.id && <span className="text-white text-[7px]">✓</span>}
        </button>
      ))}
    </div>
  );
}
