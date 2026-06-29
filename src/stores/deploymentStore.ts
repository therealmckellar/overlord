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

const SEED_DEPLOYMENTS: AgentDeployment[] = [];

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
    { name: 'overlord-deployments', partialize: (state) => ({ deployments: state.deployments.slice(0, 20).map(d => ({ ...d, logs: d.logs.slice(-20) })) }) }
  )
);
