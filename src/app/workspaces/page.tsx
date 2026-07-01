'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { useMockData } from '@/hooks/useMockData';
import { Workspace } from '@/hooks/useMockData';

export default function WorkspacesPage() {
  const { workspaces } = useMockData();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);

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
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              onClick={() => setSelectedWorkspace(ws)}
              className={`w-full text-left p-3 rounded-lg transition-all border ${
                selectedWorkspace?.id === ws.id 
                ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-400' 
                : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
              }`}
            >
              <div className="font-medium text-sm">{ws.name}</div>
              <div className="text-[10px] opacity-60 truncate">{ws.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Detailed View */}
      <div className="flex-1 overflow-y-auto h-full">
        {selectedWorkspace ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedWorkspace.name}</h2>
                <p className="text-slate-400 text-sm">{selectedWorkspace.description}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors">
                  Export JSON
                </button>
                <button className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors">
                  Sync GitHub
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pinned Files */}
              <PanelWrapper title="Pinned Resources" className="lg:col-span-2">
                <div className="space-y-2">
                  {selectedWorkspace.files.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <svg className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="text-xs text-slate-300 group-hover:text-white transition-colors">{file}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">2.4 MB</span>
                    </div>
                  ))}
                </div>
              </PanelWrapper>

              {/* Memory Fragments */}
              <PanelWrapper title="Context Nodes" className="lg:col-span-1">
                <div className="flex flex-col gap-3">
                  {selectedWorkspace.memoryTags.map((tag, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-indigo-500/30 transition-all cursor-pointer group">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{tag}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Associated knowledge fragment extracted from last scan. High confidence match.
                      </p>
                    </div>
                  ))}
                </div>
              </PanelWrapper>

              {/* Global Context */}
              <PanelWrapper title="Global Project Constants" className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(selectedWorkspace.globalContext).map(([key, value]) => (
                    <div key={key} className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-indigo-400 uppercase">{key}</span>
                      <span className="text-xs text-slate-200 font-medium">{value}</span>
                    </div>
                  ))}
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
