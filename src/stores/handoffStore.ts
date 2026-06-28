import { create } from 'zustand';

export interface Handoff {
  id: string;
  taskId: string;
  fromAgent: string;
  toAgent: string;
  summary: string;
  filesModified: string[];
  decisions: string[];
  openQuestions: string[];
  timestamp: string;
  status: 'pending' | 'accepted' | 'completed';
  context: any;
}

interface HandoffState {
  handoffs: Handoff[];
  activeHandoff: Handoff | null;
  setHandoffs: (handoffs: Handoff[]) => void;
  addHandoff: (handoff: Handoff) => void;
  setActiveHandoff: (handoff: Handoff | null) => void;
  updateHandoffStatus: (id: string, status: Handoff['status']) => void;
}

export const useHandoffStore = create<HandoffState>((set) => ({
  handoffs: [],
  activeHandoff: null,
  setHandoffs: (handoffs) => set({ handoffs }),
  addHandoff: (handoff) => set((state) => ({ handoffs: [...state.handoffs, handoff] })),
  setActiveHandoff: (activeHandoff) => set({ activeHandoff }),
  updateHandoffStatus: (id, status) => set((state) => ({
    handoffs: state.handoffs.map((h) => h.id === id ? { ...h, status } : h),
  })),
}));
