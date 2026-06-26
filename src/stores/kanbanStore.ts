import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'review' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee: string | null; // agent name or 'Rich'
  agentId: string | null; // agent preset id
  createdAt: number;
  updatedAt: number;
  dueDate: string | null;
  tags: string[];
}

const COLUMNS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

const COLUMN_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const COLUMN_COLORS: Record<TaskStatus, string> = {
  backlog: '#6b7280',
  todo: '#3b82f6',
  in_progress: '#f59e0b',
  review: '#8b5cf6',
  done: '#10b981',
};

export { COLUMNS, COLUMN_LABELS, COLUMN_COLORS };

const generateId = () => `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Seed tasks
const now = Date.now();
const SEED_TASKS: KanbanTask[] = [
  {
    id: 'task_seed_1',
    title: 'Wire up Loop Engine cancel/edit controls',
    description: 'Add stop/cancel buttons per loop, stop-all in header, edit modal for name/model/iterations',
    status: 'done',
    priority: 'urgent',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
    dueDate: null,
    tags: ['overlord', 'loops'],
  },
  {
    id: 'task_seed_2',
    title: 'Build Agent Designer panel',
    description: 'Full form: name, role, model, system prompt, tools, output format, temperature. Save presets. Deploy.',
    status: 'done',
    priority: 'urgent',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
    dueDate: null,
    tags: ['overlord', 'agents'],
  },
  {
    id: 'task_seed_3',
    title: 'Create Studio with code editor + terminal',
    description: 'Monaco-like editor with syntax highlighting, file browser, terminal emulator, pipeline runner',
    status: 'done',
    priority: 'high',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 86400000,
    updatedAt: now - 3600000,
    dueDate: null,
    tags: ['overlord', 'studio'],
  },
  {
    id: 'task_seed_4',
    title: 'Implement Mission Control dashboard',
    description: 'Live agent monitoring: status, health, activity feed, cancel/restart controls',
    status: 'in_progress',
    priority: 'high',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 43200000,
    updatedAt: now - 1800000,
    dueDate: null,
    tags: ['overlord', 'monitoring'],
  },
  {
    id: 'task_seed_5',
    title: 'Build Agent Deployment Pipeline',
    description: 'Deploy agents from Designer, track status, view logs, rollback deployments',
    status: 'todo',
    priority: 'high',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 43200000,
    updatedAt: now - 43200000,
    dueDate: null,
    tags: ['overlord', 'deployment'],
  },
  {
    id: 'task_seed_6',
    title: 'Skills & Playbooks system',
    description: 'Skill library, playbook builder, attach skills to agents at deployment',
    status: 'todo',
    priority: 'medium',
    assignee: 'Builder',
    agentId: null,
    createdAt: now - 43200000,
    updatedAt: now - 43200000,
    dueDate: null,
    tags: ['overlord', 'skills'],
  },
  {
    id: 'task_seed_7',
    title: 'Audit vs Julian Goldie Agent OS',
    description: 'Compare current state to goldie.com, document gaps, prioritize fixes',
    status: 'backlog',
    priority: 'medium',
    assignee: 'Rich',
    agentId: null,
    createdAt: now - 86400000,
    updatedAt: now - 86400000,
    dueDate: null,
    tags: ['overlord', 'audit'],
  },
  {
    id: 'task_seed_8',
    title: 'Replace TUI completely with Overlord',
    description: 'Ensure all CLI functions are available in UI. No TUI dependency remaining.',
    status: 'backlog',
    priority: 'high',
    assignee: 'Rich',
    agentId: null,
    createdAt: now - 86400000,
    updatedAt: now - 86400000,
    dueDate: null,
    tags: ['overlord', 'tui-replacement'],
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
    { name: 'overlord-kanban' }
  )
);
