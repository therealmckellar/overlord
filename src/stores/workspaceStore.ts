import { create } from "zustand";

export interface WorkspaceComment {
  id: string;
  workspace_id: string;
  file_path: string;
  line_number: number;
  content: string;
  author?: string;
  created_at: number;
}

export interface Workspace {
  id: string;
  name: string;
  branch: string;
  base_branch: string;
  status: "active" | "merged" | "archived";
  created_by?: string;
  repo_path?: string;
  worktree_path?: string;
  pr_url?: string;
  pr_number?: number;
  created_at: number;
  updated_at: number;
}

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  loading: boolean;
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (name: string, baseBranch?: string) => Promise<{ id: string; branch: string } | null>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (ws: Workspace | null) => void;
  updateWorkspace: (id: string, data: Partial<Workspace>) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  loading: false,

  fetchWorkspaces: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/workspaces");
      const data = await res.json();
      set({ workspaces: data.workspaces || [] });
    } catch {
      // ignore
    }
    set({ loading: false });
  },

  createWorkspace: async (name: string, baseBranch = "main") => {
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, base_branch: baseBranch }),
      });
      const data = await res.json();
      if (data.id) {
        await get().fetchWorkspaces();
        return { id: data.id, branch: data.branch };
      }
      return null;
    } catch {
      return null;
    }
  },

  deleteWorkspace: async (id: string) => {
    await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
    await get().fetchWorkspaces();
  },

  setActiveWorkspace: (ws) => set({ activeWorkspace: ws }),

  updateWorkspace: async (id: string, data: Partial<Workspace>) => {
    await fetch(`/api/workspaces/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchWorkspaces();
  },
}));
