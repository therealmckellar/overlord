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
const SEED_TASKS: KanbanTask[] = [];

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
