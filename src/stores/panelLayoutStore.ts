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
  | 'cron' | 'plugins' | 'achievements' | 'configEditor' | 'webhooks' | 'channels' | 'pairing' | 'mcp'
  | 'social' | 'promptStudio' | 'agentOffice';

export interface PanelConfig {
  id: PanelId;
  label: string;
  visible: boolean;
  order: number;
  group: string;
}

const DEFAULT_PANELS: PanelConfig[] = [
  // Core (group: 'core')
  { id: 'dashboard', label: 'Dashboard', visible: true, order: 0, group: 'core' },
  { id: 'jarvis', label: 'Jarvis', visible: true, order: 1, group: 'core' },
  { id: 'spaces', label: 'Spaces', visible: true, order: 2, group: 'core' },
  { id: 'tokens', label: 'Token Costs', visible: true, order: 3, group: 'core' },

  // Agents & Models (group: 'agents')
  { id: 'agent', label: 'Agent Roster', visible: true, order: 10, group: 'agents' },
  { id: 'designer', label: 'Agent Designer', visible: true, order: 11, group: 'agents' },
  { id: 'deploy', label: 'Deployments', visible: true, order: 12, group: 'agents' },
  { id: 'mission', label: 'Mission Control', visible: true, order: 13, group: 'agents' },
  { id: 'loop', label: 'Loop Engine', visible: true, order: 14, group: 'agents' },

  // Chat & Workspace (group: 'chat')
  { id: 'chat', label: 'Chat', visible: true, order: 20, group: 'chat' },
  { id: 'session', label: 'Sessions', visible: true, order: 21, group: 'chat' },
  { id: 'workspaces', label: 'Workspaces', visible: true, order: 22, group: 'chat' },
  { id: 'pipeline', label: 'Pipeline', visible: true, order: 23, group: 'chat' },

  // Office (group: 'office')
  { id: 'taskboard', label: 'Task Board', visible: true, order: 30, group: 'office' },
  { id: 'goals', label: 'Goals', visible: true, order: 31, group: 'office' },
  { id: 'journal', label: 'Journal', visible: true, order: 32, group: 'office' },
  { id: 'devtools', label: 'DevTools', visible: true, order: 33, group: 'office' },
  { id: 'agentOffice', label: 'Agent Office', visible: true, order: 34, group: 'office' },

  // Knowledge (group: 'knowledge')
  { id: 'memory', label: 'Memory Galaxy', visible: true, order: 40, group: 'knowledge' },
  { id: 'skills', label: 'Skills', visible: true, order: 41, group: 'knowledge' },
  { id: 'research', label: 'Research', visible: true, order: 42, group: 'knowledge' },
  { id: 'promptStudio', label: 'Prompt Studio', visible: true, order: 43, group: 'knowledge' },

  // Automate (group: 'automate')
  { id: 'cron', label: 'Cron', visible: true, order: 50, group: 'automate' },
  { id: 'automationQueue', label: 'Auto Queue', visible: true, order: 51, group: 'automate' },
  { id: 'substack', label: 'Content Studio', visible: true, order: 52, group: 'automate' },
  { id: 'contentPipeline', label: 'Content Pipeline', visible: true, order: 53, group: 'automate' },
  { id: 'social', label: 'Social', visible: true, order: 54, group: 'automate' },

  // Channels & Integrations (group: 'observe')
  { id: 'channels', label: 'Channels', visible: true, order: 60, group: 'observe' },
  { id: 'webhooks', label: 'Webhooks', visible: true, order: 61, group: 'observe' },
  { id: 'pairing', label: 'Pairing', visible: true, order: 62, group: 'observe' },
  { id: 'mcp', label: 'MCP Servers', visible: true, order: 63, group: 'observe' },

  // System (group: 'system')
  { id: 'analytics', label: 'Analytics', visible: true, order: 70, group: 'system' },
  { id: 'insights', label: 'Insights', visible: true, order: 71, group: 'system' },
  { id: 'failureLogs', label: 'Failure Logs', visible: true, order: 72, group: 'system' },
  { id: 'updates', label: 'Updates', visible: true, order: 73, group: 'system' },
  { id: 'achievements', label: 'Achievements', visible: true, order: 74, group: 'system' },
  { id: 'plugins', label: 'Plugins', visible: true, order: 75, group: 'system' },
  { id: 'configEditor', label: 'Config', visible: true, order: 76, group: 'system' },
  { id: 'settings', label: 'Settings', visible: true, order: 77, group: 'system' },
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
      version: 2,
      partialize: (state) => ({ panels: state.panels, layoutPreset: state.layoutPreset }),
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        // Start from the current defaults so newly-added panels are never dropped
        const mergedPanels = [...currentState.panels];
        if (persistedState.panels) {
          persistedState.panels.forEach((p: any) => {
            const idx = mergedPanels.findIndex((dp) => dp.id === p.id);
            if (idx >= 0) {
              // Merge persisted preferences (visibility, order) into the default entry
              mergedPanels[idx] = { ...mergedPanels[idx], ...p };
            }
            // Panels in persisted state that are no longer in defaults are intentionally dropped
          });
        }
        return {
          ...currentState,
          ...persistedState,
          panels: mergedPanels,
        };
      },
    }
  )
);
