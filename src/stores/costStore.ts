import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type CircuitBreakerStatus = 'normal' | 'warning' | 'critical' | 'blown';

interface CostState {
  sessionBudget: number;
  currentSpend: number;
  perAgentSpend: Record<string, number>;
  perModelSpend: Record<string, number>;
  warningThresholds: {
    warning: number; // e.g. 0.7 for 70%
    critical: number; // e.g. 0.9 for 90%
  };
  circuitBreakerEnabled: boolean;

  // Actions
  setBudget: (amount: number) => void;
  setThresholds: (warning: number, critical: number) => void;
  setCircuitBreakerEnabled: (enabled: boolean) => void;
  recordSpend: (agentId: string, model: string, cost: number) => void;
  resetSession: () => void;
}

export const useCostStore = create<CostState>()(
  persist(
    (set, get) => ({
      sessionBudget: 25.0,
      currentSpend: 0,
      perAgentSpend: {},
      perModelSpend: {},
      warningThresholds: {
        warning: 0.7,
        critical: 0.9,
      },
      circuitBreakerEnabled: true,

      setBudget: (amount) => set({ sessionBudget: amount }),
      setThresholds: (warning, critical) => set({ warningThresholds: { warning, critical } }),
      setCircuitBreakerEnabled: (enabled) => set({ circuitBreakerEnabled: enabled }),

      recordSpend: (agentId, model, cost) => {
        set((state) => {
          const newSpend = state.currentSpend + cost;
          const newAgentSpend = { ...state.perAgentSpend, [agentId]: (state.perAgentSpend[agentId] || 0) + cost };
          const newModelSpend = { ...state.perModelSpend, [model]: (state.perModelSpend[model] || 0) + cost };
          return {
            currentSpend: newSpend,
            perAgentSpend: newAgentSpend,
            perModelSpend: newModelSpend,
          };
        });
      },

      resetSession: () => set({
        currentSpend: 0,
        perAgentSpend: {},
        perModelSpend: {},
      }),
    }),
    {
      name: 'overlord-cost-control',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const getCircuitBreakerStatus = (state: CostState): CircuitBreakerStatus => {
  const ratio = state.currentSpend / state.sessionBudget;
  if (ratio >= 1.0) return 'blown';
  if (ratio >= state.warningThresholds.critical) return 'critical';
  if (ratio >= state.warningThresholds.warning) return 'warning';
  return 'normal';
};
