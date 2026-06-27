"use client";

import { useState } from "react";
import { useGoalStore, type Milestone } from "@/stores";

interface Props {
  onClose: () => void;
}

export function GoalModal({ onClose }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [newMilestone, setNewMilestone] = useState("");
  const { createGoal } = useGoalStore();

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, { id: crypto.randomUUID(), title: newMilestone.trim(), done: false }]);
    setNewMilestone("");
  };

  const toggleMilestone = (id: string) => {
    setMilestones(milestones.map((m) => m.id === id ? { ...m, done: !m.done } : m));
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    await createGoal(title.trim(), description.trim() || undefined, milestones.length > 0 ? milestones : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">New Goal</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Launch v2 dashboard"
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-3 py-2 text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-3 py-2 text-sm resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Milestones</label>
            {milestones.map((m) => (
              <div key={m.id} className="flex items-center gap-2 mb-1">
                <input
                  type="checkbox"
                  checked={m.done}
                  onChange={() => toggleMilestone(m.id)}
                  className="rounded"
                />
                <span className="text-sm flex-1">{m.title}</span>
              </div>
            ))}
            <div className="flex gap-2">
              <input
                type="text"
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                placeholder="Add milestone..."
                className="flex-1 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-2 py-1 text-sm"
                onKeyDown={(e) => e.key === "Enter" && addMilestone()}
              />
              <button onClick={addMilestone} className="px-2 py-1 text-xs bg-[var(--bg-tertiary)] border border-[var(--border)] rounded">
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim()}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            Create Goal
          </button>
        </div>
      </div>
    </div>
  );
}
