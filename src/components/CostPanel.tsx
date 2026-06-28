'use client';

import React from 'react';
import { useCostStore, getCircuitBreakerStatus } from '@/stores/costStore';
import { useUIStore } from '@/stores/uiStore';

export default function CostPanel() {
  const { 
    sessionBudget, 
    currentSpend, 
    perAgentSpend, 
    perModelSpend, 
    warningThresholds 
  } = useCostStore();
  const { addToast } = useUIStore();

  const status = getCircuitBreakerStatus(useCostStore.getState());
  const progress = (currentSpend / sessionBudget) * 100;

  const getProgressBarColor = () => {
    if (progress >= 100) return 'bg-red-500';
    if (progress >= warningThresholds.critical * 100) return 'bg-orange-500';
    if (progress >= warningThresholds.warning * 100) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = () => {
    switch (status) {
      case 'blown': return 'text-red-500';
      case 'critical': return 'text-orange-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-green-500';
    }
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-200 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Cost Control</h3>
        <div className={`text-xs font-mono uppercase px-2 py-1 rounded bg-zinc-800 ${getStatusColor()}`}>
          {status}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Session Spend</span>
          <span className="font-mono">${currentSpend.toFixed(4)} / ${sessionBudget.toFixed(2)}</span>
        </div>
        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${getProgressBarColor()}`} 
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase font-bold">By Model</p>
          <div className="space-y-1 text-xs font-mono">
            {Object.entries(perModelSpend).map(([model, cost]) => (
              <div key={model} className="flex justify-between">
                <span className="truncate mr-2">{model}</span>
                <span>${cost.toFixed(4)}</span>
              </div>
            ))}
            {Object.keys(perModelSpend).length === 0 && <div className="text-zinc-600 italic">No spend yet</div>}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs text-zinc-500 uppercase font-bold">By Agent</p>
          <div className="space-y-1 text-xs font-mono">
            {Object.entries(perAgentSpend).map(([agent, cost]) => (
              <div key={agent} className="flex justify-between">
                <span className="truncate mr-2">{agent}</span>
                <span>${cost.toFixed(4)}</span>
              </div>
            ))}
            {Object.keys(perAgentSpend).length === 0 && <div className="text-zinc-600 italic">No spend yet</div>}
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <div className="flex justify-between items-center text-xs">
          <span className="text-zinc-500">Next Action Est.</span>
          <span className="font-mono text-zinc-300">~$0.0012</span>
        </div>
      </div>
    </div>
  );
}
