import { create } from 'zustand';

export interface DocStatus {
  readmeCurrent: boolean;
  apiDocsUpdated: boolean;
  changelogAdded: boolean;
  lastChecked: number;
  pendingChanges: string[];
}

interface DocState {
  status: DocStatus | null;
  isUpdating: boolean;
  updateDiff: string | null;
  checkDocs: () => Promise<void>;
  triggerUpdate: () => Promise<void>;
  setDiff: (diff: string | null) => void;
}

export const useDocStore = create<DocState>((set) => ({
  status: null,
  isUpdating: false,
  updateDiff: null,
  checkDocs: async () => {
    const res = await fetch('/api/docs/check', { method: 'POST' });
    const data = await res.json();
    set({ status: data });
  },
  triggerUpdate: async () => {
    set({ isUpdating: true });
    const res = await fetch('/api/docs/update', { method: 'POST' });
    const data = await res.json();
    set({ isUpdating: false, updateDiff: data.diff });
  },
  setDiff: (diff) => set({ updateDiff: diff }),
}));
