import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MemoryEntry {
  id: string;
  content: string;
  source: string; // agent name or 'user' | 'system'
  tags: string[];
  timestamp: number;
  type: 'insight' | 'fact' | 'todo' | 'decision' | 'context';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused';
  createdAt: number;
  updatedAt: number;
  linkedTasks: string[]; // kanban task IDs
  linkedAgents: string[]; // agent names
}

export interface JournalEntry {
  id: string;
  date: string; // YYYY-MM-DD
  content: string;
  type: 'built' | 'blocked' | 'learned' | 'decided';
  agentName: string | null;
  timestamp: number;
}

export interface SessionMessage {
  id: string;
  agentName: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  topic: string | null;
}

export interface SharedMemoryState {
  memory: MemoryEntry[];
  goals: Goal[];
  journal: JournalEntry[];
  sessions: SessionMessage[];

  // Memory
  addMemory: (entry: Omit<MemoryEntry, 'id' | 'timestamp'>) => void;
  searchMemory: (query: string) => MemoryEntry[];
  deleteMemory: (id: string) => void;
  getMemoryByTag: (tag: string) => MemoryEntry[];
  getMemoryBySource: (source: string) => MemoryEntry[];

  // Goals
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'status'>) => string;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  getActiveGoals: () => Goal[];

  // Journal
  addJournal: (entry: Omit<JournalEntry, 'id' | 'timestamp'>) => void;
  updateJournal: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournal: (id: string) => void;
  getJournalByDate: (date: string) => JournalEntry[];
  getRecentJournal: (days: number) => JournalEntry[];

  // Sessions
  addSession: (msg: Omit<SessionMessage, 'id' | 'timestamp'>) => void;
  getSessionsByAgent: (agentName: string) => SessionMessage[];
  getRecentSessions: (count: number) => SessionMessage[];
  getSessionsByTopic: (topic: string) => SessionMessage[];
}

const generateId = () => `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const today = () => new Date().toISOString().split('T')[0];
const now = Date.now();

const SEED_MEMORY: MemoryEntry[] = [];

const SEED_GOALS: Goal[] = [];

const SEED_JOURNAL: JournalEntry[] = [];

const SEED_SESSIONS: SessionMessage[] = [];

export const useSharedMemoryStore = create<SharedMemoryState>()(
  persist(
    (set, get) => ({
      memory: SEED_MEMORY,
      goals: SEED_GOALS,
      journal: SEED_JOURNAL,
      sessions: SEED_SESSIONS,

      addMemory: (entry) => {
        set((state) => ({
          memory: [{ ...entry, id: generateId(), timestamp: Date.now() }, ...state.memory],
        }));
      },
      searchMemory: (query) => {
        const q = query.toLowerCase();
        return get().memory.filter(
          (m) => m.content.toLowerCase().includes(q) || m.tags.some((t) => t.includes(q))
        );
      },
      deleteMemory: (id) => {
        set((state) => ({ memory: state.memory.filter((m) => m.id !== id) }));
      },
      getMemoryByTag: (tag) => get().memory.filter((m) => m.tags.includes(tag)),
      getMemoryBySource: (source) => get().memory.filter((m) => m.source === source),

      addGoal: (goal) => {
        const id = `goal_${Date.now()}`;
        set((state) => ({
          goals: [...state.goals, { ...goal, id, progress: 0, status: 'active', createdAt: Date.now(), updatedAt: Date.now() }],
        }));
        return id;
      },
      updateGoal: (id, updates) => {
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, ...updates, updatedAt: Date.now() } : g
          ),
        }));
      },
      deleteGoal: (id) => {
        set((state) => ({ goals: state.goals.filter((g) => g.id !== id) }));
      },
      getActiveGoals: () => get().goals.filter((g) => g.status === 'active'),

      addJournal: (entry) => {
        set((state) => ({
          journal: [{ ...entry, id: generateId(), timestamp: Date.now() }, ...state.journal],
        }));
      },
      updateJournal: (id, updates) => {
        set((state) => ({
          journal: state.journal.map((j) =>
            j.id === id ? { ...j, ...updates } : j
          ),
        }));
      },
      deleteJournal: (id) => {
        set((state) => ({ journal: state.journal.filter((j) => j.id !== id) }));
      },
      getJournalByDate: (date) => get().journal.filter((j) => j.date === date),
      getRecentJournal: (days) => {
        const cutoff = Date.now() - days * 86400000;
        return get().journal.filter((j) => j.timestamp >= cutoff);
      },

      addSession: (msg) => {
        set((state) => ({
          sessions: [...state.sessions, { ...msg, id: generateId(), timestamp: Date.now() }],
        }));
      },
      getSessionsByAgent: (agentName) => get().sessions.filter((s) => s.agentName === agentName),
      getRecentSessions: (count) => get().sessions.slice(-count),
      getSessionsByTopic: (topic) => get().sessions.filter((s) => s.topic === topic),
    }),
    { name: 'overlord-shared-memory', partialize: (state) => ({ memory: state.memory.slice(0, 200), journal: state.journal.slice(0, 100), goals: state.goals.slice(0, 50) }) }
  )
);
