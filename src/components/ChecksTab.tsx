"use client";

import { useState } from "react";
import type { Workspace } from "@/stores/workspaceStore";

interface Props {
  workspace: Workspace;
}

export function ChecksTab({ workspace }: Props) {
  const [creating, setCreating] = useState(false);
  const [prUrl, setPrUrl] = useState(workspace.pr_url || "");
  const [merging, setMerging] = useState(false);

  const createPR = async () => {
    setCreating(true);
    try {
      const res = await fetch(`/api/workspaces/${workspace.id}/pr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Workspace: ${workspace.name}` }),
      });
      const data = await res.json();
      if (data.pr_url) setPrUrl(data.pr_url);
    } catch {
      // ignore
    }
    setCreating(false);
  };

  const mergePR = async () => {
    setMerging(true);
    try {
      await fetch(`/api/workspaces/${workspace.id}/merge`, { method: "POST" });
      window.location.reload();
    } catch {
      // ignore
    }
    setMerging(false);
  };

  return (
    <div className="p-4 space-y-4">
      {/* Git status */}
      <div className="border border-[var(--border)] rounded p-3">
        <h3 className="text-sm font-semibold mb-2">Git Status</h3>
        <div className="text-xs space-y-1 text-[var(--text-secondary)]">
          <div>Branch: <span className="font-mono text-[var(--accent)]">{workspace.branch}</span></div>
          <div>Base: <span className="font-mono">{workspace.base_branch}</span></div>
          <div>Status: <span className={
            workspace.status === "active" ? "text-green-400" :
            workspace.status === "merged" ? "text-blue-400" : "text-gray-400"
          }>{workspace.status}</span></div>
        </div>
      </div>

      {/* PR section */}
      <div className="border border-[var(--border)] rounded p-3">
        <h3 className="text-sm font-semibold mb-2">Pull Request</h3>
        {prUrl ? (
          <div className="space-y-2">
            <a
              href={prUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--accent)] hover:underline"
            >
              {prUrl}
            </a>
            {workspace.status === "active" && (
              <button
                onClick={mergePR}
                disabled={merging}
                className="block px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                {merging ? "Merging..." : "Merge PR"}
              </button>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs text-[var(--text-muted)] mb-2">No PR created yet</p>
            {workspace.status === "active" && (
              <button
                onClick={createPR}
                disabled={creating}
                className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)] disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create PR"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
