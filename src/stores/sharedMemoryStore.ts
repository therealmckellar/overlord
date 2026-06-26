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

const SEED_MEMORY: MemoryEntry[] = [
  { id: 'mem_1', content: 'Rich prefers autonomous execution — "do it all" over step-by-step', source: 'Rich', tags: ['preference', 'communication'], timestamp: now - 86400000 * 3, type: 'insight' },
  { id: 'mem_2', content: 'Overlord runs on port 9125 via Cloudflare tunnel', source: 'system', tags: ['infrastructure', 'networking'], timestamp: now - 86400000 * 2, type: 'fact' },
  { id: 'mem_3', content: 'MCF does not offer HELOCs — business financing only', source: 'Rich', tags: ['business', 'mcf', 'financing'], timestamp: now - 86400000 * 5, type: 'fact' },
  { id: 'mem_4', content: 'Hermes is orchestrator only — never do hands-on work directly', source: 'Rich', tags: ['rule', 'agent-architecture'], timestamp: now - 86400000 * 7, type: 'decision' },
  { id: 'mem_5', content: 'All code changes must be committed and pushed to GitHub same turn', source: 'Rich', tags: ['rule', 'workflow', 'git'], timestamp: now - 86400000 * 4, type: 'decision' },
  { id: 'mem_6', content: 'Documenso docker compose: BOTH containers use network_mode: host, DB on port 5433', source: 'system', tags: ['infrastructure', 'docker', 'documenso'], timestamp: now - 86400000 * 6, type: 'fact' },
  { id: 'mem_7', content: 'Terminal() does NOT support & backgrounding in foreground mode — use background=true', source: 'system', tags: ['tooling', 'hermes'], timestamp: now - 86400000 * 3, type: 'context' },
  { id: 'mem_8', content: 'Rich territories: NJ, NYC, FL, CT, MA, MD', source: 'Rich', tags: ['business', 'territory'], timestamp: now - 86400000 * 2, type: 'fact' },
];

const SEED_GOALS: Goal[] = [
  { id: 'goal_1', title: 'Replace TUI with Overlord', description: 'Full UI parity with CLI — all agent controls, chat, monitoring', progress: 55, status: 'active', createdAt: now - 86400000 * 7, updatedAt: now - 3600000, linkedTasks: ['task_seed_8'], linkedAgents: ['Builder'] },
  { id: 'goal_2', title: 'Build Agent Designer', description: 'Full agent configuration UI with presets and deployment', progress: 100, status: 'completed', createdAt: now - 86400000 * 7, updatedAt: now - 86400000, linkedTasks: ['task_seed_2'], linkedAgents: ['Builder'] },
  { id: 'goal_3', title: 'Audit vs Goldie Agent OS', description: 'Feature comparison, gap analysis, prioritized roadmap', progress: 30, status: 'active', createdAt: now - 86400000 * 3, updatedAt: now - 3600000, linkedTasks: ['task_seed_7'], linkedAgents: ['Builder'] },
  { id: 'goal_4', title: 'Shared Memory System', description: 'Cross-agent memory with search, tags, and persistence', progress: 0, status: 'active', createdAt: now - 86400000, updatedAt: now - 86400000, linkedTasks: [], linkedAgents: [] },
  { id: 'goal_5', title: 'Analytics Dashboard', description: 'Agent performance metrics, task completion rates, system health', progress: 0, status: 'active', createdAt: now - 86400000, updatedAt: now - 86400000, linkedTasks: [], linkedAgents: [] },
];

const SEED_JOURNAL: JournalEntry[] = [
  { id: 'jrnl_1', date: today(), content: 'Built full UI wireframe — Designer, Loops, Studio, Kanban, Mission Control, Deployments, Skills all working', type: 'built', agentName: 'Builder', timestamp: now - 3600000 },
  { id: 'jrnl_2', date: today(), content: 'Implemented drag-and-drop Kanban, agent assignment, priority labels', type: 'built', agentName: 'Builder', timestamp: now - 7200000 },
  { id: 'jrnl_3', date: today(), content: 'Implemented Mission Control with live agent monitoring, progress bars, activity feed', type: 'built', agentName: 'Builder', timestamp: now - 5400000 },
  { id: 'jrnl_4', date: today(), content: 'Builder agent frequently times out on large tasks — need to split into smaller increments', type: 'learned', agentName: null, timestamp: now - 10800000 },
  { id: 'jrnl_5', date: today(), content: 'Decided to implement directly instead of delegating — 3 consecutive Builder timeouts', type: 'decided', agentName: 'Hermes', timestamp: now - 9000000 },
];

const SEED_SESSIONS: SessionMessage[] = [
  { id: 'sess_1', agentName: 'Builder', role: 'user', content: 'Build the Kanban board component', timestamp: now - 7200000, topic: 'kanban' },
  { id: 'sess_2', agentName: 'Builder', role: 'assistant', content: 'Created KanbanBoard.tsx with drag-and-drop, 5 columns, agent assignment, priority labels, and 8 seed tasks.', timestamp: now - 7100000, topic: 'kanban' },
  { id: 'sess_3', agentName: 'Explorer', role: 'user', content: 'Research Julian Goldie Agent OS features', timestamp: now - 3600000, topic: 'research' },
  { id: 'sess_4', agentName: 'Explorer', role: 'assistant', content: 'Found 6 key pages: Substack article (May 17), AI Money Lab walkthrough (May 21), AI Automation blog (May 22), and more. Goldie Mission Stack has 4 layers.', timestamp: now - 3500000, topic: 'research' },
  { id: 'sess_5', agentName: 'Reviewer', role: 'user', content: 'Review AgentDesigner component for quality', timestamp: now - 86400000, topic: 'review' },
  { id: 'sess_6', agentName: 'Reviewer', role: 'assistant', content: 'AgentDesigner is well-structured. Issues: UNIQUE_MODELS returns objects not strings, missing input validation on temperature.', timestamp: now - 86300000, topic: 'review' },
];

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
    { name: 'overlord-shared-memory' }
  )
);
