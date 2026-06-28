import React, { useEffect } from 'react';
import { useCanaryStore, CanaryStatus } from '@/stores/canaryStore';
import { Activity, AlertTriangle, CheckCircle, XCircle, History } from 'lucide-react';

export const CanaryPanel: React.FC<{ deployId: string }> = ({ deployId }) => {
  const { activeCanaries, history, updateCanary, stopCanary } = useCanaryStore();
  
  const activeCanary = Object.values(activeCanaries).find(c => c.deployId === deployId);

  useEffect(() => {
    if (activeCanary && activeCanary.status === 'running') {
      const interval = setInterval(async () => {
        try {
          const start = performance.now();
          const res = await fetch(activeCanary.url);
          const end = performance.now();
          
          updateCanary(activeCanary.id, {
            timestamp: Date.now(),
            status: res.status,
            responseTime: end - start,
            errorRate: res.ok ? 0 : 1
          });
        } catch (e) {
          updateCanary(activeCanary.id, {
            timestamp: Date.now(),
            status: 500,
            responseTime: 0,
            errorRate: 1
          });
        }
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [activeCanary, updateCanary]);

  if (!activeCanary && history.length === 0) return null;

  const getStatusColor = (status: CanaryStatus['status']) => {
    switch (status) {
      case 'passed': return 'text-green-500';
      case 'failed': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-200 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Activity size={18} /> Deployment Canary
        </h3>
        {activeCanary && (
          <div className={`flex items-center gap-2 text-sm font-bold ${getStatusColor(activeCanary.status)}`}>
            {activeCanary.status === 'running' && <span className="animate-pulse">Monitoring...</span>}
            {activeCanary.status === 'warning' && <><AlertTriangle size={14} /> Warning</>}
            {activeCanary.status === 'failed' && <><XCircle size={14} /> Failed</>}
            {activeCanary.status === 'passed' && <><CheckCircle size={14} /> Passed</>}
          </div>
        )}
      </div>

      {activeCanary && (
        <div className="grid grid-cols-3 gap-4 py-2 border-y border-zinc-800">
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase">Resp Time</div>
            <div className="text-xl font-mono">
              {activeCanary.metrics[activeCanary.metrics.length - 1]?.responseTime.toFixed(0) || 0}ms
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase">Status</div>
            <div className="text-xl font-mono">
              {activeCanary.metrics[activeCanary.metrics.length - 1]?.status || '...'}
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-zinc-500 uppercase">Failures</div>
            <div className="text-xl font-mono text-red-400">
              {activeCanary.consecutiveFailures} / 3
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-1">
          <History size={12} /> Recent History
        </h4>
        <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
          {history.map((h, i) => (
            <div key={i} className="flex justify-between p-1 bg-zinc-800/50 rounded">
              <span>{new Date(h.startTime).toLocaleTimeString()}</span>
              <span className={getStatusColor(h.status)}>{h.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
