import { create } from 'zustand';

export type DebugPhase = 'REPRODUCE' | 'ISOLATE' | 'FIX' | 'PREVENT';
export type PhaseStatus = 'pending' | 'active' | 'done';

export interface DebugSession {
  id: string;
  workspaceId: string;
  bugDescription: string;
  currentPhase: DebugPhase;
  phases: {
    [key in DebugPhase]: {
      status: PhaseStatus;
      input: string;
      output: string;
      conversation: { role: 'user' | 'agent'; content: string; timestamp: number }[];
    };
  };
  createdAt: number;
  updatedAt: number;
}

interface DebugState {
  sessions: DebugSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  
  setSessions: (sessions: DebugSession[]) => void;
  setActiveSession: (id: string | null) => void;
  updateSession: (id: string, updates: Partial<DebugSession>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useDebugStore = create<DebugState>((set) => ({
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  setSessions: (sessions) => set({ sessions }),
  setActiveSession: (id) => set({ activeSessionId: id }),
  updateSession: (id, updates) => set((state) => ({
    sessions: state.sessions.map(s => s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
