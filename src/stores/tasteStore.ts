import { create } from 'zustand';

export interface TasteProfile {
  id: string;
  rules: {
    colors: string[];
    layouts: string[];
    tone: string[];
    patterns: string[];
  };
  lastAnalyzed: number;
  description: string;
}

interface TasteState {
  profile: TasteProfile | null;
  isLoading: boolean;
  error: string | null;

  setProfile: (profile: TasteProfile) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useTasteStore = create<TasteState>()((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
