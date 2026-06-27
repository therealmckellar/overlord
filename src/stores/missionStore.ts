import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed' | 'deployed';

export interface AgentActivity {
  id: string;
  agentName: string;
  action: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface AgentLogEntry {
  id: string;
  text: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface MissionAgent {
  id: string;
  name: string;
  status: AgentStatus;
  model: string;
  task: string;
  context: string; // additional instructions / background
  progress: number; // 0-100
  startedAt: number;
  lastHeartbeat: number;
  logs: AgentLogEntry[];
  pid: string | null;
}

const generateId = () => `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const now = Date.now();

const SEED_AGENTS: MissionAgent[] = [];

export interface MissionControlState {
  agents: MissionAgent[];
  activityLog: AgentActivity[];
  addAgent: (name: string, model: string, task: string, context?: string) => string;
  startTask: (id: string, task: string, context?: string) => void;
  updateAgent: (id: string, updates: Partial<MissionAgent>) => void;
  stopAgent: (id: string) => void;
  restartAgent: (id: string) => void;
  addActivity: (agentName: string, action: string, type: AgentActivity['type']) => void;
  getActiveAgents: () => MissionAgent[];
  getAgentById: (id: string) => MissionAgent | undefined;
}

export const useMissionStore = create<MissionControlState>()(
  persist(
    (set, get) => ({
      agents: SEED_AGENTS,
      activityLog: [
        { id: 'a1', agentName: 'Builder', action: 'Started task execution', timestamp: now - 120000, type: 'info' },
        { id: 'a2', agentName: 'Reviewer', action: 'Completed code review', timestamp: now - 60000, type: 'success' },
        { id: 'a3', agentName: 'Fast', action: 'Error: timeout', timestamp: now - 300000, type: 'error' },
      ],
      addAgent: (name, model, task, context = '') => {
        const id = generateId();
        set((state) => ({
          agents: [
            ...state.agents,
            {
              id,
              name,
              status: 'running',
              model,
              task,
              context,
              progress: 0,
              startedAt: Date.now(),
              lastHeartbeat: Date.now(),
              logs: [{ id: `log_${Date.now()}`, text: '[INFO] Agent started', timestamp: Date.now(), level: 'info' as const }],
              pid: null,
            },
          ],
        }));
        return id;
      },
      updateAgent: (id, updates) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, ...updates, lastHeartbeat: Date.now() } : a
          ),
        }));
      },
      startTask: (id, task, context = '') => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id
              ? {
                  ...a,
                  task,
                  context: context || a.context,
                  status: 'running' as const,
                  progress: 0,
                  startedAt: Date.now(),
                  lastHeartbeat: Date.now(),
                  logs: [...a.logs, { id: `log_${Date.now()}`, text: `[INFO] New task assigned: ${task}`, timestamp: Date.now(), level: 'info' as const }],
                }
              : a
          ),
        }));
      },
      stopAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id ? { ...a, status: 'idle' as const, progress: 0, pid: null } : a
          ),
        }));
      },
      restartAgent: (id) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === id
              ? { ...a, status: 'running' as const, progress: 0, startedAt: Date.now(), lastHeartbeat: Date.now(), logs: [...a.logs, { id: `log_${Date.now()}`, text: '[INFO] Agent restarted', timestamp: Date.now(), level: 'info' as const }] }
              : a
          ),
        }));
      },
      addActivity: (agentName, action, type) => {
        set((state) => ({
          activityLog: [
            { id: `act_${Date.now()}`, agentName, action, timestamp: Date.now(), type },
            ...state.activityLog.slice(0, 49),
          ],
        }));
      },
      getActiveAgents: () => get().agents.filter((a) => a.status === 'running' || a.status === 'paused'),
      getAgentById: (id) => get().agents.find((a) => a.id === id),
    }),
    { name: 'overlord-mission-control' }
  )
);
