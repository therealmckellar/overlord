import { create } from 'zustand';

export type Severity = 'CRITICAL' | 'WARNING' | 'INFO';
export type Category = 'Security' | 'Bugs' | 'Performance' | 'Readability' | 'Style';

export interface Finding {
  file: string;
  line: number;
  severity: Severity;
  category: Category;
  message: string;
  suggestion: string;
}

interface ReviewState {
  findings: Finding[];
  passed: boolean;
  loading: boolean;
  lastReviewDate: string | null;
  setFindings: (findings: Finding[], passed: boolean) => void;
  setLoading: (loading: boolean) => void;
  clearFindings: () => void;
}

export const useReviewStore = create<ReviewState>((set) => ({
  findings: [],
  passed: true,
  loading: false,
  lastReviewDate: null,
  setFindings: (findings, passed) => set({ 
    findings, 
    passed, 
    lastReviewDate: new Date().toISOString() 
  }),
  setLoading: (loading) => set({ loading }),
  clearFindings: () => set({ findings: [], passed: true, lastReviewDate: null }),
}));
