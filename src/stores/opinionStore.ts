import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ComparisonResult } from '@/lib/opinionCompare';

export interface OpinionComparison {
  id: string;
  prompt: string;
  model1: string;
  model2: string;
  output1: string;
  output2: string;
  result: ComparisonResult;
  timestamp: string;
}

interface OpinionState {
  comparisons: OpinionComparison[];
  currentComparisonId: string | null;
  isLoading: boolean;
  error: string | null;
  addComparison: (comparison: OpinionComparison) => void;
  setCurrentComparison: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearHistory: () => void;
}

export const useOpinionStore = create<OpinionState>()(
  persist(
    (set) => ({
      comparisons: [],
      currentComparisonId: null,
      isLoading: false,
      error: null,
      addComparison: (comparison) =>
        set((state) => ({
          comparisons: [comparison, ...state.comparisons],
        })),
      setCurrentComparison: (id) => set({ currentComparisonId: id }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      clearHistory: () => set({ comparisons: [] }),
    }),
    {
      name: 'overlord-opinions',
    }
  )
);
