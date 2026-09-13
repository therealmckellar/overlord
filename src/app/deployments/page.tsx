'use client';

import React, { useState, useEffect } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';

interface AgentStatus {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error';
  model: string;
  lastActivity: string;
  tokensUsed: number;
  isRunning: boolean;
}

export default function DeploymentsPage() {
  const [agents, setAgents] = useState<AgentStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<AgentStatus | null>(null);

  useEffect(() => {
    fetch('/api/agents/status')
      .then(r => r.json())
      .then(data => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30';
      case 'idle': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/30';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30';
    }
  };

  return (
    <div className="p-6 space-y-6 h-screen flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Deployments</h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading...' : `${agents.length} agents registered`}
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden">
        {/* Agent List */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <PanelWrapper title="Active Agents" className="flex-1 overflow-hidden flex flex-col">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : agents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                No agents found. Spawn one from the Bot Office.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-xs font-medium text-slate-500 border-b border-slate-800">
                      <th className="pb-3 pl-2">Agent</th>
                      <th className="pb-3">Role</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3">Model</th>
                      <th className="pb-3 text-right pr-2">Tokens</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {agents.map((agent) => (
                      <tr
                        key={agent.id}
                        onClick={() => setSelectedAgent(agent)}
                        className={`group cursor-pointer transition-colors ${selectedAgent?.id === agent.id ? 'bg-indigo-500/10' : 'hover:bg-slate-800/40'}`}
                      >
                        <td className="py-3 pl-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${agent.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                            <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">
                              {agent.name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-slate-400">{agent.role}</td>
                        <td className="py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${getStatusColor(agent.status)}`}>
                            {agent.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{agent.model}</td>
                        <td className="py-3 text-right pr-2 text-xs text-slate-500 font-mono">
                          {agent.tokensUsed > 0 ? `${(agent.tokensUsed / 1000).toFixed(1)}k` : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </PanelWrapper>
        </div>

        {/* Agent Detail Panel */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
          {selectedAgent ? (
            <PanelWrapper title="Agent Details" className="space-y-4">
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Name</span>
                  <span className="text-white font-medium">{selectedAgent.name}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Role</span>
                  <span className="text-indigo-400">{selectedAgent.role}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Status</span>
                  <span className={`font-medium ${selectedAgent.status === 'active' ? 'text-emerald-400' : selectedAgent.status === 'idle' ? 'text-amber-400' : 'text-red-400'}`}>
                    {selectedAgent.status}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Model</span>
                  <span className="text-slate-300 font-mono text-[10px]">{selectedAgent.model}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Last Activity</span>
                  <span className="text-slate-400">{selectedAgent.lastActivity || 'Never'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 uppercase font-medium">Tokens Used</span>
                  <span className="text-slate-300 font-mono">{selectedAgent.tokensUsed.toLocaleString()}</span>
                </div>
              </div>
            </PanelWrapper>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 opacity-50">
              <p className="text-slate-400 text-xs">Select an agent to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
