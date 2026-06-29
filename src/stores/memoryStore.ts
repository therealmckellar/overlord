import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface Memory {
  id: string;
  content: string;
  tags: string[];
  source: string; // which agent/persona created it
  sessionId?: string;
  createdAt: number;
  updatedAt: number;
  pinned: boolean;
}

interface MemoryState {
  memories: Memory[];
  searchQuery: string;
  filterTag: string | null;
  filterSource: string | null;

  // Actions
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt' | 'updatedAt'>) => Memory;
  updateMemory: (id: string, updates: Partial<Memory>) => void;
  deleteMemory: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setFilterTag: (tag: string | null) => void;
  setFilterSource: (source: string | null) => void;

  // Derived
  getAllTags: () => string[];
  getAllSources: () => string[];
  getFilteredMemories: () => Memory[];
}

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set, get) => ({
      memories: [],
      searchQuery: '',
      filterTag: null,
      filterSource: null,

      addMemory: (memory) => {
        const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = Date.now();
        const newMemory: Memory = {
          ...memory,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ memories: [newMemory, ...s.memories] }));
        return newMemory;
      },

      updateMemory: (id, updates) => {
        set((s) => ({
          memories: s.memories.map((m) =>
            m.id === id ? { ...m, ...updates, updatedAt: Date.now() } : m
          ),
        }));
      },

      deleteMemory: (id) => {
        set((s) => ({ memories: s.memories.filter((m) => m.id !== id) }));
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
      setFilterTag: (tag) => set({ filterTag: tag }),
      setFilterSource: (source) => set({ filterSource: source }),

      getAllTags: () => {
        const tags = new Set<string>();
        get().memories.forEach((m) => m.tags.forEach((t) => tags.add(t)));
        return Array.from(tags).sort();
      },

      getAllSources: () => {
        const sources = new Set<string>();
        get().memories.forEach((m) => sources.add(m.source));
        return Array.from(sources).sort();
      },

      getFilteredMemories: () => {
        const { memories, searchQuery, filterTag, filterSource } = get();
        let filtered = memories;

        if (searchQuery.trim()) {
          const lower = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (m) =>
              m.content.toLowerCase().includes(lower) ||
              m.tags.some((t) => t.toLowerCase().includes(lower))
          );
        }

        if (filterTag) {
          filtered = filtered.filter((m) => m.tags.includes(filterTag));
        }

        if (filterSource) {
          filtered = filtered.filter((m) => m.source === filterSource);
        }

        return filtered.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          return b.updatedAt - a.updatedAt;
        });
      },
    }),
    {
      name: 'overlord-memories',
      partialize: (state) => ({ memories: state.memories.slice(0, 200) }),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
