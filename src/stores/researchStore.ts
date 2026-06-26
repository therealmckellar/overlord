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

const SEED_RESEARCH: ResearchTask[] = [
  {
    id: 'res_seed_1',
    topic: 'Julian Goldie Agent OS Architecture',
    agentId: 'agent-researcher',
    status: 'complete',
    result: 'Comprehensive analysis of the Goldie stack...',
    summary: 'Identified 4 core layers: Orchestration, Memory, Execution, and Verification.',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'res_seed_2',
    topic: 'MCA Market Trends Q2 2026',
    agentId: 'agent-researcher',
    status: 'complete',
    result: 'Market shift towards AI-driven underwriting...',
    summary: 'Increased demand for fast-funding’s in construction and logistics.',
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'res_seed_3',
    topic: 'Competitor API analysis: Documenso vs PandaDoc',
    agentId: 'agent-researcher',
    status: 'researching',
    result: null,
    summary: null,
    createdAt: Date.now() - 3600000,
    updatedAt: Date.now() - 3600000,
  },
  {
    id: 'res_seed_4',
    topic: 'Next.js 16.2.9 breaking changes for SSE',
    agentId: 'agent-researcher',
    status: 'queued',
    result: null,
    summary: null,
    createdAt: Date.now() - 600000,
    updatedAt: Date.now() - 600000,
  },
];

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
    { name: 'overlord-research' }
  )
);
