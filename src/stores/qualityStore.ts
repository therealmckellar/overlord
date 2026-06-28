import { create } from 'zustand';
import { AssertionRule, QualityReport } from '../lib/qualityEngine';

interface QualityState {
  savedRules: Record<string, AssertionRule[]>;
  history: QualityReport[];
  currentOutput: string;
  
  setSavedRules: (rules: Record<string, AssertionRule[]>) => void;
  saveRuleSet: (name: string, rules: AssertionRule[]) => void;
  addHistory: (report: QualityReport) => void;
  setOutput: (output: string) => void;
}

export const useQualityStore = create<QualityState>((set) => ({
  savedRules: {
    'Default-Agent': [
      { id: 'len-1', type: 'LENGTH', params: { min: 10, max: 1000 }, description: 'Reasonable length', weight: 1 },
      { id: 'slop-1', type: 'NO_BANNED', params: { banned: ['delve', 'tapestry', 'in conclusion', 'multifaceted'] }, description: 'No AI slop', weight: 2 },
    ],
  },
  history: [],
  currentOutput: '',

  setSavedRules: (rules) => set({ savedRules: rules }),
  saveRuleSet: (name, rules) => set((state) => ({
    savedRules: { ...state.savedRules, [name]: rules }
  })),
  addHistory: (report) => set((state) => ({
    history: [report, ...state.history].slice(0, 100)
  })),
  setOutput: (output) => set({ currentOutput: output }),
}));
