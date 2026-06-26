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

const SEED_FAILURES: FailureLog[] = [
  {
    id: 'fail_seed_1',
    timestamp: now - 3600000,
    agentId: 'agent-builder',
    agentName: 'Builder',
    type: 'runtime',
    message: 'TypeError: Cannot read property "map" of undefined in KanbanBoard.tsx:42',
    stack: 'Error: TypeError\n  at KanbanBoard.tsx:42:15\n  at render (React.js:102)',
    resolved: false,
  },
  {
    id: 'fail_seed_2',
    timestamp: now - 7200000,
    agentId: 'agent-researcher',
    agentName: 'Researcher',
    type: 'api',
    message: 'Firecrawl API 429: Too Many Requests',
    stack: 'Request failed with status 429',
    resolved: true,
  },
  {
    id: 'fail_seed_3',
    timestamp: now - 10800000,
    agentId: 'agent-orchestrator',
    agentName: 'Orchestrator',
    type: 'timeout',
    message: 'Agent response timeout after 30s',
    stack: 'TimeoutError: response not received',
    resolved: false,
  },
  {
    id: 'fail_seed_4',
    timestamp: now - 14400000,
    agentId: 'agent-explorer',
    agentName: 'Explorer',
    type: 'logic',
    message: 'Circular dependency detected in agent routing graph',
    stack: 'GraphError: Cycle detected: A -> B -> A',
    resolved: true,
  },
  {
    id: 'fail_seed_5',
    timestamp: now - 18000000,
    agentId: 'agent-builder',
    agentName: 'Builder',
    type: 'runtime',
    message: 'Failed to write file to /home/rmckellar/overlord/src/app/page.tsx: Permission denied',
    stack: 'EACCES: permission denied',
    resolved: false,
  },
];

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
    { name: 'overlord-failure-logs' }
  )
);
