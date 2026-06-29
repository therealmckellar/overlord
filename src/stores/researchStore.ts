import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ResearchStatus = 'queued' | 'researching' | 'complete' | 'failed';

export interface ResearchTask {
  id: string;
  topic: string;
  agentId: string;
  status: ResearchStatus;
  result: string | null;
  summary: string | null;
  createdAt: number;
  updatedAt: number;
}

interface ResearchState {
  queue: ResearchTask[];
  addTopic: (topic: string, agentId: string) => string;
  updateStatus: (id: string, status: ResearchStatus, result?: string, summary?: string) => void;
  deleteTask: (id: string) => void;
}

const generateId = () => `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const SEED_RESEARCH: ResearchTask[] = [];

export const useResearchStore = create<ResearchState>()(
  persist(
    (set) => ({
      queue: SEED_RESEARCH,
      addTopic: (topic, agentId) => {
        const id = generateId();
        set((state) => ({
          queue: [...state.queue, {
            id,
            topic,
            agentId,
            status: 'queued',
            result: null,
            summary: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }],
        }));
        return id;
      },
      updateStatus: (id, status, result, summary) => {
        set((state) => ({
          queue: state.queue.map((t) =>
            t.id === id ? { ...t, status, result: result ?? t.result, summary: summary ?? t.summary, updatedAt: Date.now() } : t
          ),
        }));
      },
      deleteTask: (id) => {
        set((state) => ({ queue: state.queue.filter((t) => t.id !== id) }));
      },
    }),
    { name: 'overlord-research', partialize: (state) => ({ queue: state.queue.slice(0, 20) }) }
  )
);
