import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'paused' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  context: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null; // agent name or 'Rich'
  agentId: string | null; // agent preset id
  createdAt: number;
  updatedAt: number;
  dueDate: string | null;
  tags: string[];
}

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'paused', 'review', 'done'];

const COLUMN_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  paused: 'Paused',
  review: 'Review',
  done: 'Done',
};

const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  paused: '#8b5cf6',
  review: '#8b5cf6',
  done: '#10b981',
};

export { COLUMNS, COLUMN_LABELS, COLUMN_COLORS };

const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Seed tasks
const now = Date.now();
const SEED_TASKS: KanbanTask[] = [
  {
    id: 'seed-task-1',
    title: 'Decompose Q3 Roadmap into milestones',
    description: 'Break down the project goals into specific tasks and map dependencies for the agents.',
    context: 'Orchestration layout goals',
    status: 'done',
    priority: 'high',
    assignee: 'Planner',
    agentId: 'agent-planner',
    createdAt: now - 86400000 * 3,
    updatedAt: now - 86400000 * 2,
    dueDate: new Date(now + 86400000 * 5).toISOString().slice(0, 10),
    tags: ['planning', 'roadmap'],
  },
  {
    id: 'seed-task-2',
    title: 'Design database schema for memory sync',
    description: 'Design the SQLite table schemas and indexing strategies for real-time memory syncing.',
    context: 'Database design task',
    status: 'done',
    priority: 'medium',
    assignee: 'Architect',
    agentId: 'agent-architect',
    createdAt: now - 86400000 * 2,
    updatedAt: now - 86400000,
    dueDate: new Date(now + 86400000 * 6).toISOString().slice(0, 10),
    tags: ['architecture', 'db'],
  },
  {
    id: 'seed-task-3',
    title: 'Implement WebGL 3D Force Graph',
    description: 'Develop the dynamic 3D knowledge graph component using react-force-graph-3d and Three.js.',
    context: 'WebGL component design',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Builder',
    agentId: 'agent-builder',
    createdAt: now - 86400000,
    updatedAt: now,
    dueDate: new Date(now + 86400000 * 2).toISOString().slice(0, 10),
    tags: ['frontend', 'webgl'],
  },
  {
    id: 'seed-task-4',
    title: 'Review multi-agent message broker PR',
    description: 'Perform a detailed review of PR #412, focusing on message queue safety and event dispatch latency.',
    context: 'PR #412 Code Review',
    status: 'todo',
    priority: 'high',
    assignee: 'Reviewer',
    agentId: 'agent-reviewer',
    createdAt: now,
    updatedAt: now,
    dueDate: new Date(now + 86400000 * 1).toISOString().slice(0, 10),
    tags: ['review', 'security'],
  },
  {
    id: 'seed-task-5',
    title: 'Scan dependencies for critical CVEs',
    description: 'Audit npm package tree for vulnerabilities and recommend upgrade strategies.',
    context: 'Dependency audit',
    status: 'paused',
    priority: 'urgent',
    assignee: 'Security',
    agentId: 'agent-security',
    createdAt: now - 86400000,
    updatedAt: now - 43200000,
    dueDate: new Date(now + 86400000 * 3).toISOString().slice(0, 10),
    tags: ['security', 'audit'],
  },
  {
    id: 'seed-task-6',
    title: 'Research low-latency TTS engines',
    description: 'Compare ElevenLabs, OpenAI TTS, and local Piper engines for real-time interruptible audio streams.',
    context: 'Voice interaction layer research',
    status: 'review',
    priority: 'medium',
    assignee: 'Researcher',
    agentId: 'agent-researcher',
    createdAt: now - 86400000 * 2,
    updatedAt: now,
    dueDate: new Date(now + 86400000 * 4).toISOString().slice(0, 10),
    tags: ['research', 'voice'],
  },
  {
    id: 'seed-task-7',
    title: 'Write core architectural specs',
    description: 'Document the model routing layers, task execution bounds, and agent state machines.',
    context: 'Documentation task',
    status: 'todo',
    priority: 'low',
    assignee: 'Docs',
    agentId: 'agent-docs',
    createdAt: now,
    updatedAt: now,
    dueDate: new Date(now + 86400000 * 10).toISOString().slice(0, 10),
    tags: ['docs', 'spec'],
  },
  {
    id: 'seed-task-8',
    title: 'Playwright E2E chat composer tests',
    description: 'Write end-to-end regression tests to verify streaming chat responses under network jitter.',
    context: 'Chat compose test coverage',
    status: 'paused',
    priority: 'medium',
    assignee: 'E2E Tester',
    agentId: 'agent-e2e',
    createdAt: now - 86400000,
    updatedAt: now - 43200000,
    dueDate: new Date(now + 86400000 * 4).toISOString().slice(0, 10),
    tags: ['testing', 'qa'],
  },
];

export interface KanbanState {
  tasks: KanbanTask[];
  addTask: (task: Omit<KanbanTask, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateTask: (id: string, updates: Partial<KanbanTask>) => void;
  moveTask: (id: string, status: TaskStatus) => void;
  deleteTask: (id: string) => void;
  getTasksByStatus: (status: TaskStatus) => KanbanTask[];
  getTasksByAgent: (agentName: string) => KanbanTask[];
}

export const useKanbanStore = create<KanbanState>()(
  persist(
    (set, get) => ({
      tasks: SEED_TASKS,
      addTask: (task) => {
        const id = generateId();
        set((state) => ({
          tasks: [...state.tasks, { ...task, id, createdAt: Date.now(), updatedAt: Date.now() }],
        }));
        return id;
      },
      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t
          ),
        }));
      },
      moveTask: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status, updatedAt: Date.now() } : t
          ),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
      getTasksByStatus: (status) => get().tasks.filter((t) => t.status === status),
      getTasksByAgent: (agentName) => get().tasks.filter((t) => t.assignee === agentName),
    }),
    { name: 'overlord-kanban', partialize: (state) => ({ tasks: state.tasks.slice(0, 200) }) }
  )
);
