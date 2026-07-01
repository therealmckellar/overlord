'use client';

import React from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { useMockHealthData, useMockMissionsData } from '@/hooks/use-mock-data';
import { MissionSummary } from '@/types/cluster-a';
import { Activity, Cpu, Zap, AlertCircle, Play, Square, Plus } from 'lucide-react';

export default function Dashboard() {
  const health = useMockHealthData();
  const missions = useMockMissionsData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-fade-in">
      {/* Header / Quick Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Mission Control</h1>
          <p className="text-sm text-slate-400">System Operational Status: Nominal</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
            <Plus size={16} />
            Spawn Agent
          </button>
          <button className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium border border-slate-700 transition-colors">
            New Workspace
          </button>
          <button className="px-4 py-2 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium border border-red-900/50 transition-colors">
            Emergency Stop
          </button>
        </div>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <HealthCard 
          title="System Load" 
          value={`${health.cpuUsage.toFixed(1)}%`} 
          icon={<Cpu size={18} />} 
          trend="up"
          color="var(--accent)"
        />
        <HealthCard 
          title="Active Agents" 
          value={health.activeAgents.toString()} 
          icon={<Activity size={18} />} 
          trend="stable"
          color="var(--success)"
        />
        <HealthCard 
          title="Token Velocity" 
          value={`${Math.floor(health.tokenThroughput)} t/s`} 
          icon={<Zap size={18} />} 
          trend="up"
          color="var(--info)"
        />
        <HealthCard 
          title="Error Rate" 
          value={`${(health.errorRate * 100).toFixed(2)}%`} 
          icon={<AlertCircle size={18} />} 
          trend="down"
          color={health.errorRate > 0.05 ? 'var(--error)' : 'var(--success)'}
        />
      </div>

      {/* Main Content: Missions Table */}
      <PanelWrapper title="Active Missions">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-400 border-b border-slate-800">
              <tr>
                <th className="pb-3 font-medium">Mission ID</th>
                <th className="pb-3 font-medium">Agent</th>
                <th className="pb-3 font-medium">Objective</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Progress</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {missions.map((mission) => (
                <tr key={mission.id} className="group hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 font-mono text-indigo-400">{mission.id}</td>
                  <td className="py-4">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{mission.agentName}</span>
                      <span className="text-xs text-slate-500">{mission.agentId}</span>
                    </div>
                  </td>
                  <td className="py-4 text-slate-300 max-w-md truncate">{mission.objective}</td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${mission.status === 'running' ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
                      <span className={`capitalize ${getStatusColor(mission.status)}`}>{mission.status}</span>
                    </div>
                  </td>
                  <td className="py-4 w-48">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500" 
                          style={{ width: `${mission.progress}%` }} 
                        />
                      </div>
                      <span className="text-xs text-slate-400">{mission.progress}%</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    <button className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors opacity-0 group-hover:opacity-100">
                      <Play size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PanelWrapper>
    </div>
  );
}

function HealthCard({ title, value, icon, trend, color }: { title: string, value: string, icon: React.ReactNode, trend: 'up' | 'down' | 'stable', color: string }) {
  return (
    <PanelWrapper className="relative overflow-hidden group">
      <div className="flex justify-between items-start mb-2">
        <div className="p-2 rounded-lg bg-slate-800/50 text-slate-400 group-hover:text-white transition-colors">
          {icon}
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          trend === 'up' ? 'bg-green-500/10 text-green-400' : 
          trend === 'down' ? 'bg-red-500/10 text-red-400' : 
          'bg-slate-800 text-slate-400'
        }`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{title}</div>
      <div 
        className="absolute bottom-0 left-0 h-1 bg-current opacity-30 transition-all group-hover:opacity-100" 
        style={{ color, width: '100%' }}
      />
    </PanelWrapper>
  );
}
