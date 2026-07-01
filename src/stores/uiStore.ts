/**
 * Zustand Store — UI State
 * Theme, sidebar, notifications, modals, etc.
 * Used by WS6 (UX Polish) and shared across all workstreams
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeName } from '@/types';

export interface Toast {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

export type WorkflowMode = 'PLAN' | 'ASK' | 'EXECUTE' | 'REVIEW';

interface UIState {
  // Theme
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
  toggleCommandPalette: () => void;

  // Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  // Settings
  settingsOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  toggleSettings: () => void;

  // Notifications / Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;

  // Sound
  soundsEnabled: boolean;
  toggleSounds: () => void;

  // Persona
  activePersona: string;
  setActivePersona: (slug: string) => void;

  // Workflow Mode
  currentMode: WorkflowMode;
  setCurrentMode: (mode: WorkflowMode) => void;

  // Breadcrumbs
  breadcrumbs: { label: string; href?: string }[];
  setBreadcrumbs: (crumbs: { label: string; href?: string }[]) => void;

  // Connection status
  connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'offline';
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'reconnecting' | 'offline') => void;
  reconnectChat: () => void;

  // Keyboard shortcuts help
  shortcutsHelpOpen: boolean;
  setShortcutsHelpOpen: (open: boolean) => void;
  toggleShortcutsHelp: () => void;

  // Model
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  availableModels: string[];
  setAvailableModels: (models: string[]) => void;

  // Reasoning effort
  reasoningEffort: 'low' | 'medium' | 'high';
  setReasoningEffort: (effort: 'low' | 'medium' | 'high') => void;

  // Voice
  voiceEnabled: boolean;
  toggleVoice: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Sidebar
      sidebarOpen: true,
      sidebarWidth: 260,
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarWidth: (width) =>
        set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () =>
        set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      // Search
      searchOpen: false,
      setSearchOpen: (open) => set({ searchOpen: open }),
      toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),

      // Settings
      settingsOpen: false,
      setSettingsOpen: (open) => set({ settingsOpen: open }),
      toggleSettings: () => set((s) => ({ settingsOpen: !s.settingsOpen })),

      // Toasts
      toasts: [],
      addToast: (toast) => {
        const id = Math.random().toString(36).slice(2, 10);
        const newToast = { ...toast, id };
        set((s) => ({ toasts: [...s.toasts, newToast] }));
        if (toast.duration !== 0) {
          setTimeout(() => {
            get().removeToast(id);
          }, toast.duration || 4000);
        }
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      clearToasts: () => set({ toasts: [] }),

      // Sound
      soundsEnabled: true,
      toggleSounds: () => set((s) => ({ soundsEnabled: !s.soundsEnabled })),

      // Persona
      activePersona: 'hermes',
      setActivePersona: (slug) => set({ activePersona: slug }),

      // Workflow Mode
      currentMode: 'EXECUTE',
      setCurrentMode: (mode) => set({ currentMode: mode }),

      // Breadcrumbs
      breadcrumbs: [],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),

      // Connection
      connectionStatus: 'connected' as const,
      setConnectionStatus: (status) => set({ connectionStatus: status }),
      reconnectChat: () => set({ connectionStatus: 'reconnecting' }),

      // Shortcuts help
      shortcutsHelpOpen: false,
      setShortcutsHelpOpen: (open) => set({ shortcutsHelpOpen: open }),
      toggleShortcutsHelp: () =>
        set((s) => ({ shortcutsHelpOpen: !s.shortcutsHelpOpen })),

      // Model
      selectedModel: 'google/gemma-4-31b-it:free',
      setSelectedModel: (model) => set({ selectedModel: model }),
      availableModels: ['openrouter/owl-alpha', 'openai/gpt-oss-120b:free', 'moonshotai/kimi-k2.6:free', 'google/gemma-4-31b-it:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'meta-llama/llama-3.2-3b-instruct:free', 'nex-agi/nex-n2-pro:free', 'openai/gpt-oss-20b:free'],
      setAvailableModels: (models) => set({ availableModels: models }),

      // Reasoning effort
      reasoningEffort: 'medium' as const,
      setReasoningEffort: (effort) => set({ reasoningEffort: effort }),

      // Voice
      voiceEnabled: false,
      toggleVoice: () => set((s) => ({ voiceEnabled: !s.voiceEnabled })),
    }),
    {
      name: 'agent-os-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
        soundsEnabled: state.soundsEnabled,
        activePersona: state.activePersona,
        selectedModel: state.selectedModel,
        reasoningEffort: state.reasoningEffort,
        voiceEnabled: state.voiceEnabled,
        currentMode: state.currentMode,
      }),

    }
  )
);
