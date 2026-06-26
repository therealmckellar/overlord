/**
 * Zustand Store — Spaces (Perplexity-style workspaces)
 * Each Space groups threads, files, custom instructions, and members
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SpaceFile {
  id: string;
  name: string;
  type: string;       // mime type
  size: number;
  uploadedAt: number;
  url?: string;       // local/object URL
}

export interface SpaceMember {
  id: string;
  name: string;
  role: 'owner' | 'contributor' | 'viewer';
  avatar?: string;
}

export interface SpaceThread {
  id: string;
  title: string;
  mode: 'ask' | 'computer';   // ask = chat, computer = agent task
  lastActivity: number;
  messageCount: number;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  customInstructions: string;   // AI instructions applied to all threads in this space
  files: SpaceFile[];
  threads: SpaceThread[];
  pinnedItems: string[];   // ids of pinned threads/files
  members: SpaceMember[];
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

const SPACE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];
const SPACE_ICONS = ['📁', '🔬', '💼', '🎯', '📊', '🚀', '📝', '🧪'];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

interface SpaceState {
  spaces: Space[];
  activeSpaceId: string | null;

  // Actions
  createSpace: (name: string, description?: string) => Space;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  deleteSpace: (id: string) => void;
  setActiveSpace: (id: string | null) => void;

  // Instructions
  setCustomInstructions: (spaceId: string, instructions: string) => void;

  // Threads
  addThread: (spaceId: string, thread: Omit<SpaceThread, 'id'>) => void;
  removeThread: (spaceId: string, threadId: string) => void;

  // Files
  addFile: (spaceId: string, file: Omit<SpaceFile, 'id' | 'uploadedAt'>) => void;
  removeFile: (spaceId: string, fileId: string) => void;

  // Members
  addMember: (spaceId: string, member: Omit<SpaceMember, 'id'>) => void;
  removeMember: (spaceId: string, memberId: string) => void;

  // Pinning
  togglePin: (spaceId: string, itemId: string) => void;

  // Getters
  getActiveSpace: () => Space | null;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      spaces: [],
      activeSpaceId: null,

      createSpace: (name, description) => {
        const space: Space = {
          id: generateId(),
          name,
          description: description || '',
          customInstructions: '',
          files: [],
          threads: [],
          pinnedItems: [],
          members: [{ id: 'owner', name: 'Rich', role: 'owner' }],
          color: SPACE_COLORS[get().spaces.length % SPACE_COLORS.length],
          icon: SPACE_ICONS[get().spaces.length % SPACE_ICONS.length],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ spaces: [...state.spaces, space] }));
        return space;
      },

      updateSpace: (id, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        })),

      deleteSpace: (id) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== id),
          activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId,
        })),

      setActiveSpace: (id) => set({ activeSpaceId: id }),

      setCustomInstructions: (spaceId, instructions) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, customInstructions: instructions, updatedAt: Date.now() } : s
          ),
        })),

      addThread: (spaceId, thread) => {
        const newThread = { ...thread, id: generateId() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, threads: [...s.threads, newThread], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeThread: (spaceId, threadId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, threads: s.threads.filter((t) => t.id !== threadId), updatedAt: Date.now() }
              : s
          ),
        })),

      addFile: (spaceId, file) => {
        const newFile: SpaceFile = { ...file, id: generateId(), uploadedAt: Date.now() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, files: [...s.files, newFile], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeFile: (spaceId, fileId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, files: s.files.filter((f) => f.id !== fileId), updatedAt: Date.now() }
              : s
          ),
        })),

      addMember: (spaceId, member) => {
        const newMember = { ...member, id: generateId() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, members: [...s.members, newMember], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeMember: (spaceId, memberId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, members: s.members.filter((m) => m.id !== memberId), updatedAt: Date.now() }
              : s
          ),
        })),

      togglePin: (spaceId, itemId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  pinnedItems: s.pinnedItems.includes(itemId)
                    ? s.pinnedItems.filter((id) => id !== itemId)
                    : [...s.pinnedItems, itemId],
                  updatedAt: Date.now(),
                }
              : s
          ),
        })),

      getActiveSpace: () => {
        const { spaces, activeSpaceId } = get();
        return spaces.find((s) => s.id === activeSpaceId) || null;
      },
    }),
    {
      name: 'overlord-space-store',
    }
  )
);
