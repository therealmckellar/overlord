import { create } from 'zustand';

export type TestStatus = 'pending' | 'running' | 'pass' | 'fail';

export interface QAScenario {
  id: string;
  label: string;
  status: TestStatus;
  screenshot?: string;
  error?: string;
}

export interface QASession {
  id: string;
  url: string;
  testType: 'Smoke Test' | 'Full Flow' | 'Custom';
  scenarios: QAScenario[];
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

interface QAState {
  sessions: QASession[];
  currentSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  
  setCurrentSession: (id: string | null) => void;
  setSessions: (sessions: QASession[]) => void;
  updateSession: (id: string, updates: Partial<QASession>) => void;
  updateScenario: (sessionId: string, scenarioId: string, updates: Partial<QAScenario>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useQAStore = create<QAState>((set) => ({
  sessions: [],
  currentSessionId: null,
  isLoading: false,
  error: null,

  setCurrentSession: (id) => set({ currentSessionId: id }),
  setSessions: (sessions) => set({ sessions }),
  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  updateScenario: (sessionId, scenarioId, updates) => set((state) => ({
    sessions: state.sessions.map(s => 
      s.id === sessionId 
        ? { ...s, scenarios: s.scenarios.map(sc => sc.id === scenarioId ? { ...sc, ...updates } : sc) }
        : s
    )
  })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
