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
  progress: number; // 0-100
  startedAt: number;
  lastHeartbeat: number;
  logs: AgentLogEntry[];
  pid: string | null;
}

const generateId = () => `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const now = Date.now();

const SEED_AGENTS: MissionAgent[] = [
  {
    id: 'agent_active_1',
    name: 'Builder',
    status: 'running',
    model: 'gpt-oss-120b',
    task: 'Building Kanban board component',
    progress: 65,
    startedAt: now - 120000,
    lastHeartbeat: now - 5000,
    logs: [
      { id: 'l1', text: '[INFO] Starting task execution', timestamp: now - 120000, level: 'info' as const },
      { id: 'l2', text: '[INFO] Loading kanbanStore.ts', timestamp: now - 110000, level: 'info' as const },
      { id: 'l3', text: '[SUCCESS] Store created with 8 seed tasks', timestamp: now - 100000, level: 'success' as const },
      { id: 'l4', text: '[INFO] Creating KanbanBoard component...', timestamp: now - 90000, level: 'info' as const },
    ],
    pid: 'proc_a1b2c3',
  },
  {
    id: 'agent_active_2',
    name: 'Explorer',
    status: 'idle',
    model: 'nex-n2-pro',
    task: 'Awaiting assignment',
    progress: 0,
    startedAt: 0,
    lastHeartbeat: now - 30000,
    logs: [],
    pid: null,
  },
  {
    id: 'agent_active_3',
    name: 'Reviewer',
    status: 'completed',
    model: 'gpt-oss-120b',
    task: 'Code review of AgentDesigner',
    progress: 100,
    startedAt: now - 300000,
    lastHeartbeat: now - 60000,
    logs: [
      { id: 'l5', text: '[INFO] Review started', timestamp: now - 300000, level: 'info' as const },
      { id: 'l6', text: '[SUCCESS] No critical issues found', timestamp: now - 240000, level: 'success' as const },
      { id: 'l7', text: '[INFO] Review complete', timestamp: now - 60000, level: 'info' as const },
    ],
    pid: null,
  },
  {
    id: 'agent_active_4',
    name: 'Fast',
    status: 'error',
    model: 'nex-n2-pro',
    task: 'Quick audit scan',
    progress: 30,
    startedAt: now - 600000,
    lastHeartbeat: now - 300000,
    logs: [
      { id: 'l8', text: '[INFO] Starting audit', timestamp: now - 600000, level: 'info' as const },
      { id: 'l9', text: '[ERROR] Timeout: target page unreachable', timestamp: now - 300000, level: 'error' as const },
    ],
    pid: null,
  },
];

export interface MissionControlState {
  agents: MissionAgent[];
  activityLog: AgentActivity[];
  addAgent: (name: string, model: string, task: string) => string;
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
      addAgent: (name, model, task) => {
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
