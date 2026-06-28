import { create } from 'zustand';
import { DriftType } from '../lib/scopeTracker';

export interface ScopeAlert {
  id: string;
  taskId: string;
  workspaceId: string;
  pipelineId?: string;
  agentId: string;
  originalScope: string;
  proposedChange: string;
  driftType: DriftType;
  status: 'pending' | 'approved' | 'rejected' | 'deferred';
  detectedAt: Date;
  actualOutput: string;
}

export interface ScopeStats {
  driftRate: number;
  acceptanceRate: number;
  timeSaved: number;
}

interface ScopeState {
  alerts: ScopeAlert[];
  stats: Record<string, ScopeStats>; // agentId -> stats
  addAlert: (alert: ScopeAlert) => void;
  resolveAlert: (id: string, status: 'approved' | 'rejected' | 'deferred') => void;
  getAlertsForWorkspace: (workspaceId: string) => ScopeAlert[];
}

export const useScopeStore = create<ScopeState>((set) => ({
  alerts: [],
  stats: {},
  addAlert: (alert) => set((state) => ({ 
    alerts: [...state.alerts, alert] 
  })),
  resolveAlert: (id, status) => set((state) => {
    const newAlerts = state.alerts.map(a => a.id === id ? { ...a, status } : a);
    
    // Update stats for the agent
    const alert = state.alerts.find(a => a.id === id);
    if (!alert) return { alerts: newAlerts };
    
    const agentId = alert.agentId;
    const currentStats = state.stats[agentId] || { driftRate: 0, acceptanceRate: 0, timeSaved: 0 };
    
    // This is a simplified stats update logic
    const updatedStats = { ...currentStats };
    if (status === 'approved') {
      updatedStats.acceptanceRate += 0.1; // Dummy increment
    } else if (status === 'rejected') {
      updatedStats.timeSaved += 30; // Dummy minutes saved
    }
    
    return { 
      alerts: newAlerts,
      stats: { ...state.stats, [agentId]: updatedStats }
    };
  }),
  getAlertsForWorkspace: (workspaceId) => {
    // This is a getter, but Zustand stores often handle filtering in components
    return []; // Placeholder for actual implementation in component
  }
}));
