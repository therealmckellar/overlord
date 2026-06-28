import { create } from 'zustand';

export interface CanaryMetric {
  timestamp: number;
  status: number;
  responseTime: number;
  errorRate: number;
}

export interface CanaryStatus {
  id: string;
  deployId: string;
  url: string;
  status: 'running' | 'passed' | 'failed' | 'warning';
  metrics: CanaryMetric[];
  baselineMetrics: {
    responseTime: number;
  };
  consecutiveFailures: number;
  startTime: number;
}

interface CanaryState {
  activeCanaries: Record<string, CanaryStatus>;
  history: CanaryStatus[];
  startCanary: (canary: CanaryStatus) => void;
  updateCanary: (id: string, metric: CanaryMetric) => void;
  stopCanary: (id: string, finalStatus: 'passed' | 'failed') => void;
  setHistory: (history: CanaryStatus[]) => void;
}

export const useCanaryStore = create<CanaryState>((set) => ({
  activeCanaries: {},
  history: [],
  startCanary: (canary) => set((state) => ({
    activeCanaries: { ...state.activeCanaries, [canary.id]: canary }
  })),
  updateCanary: (id, metric) => set((state) => {
    const canary = state.activeCanaries[id];
    if (!canary) return state;

    const isFailure = metric.status !== 200 || metric.responseTime > canary.baselineMetrics.responseTime * 1.5;
    const consecutiveFailures = isFailure ? canary.consecutiveFailures + 1 : 0;
    
    let status: CanaryStatus['status'] = 'running';
    if (consecutiveFailures >= 3) status = 'failed';
    else if (isFailure) status = 'warning';
    else status = 'running';

    return {
      activeCanaries: {
        ...state.activeCanaries,
        [id]: {
          ...canary,
          status,
          consecutiveFailures,
          metrics: [...canary.metrics, metric]
        }
      }
    };
  }),
  stopCanary: (id, finalStatus) => set((state) => {
    const canary = state.activeCanaries[id];
    if (!canary) return state;
    
    const { [id]: removed, ...remaining } = state.activeCanaries;
    return {
      activeCanaries: remaining,
      history: [{ ...canary, status: finalStatus }, ...state.history]
    };
  }),
  setHistory: (history) => set({ history }),
}));
