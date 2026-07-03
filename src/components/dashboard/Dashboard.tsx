'use client';

import React from 'react';
import { TrendingWidget } from '@/components/dashboard/TrendingWidget';
import { useMockHealthData, useMockMissionsData } from '@/hooks/use-mock-data';
import { Activity, Cpu, Zap, AlertCircle, Play, Plus, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function Dashboard() {
  const health = useMockHealthData();
  const missions = useMockMissionsData();

  const handleOpenSocial = () => {
    window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'social' }));
  };

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">Command Center</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">System status: Nominal</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'designer' }))}
            className="btn btn-primary btn-sm"
          >
            <Plus size={13} /> Spawn Agent
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'taskboard' }))}
            className="btn btn-secondary btn-sm"
          >
            Task Board
          </button>
        </div>
      </div>

      {/* Health Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <HealthCard
          title="System Load"
          value={`${health.cpuUsage.toFixed(1)}%`}
          icon={<Cpu size={16} />}
          trend="up"
          color="var(--accent)"
        />
        <HealthCard
          title="Active Agents"
          value={health.activeAgents.toString()}
          icon={<Activity size={16} />}
          trend="stable"
          color="var(--success)"
        />
        <HealthCard
          title="Token Velocity"
          value={`${Math.floor(health.tokenThroughput)} t/s`}
          icon={<Zap size={16} />}
          trend="up"
          color="var(--info)"
        />
        <HealthCard
          title="Error Rate"
          value={`${(health.errorRate * 100).toFixed(2)}%`}
          icon={<AlertCircle size={16} />}
          trend="down"
          color={health.errorRate > 0.05 ? 'var(--error)' : 'var(--success)'}
        />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Active Missions */}
        <div className="xl:col-span-2 card overflow-hidden flex flex-col">
          <div className="panel-header">
            <span className="panel-title">Active Missions</span>
            <span className="badge badge-success">{missions.filter(m => m.status === 'running').length} running</span>
          </div>
          <div className="overflow-auto flex-1">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-[var(--bg-secondary)]">
                <tr>
                  {['Mission', 'Agent', 'Objective', 'Status', 'Progress', ''].map(h => (
                    <th key={h} className="text-[9px] uppercase tracking-widest text-[var(--text-muted)] font-semibold px-4 py-2.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {missions.map((mission) => (
                  <tr key={mission.id} className="group border-t border-[var(--border-subtle)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-[var(--accent)] whitespace-nowrap">{mission.id}</td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-[12px] font-medium text-[var(--text)]">{mission.agentName}</span>
                        <span className="block text-[10px] text-[var(--text-muted)] font-mono">{mission.agentId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--text-secondary)] max-w-[220px] truncate">{mission.objective}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        mission.status === 'running' ? 'badge-success' :
                        mission.status === 'paused'  ? 'badge-warning' :
                        mission.status === 'failed'  ? 'badge-error'   : 'badge-info'
                      }`}>
                        {mission.status === 'running' && <span className="w-1 h-1 rounded-full bg-[var(--success)] animate-pulse inline-block" />}
                        {mission.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-[var(--bg-elevated)] rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${mission.progress}%`, background: 'var(--accent)' }}
                          />
                        </div>
                        <span className="text-[10px] text-[var(--text-muted)] w-7 text-right">{mission.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100">
                        <Play size={11} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trending */}
        <div className="xl:col-span-1 card overflow-hidden flex flex-col">
          <TrendingWidget onOpenSocial={handleOpenSocial} />
        </div>
      </div>
    </div>
  );
}

function HealthCard({ title, value, icon, trend, color }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend: 'up' | 'down' | 'stable';
  color: string;
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-muted)';

  return (
    <div className="card p-4 relative overflow-hidden group hover:border-[var(--border)] transition-all">
      {/* Accent line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${color}60, ${color}20)` }} />

      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
          {icon}
        </div>
        <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: trendColor }}>
          <TrendIcon size={10} />
        </span>
      </div>
      <div className="text-[22px] font-bold tracking-tight" style={{ color }}>{value}</div>
      <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-widest font-semibold mt-1">{title}</div>
    </div>
  );
}
