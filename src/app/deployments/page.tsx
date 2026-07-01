'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { useMockData } from '@/hooks/useMockData';
import { AgentInstance } from '@/hooks/useMockData';

export default function DeploymentsPage() {
  const { deployments } = useMockData();
  const [selectedInstance, setSelectedInstance] = useState<AgentInstance | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'degraded': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'offline': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="p-6 space-y-6 h-screen flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Deployment Registry</h1>
          <p className="text-slate-400 text-sm">Manage live instances and version control</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Deploy New Instance
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Instance List */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <PanelWrapper title="Active Instances" className="flex-1 overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs font-medium text-slate-500 border-b border-slate-800">
                    <th className="pb-3 pl-2">Instance ID</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Uptime</th>
                    <th className="pb-3 text-right pr-2">Resources</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {deployments.map((inst) => (
                    <tr 
                      key={inst.instanceId} 
                      onClick={() => setSelectedInstance(inst)}
                      className={`group cursor-pointer transition-colors ${selectedInstance?.instanceId === inst.instanceId ? 'bg-indigo-500/10' : 'hover:bg-slate-800/40'}`}
                    >
                      <td className="py-4 pl-2 text-xs font-mono text-slate-300 group-hover:text-white transition-colors">
                        {inst.instanceId}
                      </td>
                      <td className="py-4 text-xs text-slate-400">{inst.configVersion}</td>
                      <td className="py-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(inst.status)}`}>
                          {inst.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 text-xs text-slate-400 font-mono">
                        {Math.floor(inst.uptime / 3600)}h {Math.floor((inst.uptime % 3600) / 60)}m
                      </td>
                      <td className="py-4 text-right pr-2 text-xs text-slate-500 font-mono">
                        {inst.resources.cpu}% / {inst.resources.mem}MB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PanelWrapper>
        </div>

        {/* Instance Control Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          {selectedInstance ? (
            <>
              <PanelWrapper title="Control Panel" className="space-y-4">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs mb-2">
                    <span className="text-slate-500 uppercase font-medium">Endpoint</span>
                    <span className="text-indigo-400 font-mono">{selectedInstance.endpoint}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.378 0V4m0 5.582l-5.414 5.414m-5.414-5.414l5.414 5.414" /></svg>
                      Restart
                    </button>
                    <button className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs rounded-lg border border-red-500/30 transition-colors flex items-center justify-center gap-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      Stop
                    </button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-800">
                    <label className="text-[10px] text-slate-500 uppercase font-medium block mb-2">Rollback Version</label>
                    <select className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option>v1.2.4-beta (Current)</option>
                      <option>v1.2.3-stable</option>
                      <option>v1.2.0-stable</option>
                      <option>v1.1.0-stable</option>
                    </select>
                    <button className="w-full mt-2 p-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg transition-colors font-medium">
                      Execute Rollback
                    </button>
                  </div>
                </div>
              </PanelWrapper>

              <PanelWrapper title="Live Log Stream" className="flex-1 overflow-hidden flex flex-col">
                <div className="bg-black/50 rounded-lg p-3 font-mono text-[10px] text-slate-400 h-64 overflow-y-auto border border-slate-800">
                  <div className="text-emerald-400">[INFO] Instance {selectedInstance.instanceId} initialized.</div>
                  <div className="text-slate-500">[DEBUG] Loading config v{selectedInstance.configVersion}...</div>
                  <div className="text-indigo-400">[SYSTEM] Connecting to orchestrator...</div>
                  <div className="text-amber-400">[WARN] Latency spike detected in endpoint {selectedInstance.endpoint}.</div>
                  <div className="text-slate-400">[INFO] Agent processing task t-442...</div>
                  <div className="text-slate-400">[INFO] Tool call: web_search(query="Cluster A status")</div>
                  <div className="text-slate-400">[INFO] Response received. Processing output...</div>
                  <div className="text-indigo-400">[SYSTEM] Heartbeat signal sent.</div>
                  <div className="text-slate-500">[DEBUG] Trace ID: tr-88231-x</div>
                  <div className="text-slate-400">[INFO] Task t-442 completed successfully.</div>
                </div>
              </PanelWrapper>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-8m8 0a2 2 0 01-2 2h-4m2-2h4m-4-2H8m4-2H8m4-2H8" /></svg>
              </div>
              <p className="text-slate-400 text-xs">Select an instance to view controls and logs</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
