'use client';

import React, { useState, useEffect } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';

interface Workspace {
  id: string;
  name: string;
  branch?: string;
  base_branch?: string;
  status: string;
  created_by?: string;
  created_at: number;
  updated_at: number;
  worktree_path?: string;
}

export default function WorkspacesPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);

  useEffect(() => {
    fetch('/api/workspaces')
      .then(r => r.json())
      .then(data => {
        setWorkspaces(data.workspaces || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 h-screen flex gap-6 overflow-hidden">
      {/* Sidebar Navigation */}
      <div className="w-80 flex flex-col gap-4 h-full">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-xl font-bold text-white">Workspaces</h1>
          <button className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No workspaces yet. Create one to get started.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            {workspaces.map((ws) => (
              <button
                key={ws.id}
                onClick={() => setSelectedWs(ws)}
                className={`w-full text-left p-3 rounded-lg transition-all border ${
                  selectedWs?.id === ws.id
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
                    : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <div className="font-medium text-sm">{ws.name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    ws.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {ws.status}
                  </span>
                  {ws.branch && (
                    <span className="text-[9px] text-slate-500 font-mono truncate">{ws.branch}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detailed View */}
      <div className="flex-1 overflow-y-auto h-full">
        {selectedWs ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedWs.name}</h2>
                <p className="text-slate-400 text-sm font-mono">{selectedWs.branch || 'No branch'}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                  Open in Terminal
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PanelWrapper title="Workspace Info">
                <div className="space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Status</span>
                    <span className={`font-medium ${selectedWs.status === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {selectedWs.status}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Base Branch</span>
                    <span className="text-slate-300 font-mono">{selectedWs.base_branch || 'main'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Created By</span>
                    <span className="text-slate-300">{selectedWs.created_by || 'System'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Created</span>
                    <span className="text-slate-300">{new Date(selectedWs.created_at).toLocaleDateString()}</span>
                  </div>
                  {selectedWs.worktree_path && (
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-[10px] text-slate-500 block mb-1">Worktree Path</span>
                      <span className="text-[10px] text-slate-400 font-mono break-all">{selectedWs.worktree_path}</span>
                    </div>
                  )}
                </div>
              </PanelWrapper>

              <PanelWrapper title="Quick Actions">
                <div className="grid grid-cols-2 gap-2">
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors text-center">
                    📂 Open Files
                  </button>
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors text-center">
                    🔀 View Diff
                  </button>
                  <button className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors text-center">
                    ✅ Run Checks
                  </button>
                  <button className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors text-center">
                    🚀 Create PR
                  </button>
                </div>
              </PanelWrapper>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-12">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2-2h-5.828a1 1 0 00-.414.707l3.536 3.536a1 1 0 00.707-.414V19" /></svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">No Workspace Selected</h3>
            <p className="text-slate-400 text-sm max-w-xs">Select a workspace from the sidebar to manage its context and resources.</p>
          </div>
        )}
      </div>
    </div>
  );
}
