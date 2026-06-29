import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface FailureLog {
  id: string;
  timestamp: number;
  agentId: string;
  agentName: string;
  type: 'runtime' | 'api' | 'timeout' | 'logic';
  message: string;
  stack?: string;
  resolved: boolean;
}

interface FailureLogState {
  logs: FailureLog[];
  addLog: (log: Omit<FailureLog, 'id' | 'timestamp'>) => void;
  resolveLog: (id: string) => void;
  deleteLog: (id: string) => void;
  clearLogs: () => void;
}

const generateId = () => `fail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const now = Date.now();

const SEED_FAILURES: FailureLog[] = [];

export const useFailureLogStore = create<FailureLogState>()(
  persist(
    (set) => ({
      logs: SEED_FAILURES,
      addLog: (log) => {
        set((state) => ({
          logs: [{ ...log, id: generateId(), timestamp: Date.now() }, ...state.logs],
        }));
      },
      resolveLog: (id) => {
        set((state) => ({
          logs: state.logs.map((l) => (l.id === id ? { ...l, resolved: true } : l)),
        }));
      },
      deleteLog: (id) => {
        set((state) => ({ logs: state.logs.filter((l) => l.id !== id) }));
      },
      clearLogs: () => set({ logs: [] }),
    }),
    { name: 'overlord-failure-logs', partialize: (state) => ({ logs: state.logs.slice(0, 100) }) }
  )
);
