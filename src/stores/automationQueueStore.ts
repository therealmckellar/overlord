import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AutomationTaskType = 'research' | 'content' | 'deployment' | 'sync' | 'scan';
export type AutomationTaskStatus = 'queued' | 'running' | 'complete' | 'failed' | 'cancelled';

export interface AutomationTask {
  id: string;
  type: AutomationTaskType;
  title: string;
  description: string;
  status: AutomationTaskStatus;
  progress: number;
  agentId: string;
  agentName: string;
  result?: string;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

interface AutomationQueueState {
  tasks: AutomationTask[];
  addTask: (task: Omit<AutomationTask, 'id' | 'status' | 'progress' | 'createdAt'>) => string;
  startTask: (id: string) => void;
  completeTask: (id: string, result?: string) => void;
  failTask: (id: string, error: string) => void;
  cancelTask: (id: string) => void;
  retryTask: (id: string) => void;
  clearCompleted: () => void;
  clearAll: () => void;
}

const generateId = () => `auto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useAutomationQueueStore = create<AutomationQueueState>()(
  persist(
    (set) => ({
      tasks: [],
      addTask: (task) => {
        const id = generateId();
        set((state) => ({
          tasks: [...state.tasks, {
            ...task,
            id,
            status: 'queued',
            progress: 0,
            createdAt: Date.now(),
          }],
        }));
        return id;
      },
      startTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'running', startedAt: Date.now() } : t
          ),
        }));
      },
      completeTask: (id, result) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'complete', progress: 100, result, completedAt: Date.now() }
              : t
          ),
        }));
      },
      failTask: (id, error) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'failed', error, completedAt: Date.now() }
              : t
          ),
        }));
      },
      cancelTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'cancelled', completedAt: Date.now() } : t
          ),
        }));
      },
      retryTask: (id) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? { ...t, status: 'queued', progress: 0, error: undefined, result: undefined }
              : t
          ),
        }));
      },
      clearCompleted: () => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.status !== 'complete' && t.status !== 'cancelled'),
        }));
      },
      clearAll: () => set({ tasks: [] }),
    }),
    { name: 'overlord-automation-queue' }
  )
);
