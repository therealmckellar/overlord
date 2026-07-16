'use client';

import React from 'react';
import { TrendingWidget } from '@/components/dashboard/TrendingWidget';
import { Activity, Cpu, Zap, AlertCircle, Play, Plus, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export default function Dashboard() {
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
            onClick={() => window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'agentOffice' }))}
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Active Missions */}
        <div className="xl:col-span-2 card overflow-hidden flex flex-col">
          <div className="panel-header">
            <span className="panel-title">Active Missions</span>
            <span className="badge badge-info">Monitoring Live Pipeline...</span>
          </div>
          <div className="overflow-auto flex-1 p-4">
             <div className="text-center py-12 text-[var(--text-muted)] italic text-sm">
               Connecting to live mission pipeline...
             </div>
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
