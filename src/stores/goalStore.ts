import { create } from "zustand";

export interface Milestone {
  id: string;
  title: string;
  done: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  status: "active" | "completed" | "paused" | "archived";
  progress: number;
  milestones: Milestone[];
  workspace_id?: string;
  linear_issue_id?: string;
  github_issue_id?: string;
  created_at: number;
  updated_at: number;
}

interface GoalState {
  goals: Goal[];
  loading: boolean;
  fetchGoals: () => Promise<void>;
  createGoal: (title: string, description?: string, milestones?: Milestone[]) => Promise<void>;
  updateGoal: (id: string, data: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  loading: false,

  fetchGoals: async () => {
    set({ loading: true });
    try {
      const res = await fetch("/api/goals");
      const data = await res.json();
      set({ goals: data.goals || [] });
    } catch {
      // ignore
    }
    set({ loading: false });
  },

  createGoal: async (title: string, description?: string, milestones?: Milestone[]) => {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, milestones }),
    });
    await get().fetchGoals();
  },

  updateGoal: async (id: string, data: Partial<Goal>) => {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    await get().fetchGoals();
  },

  deleteGoal: async (id: string) => {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    await get().fetchGoals();
  },
}));
