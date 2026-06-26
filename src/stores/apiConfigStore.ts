import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ApiConfig {
  agentId: string;
  provider: string;
  model: string;
  apiKey: string;
}

interface ApiConfigState {
  configs: Record<string, ApiConfig>;
  setConfig: (agentId: string, config: Partial<ApiConfig>) => void;
  getConfig: (agentId: string) => ApiConfig | undefined;
  deleteConfig: (agentId: string) => void;
}

export const useApiConfigStore = create<ApiConfigState>()(
  persist(
    (set, get) => ({
      configs: {},
      setConfig: (agentId, config) => {
        set((state) => ({
          configs: {
            ...state.configs,
            [agentId]: { ...state.configs[agentId], ...config },
          },
        }));
      },
      getConfig: (agentId) => get().configs[agentId],
      deleteConfig: (agentId) => {
        set((state) => {
          const newConfigs = { ...state.configs };
          delete newConfigs[agentId];
          return { configs: newConfigs };
        });
      },
    }),
    { 
      name: 'overlord-api-config',
      partialize: (state) => state.configs, // In a real app, we might encrypt this
    }
  )
);
