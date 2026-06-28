/**
 * Zustand Store — Panel Layout Preferences
 * Controls which panels are visible, panel order, and layout presists.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type PanelId =
  | 'dashboard' | 'chat' | 'pipeline' | 'memory' | 'loop' | 'devtools'
  | 'research' | 'substack' | 'agent' | 'jarvis' | 'designer' | 'spaces'
  | 'mission' | 'taskboard' | 'deploy' | 'skills' | 'goals' | 'journal'
  | 'analytics' | 'session' | 'failureLogs' | 'insights' | 'settings'
  | 'contentPipeline' | 'automationQueue' | 'workspaces'
  | 'tokens' | 'updates'
  | 'cron' | 'plugins' | 'achievements' | 'configEditor' | 'webhooks' | 'channels' | 'pairing' | 'mcp';

export interface PanelConfig {
  id: PanelId;
  label: string;
  visible: boolean;
  order: number;
  group: string;
}

const DEFAULT_PANELS: PanelConfig[] = [
  // Core
  { id: 'dashboard', label: 'Dashboard', visible: true, order: 0, group: 'core' },
  { id: 'chat', label: 'Chat', visible: true, order: 1, group: 'core' },
  { id: 'pipeline', label: 'Pipeline', visible: true, order: 2, group: 'core' },
  { id: 'tokens', label: 'Tokens', visible: true, order: 3, group: 'core' },
  { id: 'designer', label: 'Designer', visible: true, order: 4, group: 'core' },
  { id: 'spaces', label: 'Spaces', visible: true, order: 5, group: 'core' },
  // Operate
  { id: 'mission', label: 'Mission Control', visible: true, order: 10, group: 'operate' },
  { id: 'taskboard', label: 'Task Board', visible: true, order: 11, group: 'operate' },
  { id: 'deploy', label: 'Deployments', visible: true, order: 12, group: 'operate' },
  { id: 'loop', label: 'Loops', visible: true, order: 13, group: 'operate' },
  { id: 'goals', label: 'Goals', visible: true, order: 14, group: 'operate' },
  { id: 'workspaces', label: 'Workspaces', visible: true, order: 15, group: 'operate' },
  // Observe
  { id: 'memory', label: 'Memory', visible: true, order: 20, group: 'observe' },
  { id: 'devtools', label: 'DevTools', visible: true, order: 21, group: 'observe' },
  { id: 'skills', label: 'Skills', visible: true, order: 22, group: 'observe' },
  { id: 'session', label: 'Sessions', visible: true, order: 23, group: 'observe' },
  { id: 'updates', label: 'Updates', visible: true, order: 24, group: 'observe' },
  // Insight
  { id: 'analytics', label: 'Analytics', visible: true, order: 30, group: 'insight' },
  { id: 'journal', label: 'Journal', visible: true, order: 31, group: 'insight' },
  { id: 'failureLogs', label: 'Failure Logs', visible: true, order: 32, group: 'insight' },
  { id: 'insights', label: 'Insights', visible: true, order: 33, group: 'insight' },
  // Automate
  { id: 'research', label: 'Research', visible: true, order: 40, group: 'automate' },
  { id: 'contentPipeline', label: 'Content Pipeline', visible: true, order: 41, group: 'automate' },
  { id: 'automationQueue', label: 'Auto Queue', visible: true, order: 42, group: 'automate' },
  { id: 'substack', label: 'Content', visible: true, order: 43, group: 'automate' },
  // Jarvis
  { id: 'jarvis', label: 'Jarvis', visible: true, order: 50, group: 'jarvis' },
  // Config
  { id: 'settings', label: 'Settings', visible: true, order: 60, group: 'config' },
];

interface PanelLayoutState {
  panels: PanelConfig[];
  layoutPreset: 'default' | 'minimal' | 'full';
  togglePanel: (id: PanelId) => void;
  setPanelVisible: (id: PanelId, visible: boolean) => void;
  reorderPanel: (id: PanelId, direction: 'up' | 'down') => void;
  applyPreset: (preset: 'default' | 'minimal' | 'full') => void;
  isPanelVisible: (id: PanelId) => boolean;
  getVisiblePanels: () => PanelConfig[];
}

export const usePanelLayoutStore = create<PanelLayoutState>()(
  persist(
    (set, get) => ({
      panels: DEFAULT_PANELS,
      layoutPreset: 'default',

      togglePanel: (id) =>
        set((s) => ({
          panels: s.panels.map((p) =>
            p.id === id ? { ...p, visible: !p.visible } : p
          ),
        })),

      setPanelVisible: (id, visible) =>
        set((s) => ({
          panels: s.panels.map((p) =>
            p.id === id ? { ...p, visible } : p
          ),
        })),

      reorderPanel: (id, direction) =>
        set((s) => {
          const group = s.panels.find((p) => p.id === id)?.group;
          const groupPanels = s.panels
            .filter((p) => p.group === group)
            .sort((a, b) => a.order - b.order);
          const idx = groupPanels.findIndex((p) => p.id === id);
          if (idx < 0) return s;
          const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
          if (swapIdx < 0 || swapIdx >= groupPanels.length) return s;
          const currentOrder = groupPanels[idx].order;
          const swapOrder = groupPanels[swapIdx].order;
          return {
            panels: s.panels.map((p) => {
              if (p.id === id) return { ...p, order: swapOrder };
              if (p.id === groupPanels[swapIdx].id) return { ...p, order: currentOrder };
              return p;
            }),
          };
        }),

      applyPreset: (preset) => {
        if (preset === 'default') {
          set({ panels: DEFAULT_PANELS, layoutPreset: preset });
        } else if (preset === 'minimal') {
          set((s) => ({
            panels: s.panels.map((p) => ({
              ...p,
              visible: ['dashboard', 'chat', 'jarvis', 'settings'].includes(p.id),
            })),
            layoutPreset: preset,
          }));
        } else if (preset === 'full') {
          set((s) => ({
            panels: s.panels.map((p) => ({ ...p, visible: true })),
            layoutPreset: preset,
          }));
        }
      },

      isPanelVisible: (id) => {
        const panel = get().panels.find((p) => p.id === id);
        return panel?.visible ?? false;
      },

      getVisiblePanels: () =>
        get().panels.filter((p) => p.visible).sort((a, b) => a.order - b.order),
    }),
    {
      name: 'agent-os-panel-layout',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
