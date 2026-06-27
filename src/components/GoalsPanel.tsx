"use client";

import { useEffect, useState } from "react";
import { useGoalStore } from "@/stores";
import { GoalModal } from "./modals/GoalModal";

export default function GoalsPanel() {
  const { goals, loading, fetchGoals, updateGoal, deleteGoal } = useGoalStore();
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const toggleMilestone = async (goalId: string, milestoneId: string, milestones: any[]) => {
    const updated = milestones.map((m: any) =>
      m.id === milestoneId ? { ...m, done: !m.done } : m
    );
    const progress = Math.round((updated.filter((m: any) => m.done).length / updated.length) * 100);
    await updateGoal(goalId, { milestones: updated, progress });
  };

  if (loading && goals.length === 0) {
    return <div className="p-6 text-[var(--text-muted)]">Loading goals...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold">Goals</h2>
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)]"
        >
          + New Goal
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {goals.length === 0 && (
          <div className="text-[var(--text-muted)] text-sm">No goals yet. Create one to track progress.</div>
        )}

        {goals.map((goal) => (
          <div key={goal.id} className="border border-[var(--border)] rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{goal.title}</h3>
                {goal.description && (
                  <p className="text-xs text-[var(--text-muted)] mt-1">{goal.description}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  goal.status === "active" ? "bg-green-900/40 text-green-400" :
                  goal.status === "completed" ? "bg-blue-900/40 text-blue-400" :
                  "bg-gray-800 text-gray-400"
                }`}>
                  {goal.status}
                </span>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Progress bar */}
            {goal.milestones && goal.milestones.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                  <span>{goal.milestones.filter((m: any) => m.done).length}/{goal.milestones.length} milestones</span>
                  <span>{goal.progress}%</span>
                </div>
                <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[var(--accent)] transition-all"
                    style={{ width: `${goal.progress}%` }}
                  />
                </div>

                <div className="mt-2 space-y-1">
                  {goal.milestones.map((m: any) => (
                    <label key={m.id} className="flex items-center gap-2 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={m.done}
                        onChange={() => toggleMilestone(goal.id, m.id, goal.milestones)}
                        className="rounded"
                      />
                      <span className={m.done ? "line-through text-[var(--text-muted)]" : ""}>
                        {m.title}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Quick progress update */}
            <div className="mt-3 flex items-center gap-2">
              <input
                type="range"
                min="0"
                max="100"
                value={goal.progress}
                onChange={(e) => updateGoal(goal.id, { progress: parseInt(e.target.value) })}
                className="flex-1 h-1"
              />
              <span className="text-xs text-[var(--text-muted)] w-8">{goal.progress}%</span>
            </div>
          </div>
        ))}
      </div>

      {showNew && <GoalModal onClose={() => { setShowNew(false); fetchGoals(); }} />}
    </div>
  );
}
