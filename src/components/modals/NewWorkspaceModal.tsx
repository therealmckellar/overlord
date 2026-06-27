"use client";

import { useState } from "react";
import { useWorkspaceStore } from "@/stores";

interface Props {
  onClose: () => void;
}

export function NewWorkspaceModal({ onClose }: Props) {
  const [name, setName] = useState("");
  const [baseBranch, setBaseBranch] = useState("main");
  const [creating, setCreating] = useState(false);
  const { createWorkspace } = useWorkspaceStore();

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const result = await createWorkspace(name.trim(), baseBranch);
    setCreating(false);
    if (result) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--overlay)]">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">New Workspace</h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. feature-auth-redesign"
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-3 py-2 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Base Branch</label>
            <input
              type="text"
              value={baseBranch}
              onChange={(e) => setBaseBranch(e.target.value)}
              className="w-full bg-[var(--bg-tertiary)] border border-[var(--border)] rounded px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !name.trim()}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
