import { create } from 'zustand';
import { SafetyRule, SafetyAction, DEFAULT_SAFETY_RULES } from '@/lib/safetyRules';

export type SafetyViolation = {
  id: string;
  timestamp: string;
  command: string;
  ruleId: string;
  action: SafetyAction;
  status: 'blocked' | 'overridden';
};

interface SafetyState {
  rules: SafetyRule[];
  violations: SafetyViolation[];
  setRuleAction: (ruleId: string, action: SafetyAction) => void;
  toggleRule: (ruleId: string) => void;
  addCustomRule: (rule: Omit<SafetyRule, 'id'>) => void;
  removeRule: (ruleId: string) => void;
  logViolation: (violation: Omit<SafetyViolation, 'id'>) => void;
  importRules: (rules: SafetyRule[]) => void;
  exportRules: () => SafetyRule[];
  fetchViolations: () => Promise<void>;
}

export const useSafetyStore = create<SafetyState>((set, get) => ({
  rules: DEFAULT_SAFETY_RULES,
  violations: [],
  setRuleAction: (ruleId, action) => set((state) => ({
    rules: state.rules.map(r => r.id === ruleId ? { ...r, action } : r)
  })),
  toggleRule: (ruleId) => set((state) => ({
    rules: state.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
  })),
  addCustomRule: (rule) => set((state) => ({
    rules: [
      ...state.rules, 
      { ...rule, id: `custom-${Date.now()}` }
    ]
  })),
  removeRule: (ruleId) => set((state) => ({
    rules: state.rules.filter(r => r.id !== ruleId)
  })),
  logViolation: (violation) => set((state) => ({
    violations: [
      { ...violation, id: `viol-${Date.now()}` },
      ...state.violations
    ]
  })),
  importRules: (rules) => set({ rules }),
  exportRules: () => get().rules,
  fetchViolations: async () => {
    try {
      const res = await fetch('/api/safety/violations');
      const data = await res.json();
      set({ violations: data });
    } catch (e) {
      console.error('Failed to fetch safety violations', e);
    }
  },
}));
