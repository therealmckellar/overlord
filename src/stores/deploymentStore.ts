import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DeploymentStatus = 'pending' | 'building' | 'deploying' | 'live' | 'failed' | 'rolled_back';

export interface DeploymentLog {
  id: string;
  text: string;
  timestamp: number;
  level: 'info' | 'success' | 'warning' | 'error';
}

export interface AgentDeployment {
  id: string;
  agentName: string;
  agentId: string;
  version: string;
  status: DeploymentStatus;
  environment: 'staging' | 'production';
  endpoint: string | null;
  startedAt: number;
  completedAt: number | null;
  logs: DeploymentLog[];
  rollbackVersion: string | null;
}

const generateId = () => `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
const now = Date.now();

const SEED_DEPLOYMENTS: AgentDeployment[] = [
  {
    id: 'deploy_1',
    agentName: 'Builder',
    agentId: 'agent_designer_1',
    version: 'v1.2.0',
    status: 'live',
    environment: 'production',
    endpoint: 'https://api.mckellar.dev/agents/builder',
    startedAt: now - 3600000,
    completedAt: now - 3540000,
    logs: [
      { id: 'd1', text: '[INFO] Build started', timestamp: now - 3600000, level: 'info' },
      { id: 'd2', text: '[INFO] Compiling TypeScript...', timestamp: now - 3580000, level: 'info' },
      { id: 'd3', text: '[SUCCESS] Build complete (12.4s)', timestamp: now - 3550000, level: 'success' },
      { id: 'd4', text: '[INFO] Deploying to production...', timestamp: now - 3545000, level: 'info' },
      { id: 'd5', text: '[SUCCESS] Deployment live at /agents/builder', timestamp: now - 3540000, level: 'success' },
    ],
    rollbackVersion: 'v1.1.9',
  },
  {
    id: 'deploy_2',
    agentName: 'Explorer',
    agentId: 'agent_designer_2',
    version: 'v0.1.0',
    status: 'building',
    environment: 'staging',
    endpoint: null,
    startedAt: now - 60000,
    completedAt: null,
    logs: [
      { id: 'd6', text: '[INFO] Build started', timestamp: now - 60000, level: 'info' },
      { id: 'd7', text: '[INFO] Installing dependencies...', timestamp: now - 55000, level: 'info' },
    ],
    rollbackVersion: null,
  },
  {
    id: 'deploy_3',
    agentName: 'Fast',
    agentId: 'agent_designer_3',
    version: 'v0.0.3',
    status: 'failed',
    environment: 'staging',
    endpoint: null,
    startedAt: now - 86400000,
    completedAt: now - 86340000,
    logs: [
      { id: 'd8', text: '[INFO] Build started', timestamp: now - 86400000, level: 'info' },
      { id: 'd9', text: '[ERROR] TypeScript error: Type mismatch in StudioView.tsx', timestamp: now - 86350000, level: 'error' },
      { id: 'd10', text: '[ERROR] Build failed', timestamp: now - 86340000, level: 'error' },
    ],
    rollbackVersion: 'v0.0.2',
  },
];

export interface DeploymentState {
  deployments: AgentDeployment[];
  addDeployment: (agentName: string, agentId: string, environment: 'staging' | 'production') => string;
  updateDeployment: (id: string, updates: Partial<AgentDeployment>) => void;
  rollbackDeployment: (id: string) => void;
  addDeployLog: (id: string, text: string, level: DeploymentLog['level']) => void;
  getActiveDeployments: () => AgentDeployment[];
}

export const useDeploymentStore = create<DeploymentState>()(
  persist(
    (set, get) => ({
      deployments: SEED_DEPLOYMENTS,
      addDeployment: (agentName, agentId, environment) => {
        const id = generateId();
        const version = `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`;
        set((state) => ({
          deployments: [
            {
              id,
              agentName,
              agentId,
              version,
              status: 'pending',
              environment,
              endpoint: null,
              startedAt: Date.now(),
              completedAt: null,
              logs: [{ id: `log_${Date.now()}`, text: '[INFO] Deployment queued', timestamp: Date.now(), level: 'info' }],
              rollbackVersion: null,
            },
            ...state.deployments,
          ],
        }));
        return id;
      },
      updateDeployment: (id, updates) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id ? { ...d, ...updates } : d
          ),
        }));
      },
      rollbackDeployment: (id) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id
              ? {
                  ...d,
                  status: 'rolled_back' as const,
                  completedAt: Date.now(),
                  logs: [
                    ...d.logs,
                    { id: `log_${Date.now()}`, text: `[WARN] Rolled back to ${d.rollbackVersion || 'previous'}`, timestamp: Date.now(), level: 'warning' as const },
                  ],
                }
              : d
          ),
        }));
      },
      addDeployLog: (id, text, level) => {
        set((state) => ({
          deployments: state.deployments.map((d) =>
            d.id === id
              ? { ...d, logs: [...d.logs, { id: `log_${Date.now()}`, text, timestamp: Date.now(), level }] }
              : d
          ),
        }));
      },
      getActiveDeployments: () =>
        get().deployments.filter((d) => ['pending', 'building', 'deploying'].includes(d.status)),
    }),
    { name: 'overlord-deployments' }
  )
);
