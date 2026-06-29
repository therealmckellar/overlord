import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type PipelineStage = 'draft' | 'format' | 'review' | 'publish';
export type PipelineStatus = 'idle' | 'running' | 'complete' | 'error';

export interface PipelineTask {
  id: string;
  title: string;
  content: string;
  targetFormat: 'blog' | 'email' | 'social' | 'deck' | 'newsletter';
  status: PipelineStatus;
  currentStage: PipelineStage;
  stages: { name: PipelineStage; status: PipelineStatus; output?: string }[];
  createdAt: number;
  updatedAt: number;
}

interface PipelineState {
  tasks: PipelineTask[];
  addTask: (title: string, content: string, targetFormat: PipelineTask['targetFormat']) => string;
  updateTaskStage: (id: string, stage: PipelineStage, status: PipelineStatus, output?: string) => void;
  updateTaskStatus: (id: string, status: PipelineStatus) => void;
  deleteTask: (id: string) => void;
  clearComplete: () => void;
}

const generateId = () => `pipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const createStages = (): PipelineTask['stages'] => [
  { name: 'draft', status: 'idle' },
  { name: 'format', status: 'idle' },
  { name: 'review', status: 'idle' },
  { name: 'publish', status: 'idle' },
];

const SEED_TASKS: PipelineTask[] = [];

export const usePipelineStore = create<PipelineState>()(
  persist(
    (set) => ({
      tasks: SEED_TASKS,
      addTask: (title, content, targetFormat) => {
        const id = generateId();
        set((state) => ({
          tasks: [...state.tasks, {
            id,
            title,
            content,
            targetFormat,
            status: 'running',
            currentStage: 'draft',
            stages: createStages().map((s, i) => 
              i === 0 ? { ...s, status: 'running' } : s
            ),
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }],
        }));
        return id;
      },
      updateTaskStage: (id, stage, status, output) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  stages: t.stages.map((s) =>
                    s.name === stage ? { ...s, status, output: output ?? s.output } : s
                  ),
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      },
      updateTaskStatus: (id, status) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status, updatedAt: Date.now() } : t)),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
      },
      clearComplete: () => {
        set((state) => ({ tasks: state.tasks.filter((t) => t.status !== 'complete') }));
      },
    }),
{ name: 'overlord-pipeline', partialize: (state) => ({ tasks: state.tasks.slice(0, 50) }) }
  )
);
