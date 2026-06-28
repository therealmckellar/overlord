import React, { useMemo } from 'react';
import { useScopeStore } from '@/stores/scopeStore';
import { DriftType } from '@/lib/scopeTracker';

const ScopePanel: React.FC = () => {
  const { alerts, resolveAlert, stats } = useScopeStore();

  const pendingAlerts = useMemo(() => alerts.filter(a => a.status === 'pending'), [alerts]);

  return (
    <div className="p-4 rounded-lg bg-[#1a1a2e] text-white border border-[#6366f1]/30 max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4 text-[#6366f1]">Scope Drift Detection</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-3 bg-[#0f0f1a] rounded border border-[#6366f1]/20">
          <p className="text-xs text-gray-400">Pending Alerts</p>
          <p className="text-2xl font-mono">{pendingAlerts.length}</p>
        </div>
        <div className="p-3 bg-[#0f0f1a] rounded border border-[#6366f1]/20">
          <p className="text-xs text-gray-400">Avg Acceptance Rate</p>
          <p className="text-2xl font-mono">
            {Object.values(stats).length > 0 
              ? (Object.values(stats).reduce((acc, s) => acc + s.acceptanceRate, 0) / Object.values(stats).length).toFixed(2) + '%'
              : '0%'}
          </p>
        </div>
        <div className="p-3 bg-[#0f0f1a] rounded border border-[#6366f1]/20">
          <p className="text-xs text-gray-400">Estimated Time Saved</p>
          <p className="text-2xl font-mono">
            {Object.values(stats).reduce((acc, s) => acc + s.timeSaved, 0)}m
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingAlerts.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">No active scope drift detected.</p>
        ) : (
          pendingAlerts.map(alert => (
            <div key={alert.id} className="p-4 bg-[#0f0f1a] rounded-lg border-l-4 border-[#6366f1] flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase px-2 py-1 bg-[#6366f1]/20 text-[#6366f1] rounded mr-2">
                    {alert.driftType}
                  </span>
                  <span className="text-xs text-gray-500">{alert.detectedAt.toLocaleDateString()} {alert.detectedAt.toLocaleTimeString()}</span>
                </div>
                <span className="text-xs text-gray-400">Agent: {alert.agentId}</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold">Original Scope</p>
                  <p className="text-gray-300">{alert.originalScope}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase font-semibold">Proposed Drift</p>
                  <p className="text-[#6366f1] font-medium">{alert.proposedChange}</p>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-2">
                <button 
                  onClick={() => resolveAlert(alert.id, 'rejected')}
                  className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded border border-red-900/50 transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => resolveAlert(alert.id, 'deferred')}
                  className="px-3 py-1 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded border border-gray-700 transition-colors"
                >
                  Defer
                </button>
                <button 
                  onClick={() => resolveAlert(alert.id, 'approved')}
                  className="px-3 py-1 text-xs bg-[#6366f1]/20 hover:bg-[#6366f1]/40 text-[#6366f1] rounded border border-[#6366f1]/50 transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ScopePanel;
