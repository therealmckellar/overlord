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
        <div className="w-64 border-r border-[var(--border)] overflow-y-auto p-2">
          {workspaces.map((ws) => (
            <div key={ws.id} onClick={() => setSelectedWs(ws.id)} className="p-3 rounded cursor-pointer mb-1">
              {ws.name}
            </div>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {!activeWs ? (
            <div className="flex items-center justify-center h-full">Select a workspace</div>
          ) : (
            <>
              <div className="flex border-b border-[var(--border)]">
                <button onClick={() => setTab("diff")} className="px-4 py-2">Diff</button>
                <button onClick={() => setTab("checks")} className="px-4 py-2">Checks</button>
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
