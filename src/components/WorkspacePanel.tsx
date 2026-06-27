"use client";

import { useEffect, useState } from "react";
import { useWorkspaceStore } from "@/stores";
import { DiffViewer } from "./DiffViewer";
import { ChecksTab } from "./ChecksTab";
import { NewWorkspaceModal } from "./modals/NewWorkspaceModal";

export default function WorkspacePanel() {
  const { workspaces, loading, fetchWorkspaces, deleteWorkspace } = useWorkspaceStore();
  const [selectedWs, setSelectedWs] = useState<string | null>(null);
  const [tab, setTab] = useState<"diff" | "checks">("diff");
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const activeWs = workspaces.find((w) => w.id === selectedWs);

  if (loading && workspaces.length === 0) {
    return <div className="p-6 text-[var(--text-muted)]">Loading workspaces...</div>;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <h2 className="text-lg font-semibold">Workspaces</h2>
        <button
          onClick={() => setShowNew(true)}
          className="px-3 py-1.5 bg-[var(--accent)] text-white rounded text-sm hover:bg-[var(--accent-hover)]"
        >
          + New Workspace
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar list */}
        <div className="w-64 border-r border-[var(--border)] overflow-y-auto p-2">
          {workspaces.length === 0 && (
            <div className="text-[var(--text-muted)] text-sm p-3">No workspaces yet</div>
          )}
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              onClick={() => setSelectedWs(ws.id)}
              className={`p-3 rounded cursor-pointer mb-1 transition-colors ${
                selectedWs === ws.id
                  ? "bg-[var(--accent-muted)] border border-[var(--accent)]"
                  : "hover:bg-[var(--bg-tertiary)] border border-transparent"
              }`}
            >
              <div className="font-medium text-sm truncate">{ws.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={`text-xs px-1.5 py-0.5 rounded ${
                    ws.status === "active"
                      ? "bg-green-900/40 text-green-400"
                      : ws.status === "merged"
                      ? "bg-blue-900/40 text-blue-400"
                      : "bg-gray-800 text-gray-400"
                  }`}
                >
                  {ws.status}
                </span>
                <span className="text-xs text-[var(--text-muted)] truncate">{ws.branch}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          {!activeWs ? (
            <div className="flex items-center justify-center h-full text-[var(--text-muted)]">
              Select a workspace to view details
            </div>
          ) : (
            <>
              {/* Tabs */}
              <div className="flex border-b border-[var(--border)]">
                <button
                  onClick={() => setTab("diff")}
                  className={`px-4 py-2 text-sm ${
                    tab === "diff"
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Diff
                </button>
                <button
                  onClick={() => setTab("checks")}
                  className={`px-4 py-2 text-sm ${
                    tab === "checks"
                      ? "border-b-2 border-[var(--accent)] text-[var(--accent)]"
                      : "text-[var(--text-muted)]"
                  }`}
                >
                  Checks & PR
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => deleteWorkspace(activeWs.id)}
                  className="px-3 py-1.5 text-xs text-red-400 hover:bg-red-900/20 m-1 rounded"
                >
                  Delete
                </button>
              </div>

              {tab === "diff" && <DiffViewer workspaceId={activeWs.id} />}
              {tab === "checks" && <ChecksTab workspace={activeWs} />}
            </>
          )}
        </div>
      </div>

      {showNew && <NewWorkspaceModal onClose={() => { setShowNew(false); fetchWorkspaces(); }} />}
    </div>
  );
}
