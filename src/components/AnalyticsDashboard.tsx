'use client';

import React, { useState, useMemo } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { TrendingUp, Clock, Zap, CheckCircle2, AlertCircle } from 'lucide-react';

// Types based on IMPLEMENTATION_PLAN_CLUSTER_B.md
interface AnalyticsKPIs {
  totalSpend: number;
  spendDelta24h: number;
  avgLatency: number;
  tokenVelocity: number;
  successRate: number;
}

interface TokenUsageRecord {
  timestamp: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  missionId: string;
}

interface CostBreakdown {
  entityId: string;
  entityName: string;
  totalCost: number;
  efficiencyScore: number;
}

// Mock Data Generation
const generateMockKPIs = (): AnalyticsKPIs => ({
  totalSpend: 1240.50,
  spendDelta24h: 12.5,
  avgLatency: 1840,
  tokenVelocity: 450,
  successRate: 98.4,
});

const generateMockUsage = (): TokenUsageRecord[] => {
  const models = ['Claude 3.5 Sonnet', 'GPT-4o', 'Llama 3.1 70B'];
  const missions = ['Alpha-Research', 'Beta-Audit', 'Gamma-Synth'];
  return Array.from({ length: 24 }).map((_, i) => ({
    timestamp: new Date(Date.now() - i * 3600000).toISOString(),
    modelId: models[Math.floor(Math.random() * models.length)],
    inputTokens: Math.floor(Math.random() * 10000) + 1000,
    outputTokens: Math.floor(Math.random() * 2000) + 200,
    cost: Math.random() * 0.5,
    latency: Math.floor(Math.random() * 3000) + 500,
    missionId: missions[Math.floor(Math.random() * missions.length)],
  }));
};

const generateMockCosts = (): CostBreakdown[] => [
  { entityId: 'agent-01', entityName: 'Sentinel-01', totalCost: 450.20, efficiencyScore: 0.92 },
  { entityId: 'agent-02', entityName: 'Indexer-Prime', totalCost: 320.10, efficiencyScore: 0.78 },
  { entityId: 'agent-03', entityName: 'Archivist', totalCost: 210.40, efficiencyScore: 0.85 },
  { entityId: 'agent-04', entityName: 'Tuner-01', totalCost: 259.80, efficiencyScore: 0.64 },
];

export default function AnalyticsDashboard() {
  const kpis = useMemo(() => generateMockKPIs(), []);
  const usageData = useMemo(() => generateMockUsage(), []);
  const costData = useMemo(() => generateMockCosts(), []);

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-transparent overflow-y-auto">
      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Spend" 
          value={`$${kpis.totalSpend.toFixed(2)}`} 
          delta={`${kpis.spendDelta24h}%`} 
          icon={<TrendingUp className="w-4 h-4 text-indigo-400" />}
          trend="up"
        />
        <KPICard 
          title="Avg Latency" 
          value={`${(kpis.avgLatency / 1000).toFixed(2)}s`} 
          status="yellow"
          icon={<Clock className="w-4 h-4 text-indigo-400" />}
        />
        <KPICard 
          title="Token Velocity" 
          value={`${kpis.tokenVelocity} tps`} 
          delta="+4.2%" 
          icon={<Zap className="w-4 h-4 text-indigo-400" />}
          trend="up"
        />
        <KPICard 
          title="Success Rate" 
          value={`${kpis.successRate}%`} 
          status="green"
          icon={<CheckCircle2 className="w-4 h-4 text-indigo-400" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Usage Heatmap (Simulated with Bars) */}
        <PanelWrapper title="Token Usage Heatmap (24h)" className="lg:col-span-2">
          <div className="h-64 flex items-end gap-1 px-2">
            {usageData.map((d, i) => (
              <div 
                key={i} 
                className="flex-1 bg-indigo-500/30 hover:bg-indigo-400/50 transition-colors rounded-t-sm relative group"
                style={{ height: `${(d.inputTokens / 11000) * 100}%` }}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-indigo-500/50">
                  {d.modelId}: {d.inputTokens}t
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 uppercase tracking-wider">
            <span>24h ago</span>
            <span>Now</span>
          </div>
        </PanelWrapper>

        {/* Latency Distribution */}
        <PanelWrapper title="Latency Distribution">
          <div className="space-y-3">
            {[
              { range: '< 1s', count: 45, pct: 45 },
              { range: '1-3s', count: 32, pct: 32 },
              { range: '3-5s', count: 18, pct: 18 },
              { range: '> 5s', count: 5, pct: 5 },
            ].map((bin) => (
              <div key={bin.range} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-12">{bin.range}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${bin.pct}%` }} />
                </div>
                <span className="text-xs text-slate-300 w-8 text-right">{bin.count}</span>
              </div>
            ))}
          </div>
        </PanelWrapper>
      </div>

      {/* Cost Breakdown Table */}
      <PanelWrapper title="Cost Breakdown by Entity">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2 font-medium">Entity</th>
                <th className="pb-2 font-medium">Total Cost</th>
                <th className="pb-2 font-medium">Efficiency Score</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {costData.map((row) => (
                <tr key={row.entityId} className="group hover:bg-indigo-500/5 transition-colors">
                  <td className="py-3 text-slate-200 font-medium">{row.entityName}</td>
                  <td className="py-3 text-slate-300">${row.totalCost.toFixed(2)}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${row.efficiencyScore > 0.8 ? 'bg-green-500' : row.efficiencyScore > 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${row.efficiencyScore * 100}%` }} 
                        />
                      </div>
                      <span className="text-slate-400">{(row.efficiencyScore * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${row.efficiencyScore > 0.8 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                      {row.efficiencyScore > 0.8 ? 'Optimal' : 'Review'}
                    </span>
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

function KPICard({ title, value, delta, status, icon, trend }: { title: string, value: string, delta?: string, status?: 'green'|'yellow'|'red', icon: React.ReactNode, trend?: 'up'|'down' }) {
  const statusColors = {
    green: 'text-green-400',
    yellow: 'text-yellow-400',
    red: 'text-red-400',
  };

  return (
    <PanelWrapper className="flex flex-col justify-between py-4">
      <div className="flex justify-between items-start">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</span>
        <div className="p-1.5 bg-slate-800 rounded-lg">{icon}</div>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold ${status ? statusColors[status] : 'text-slate-100'}`}>{value}</span>
        {delta && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? '↑' : '↓'} {delta}
          </span>
        )}
      </div>
    </PanelWrapper>
  );
}
