import { create } from 'zustand';

export type GovernanceLogEntry = {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  need: string;
  risk: string;
  owner: string;
  status: 'approved' | 'overridden';
  overrideReason?: string;
};

interface GovernanceState {
  logs: GovernanceLogEntry[];
  isGateOpen: boolean;
  pendingAction: {
    action: string;
    params: any;
    resolve: (value: boolean) => void;
  } | null;
  setGateOpen: (open: boolean) => void;
  triggerGate: (action: string, params: any) => Promise<boolean>;
  fetchLogs: () => Promise<void>;
}

export const useGovernanceStore = create<GovernanceState>((set, get) => ({
  logs: [],
  isGateOpen: false,
  pendingAction: null,
  setGateOpen: (open) => set({ isGateOpen: open }),
  triggerGate: async (action, params) => {
    return new Promise((resolve) => {
      set({ 
        isGateOpen: true, 
        pendingAction: { action, params, resolve } 
      });
    });
  },
  fetchLogs: async () => {
    try {
      const res = await fetch('/api/governance/log');
      const data = await res.json();
      set({ logs: data });
    } catch (e) {
      console.error('Failed to fetch governance logs', e);
    }
  },
}));
