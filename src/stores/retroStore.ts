import { create } from 'zustand';

export interface RetroSummary {
  id: string;
  dateRange: { from: string; to: string };
  shipped: string[];
  broke: string[];
  agentPerformance: {
    tasksCompleted: number;
    successRate: number;
    avgTime: string;
  };
  costSummary: {
    totalSpend: number;
    perAgent: Record<string, number>;
    perModel: Record<string, number>;
  };
  decisions: string[];
  lessons: string[];
  markdown: string;
  createdAt: number;
}

interface RetroState {
  retros: RetroSummary[];
  isLoading: boolean;
  error: string | null;

  setRetros: (retros: RetroSummary[]) => void;
  addRetro: (retro: RetroSummary) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useRetroStore = create<RetroState>()((set) => ({
  retros: [],
  isLoading: false,
  error: null,

  setRetros: (retros) => set({ retros }),
  addRetro: (retro) => set((state) => ({ retros: [retro, ...state.retros] })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
