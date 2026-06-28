import React, { useState, useEffect } from 'react';
import { useDeploymentStore, type DeploymentStatus, type AgentDeployment } from '@/stores/deploymentStore';
import { runDeployPipeline, type DeployTarget } from '@/lib/deployEngine';

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  pending: 'text-slate-400',
  building: 'text-blue-400',
  deploying: 'text-indigo-400',
  live: 'text-emerald-400',
  failed: 'text-red-400',
  rolled_back: 'text-orange-400',
};

const DEPLOY_STEPS = ['Merge', 'Test', 'Deploy', 'Health Check', 'Done'] as const;

export const DeployPanel: React.FC = () => {
  const { deployments, addDeployment, updateDeployment, rollbackDeployment, addDeployLog } = useDeploymentStore();
  const [target, setTarget] = useState<DeployTarget>('staging');
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<AgentDeployment | null>(null);

  const checklist = [
    { id: 'tests', label: 'Unit & Integration Tests', status: 'pass' },
    { id: 'lint', label: 'Linting & Type Check', status: 'pass' },
    { id: 'security', label: 'Security Scan', status: 'pass' },
    { id: 'auth', label: 'Authority Verification', status: 'pass' },
  ];

  const handleDeploy = async () => {
    setIsDeploying(true);
    // In a real scenario, we'd get the current agent context. Mocking for now.
    const deployId = addDeployment('Hermes-Operator', 'agent-001', target);
    
    try {
      addDeployLog(deployId, 'Initiating deployment pipeline...', 'info');
      updateDeployment(deployId, { status: 'building' });
      
      // Simulate steps for UI responsiveness before engine call
      await new Promise(r => setTimeout(r, 1000));
      addDeployLog(deployId, 'Merging PR to ' + target, 'info');
      
      await new Promise(r => setTimeout(r, 1000));
      updateDeployment(deployId, { status: 'deploying' });
      addDeployLog(deployId, 'Executing deployment script...', 'info');

      const result = await runDeployPipeline(target, 'main', 'ws-001');
      
      if (result.success) {
        updateDeployment(deployId, { status: 'live', endpoint: result.endpoint, completedAt: Date.now() });
        addDeployLog(deployId, 'Deployment successful: ' + (result.endpoint || ''), 'success');
      } else {
        updateDeployment(deployId, { status: 'failed', completedAt: Date.now() });
        addDeployLog(deployId, 'Deployment failed: ' + result.error, 'error');
      }
    } catch (e: any) {
      updateDeployment(deployId, { status: 'failed', completedAt: Date.now() });
      addDeployLog(deployId, 'Unexpected error: ' + e.message, 'error');
    } finally {
      setIsDeploying(false);
    }
  };

  const getStepProgress = (status: DeploymentStatus) => {
    switch (status) {
      case 'pending': return 0;
      case 'building': return 1;
      case 'deploying': return 2;
      case 'live': return 4;
      case 'failed': return 3;
      default: return 0;
    }
  };

  return (
    <div className="p-6 space-y-8 text-slate-200" style={{ backgroundColor: '#0f0f1a', minHeight: '100vh' }}>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Deployment Pipeline</h1>
        <div className="flex gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
          {(['staging', 'production'] as DeployTarget[]).map(t => (
            <button
              key={t}
              onClick={() => setTarget(t)}
              className={`px-4 py-1 rounded-md text-xs font-bold transition-all ${target === t ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="p-4 rounded-lg border border-slate-800" style={{ backgroundColor: '#1a1a2e' }}>
            <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Pre-deploy Checklist</h2>
            <div className="space-y-3">
              {checklist.map(item => (
                <div key={item.id} className="flex justify-between items-center text-sm">
                  <span className="text-slate-300">{item.label}</span>
                  <span className="text-emerald-500 font-mono text-xs">✓ PASS</span>
                </div>
              ))}
            </div>
            <button 
              disabled={isDeploying}
              onClick={handleDeploy}
              className={`w-full mt-6 py-3 rounded-md font-bold transition-all ${isDeploying ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-500/20 shadow-xl'}`}
            >
              {isDeploying ? 'Executing Pipeline...' : 'Deploy Now'}
            </button>
          </div>

          <div className="p-4 rounded-lg border border-slate-800" style={{ backgroundColor: '#1a1a2e' }}>
            <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider">Quick Actions</h2>
            <button 
              onClick={() => selectedDeployment && rollbackDeployment(selectedDeployment.id)}
              disabled={!selectedDeployment}
              className="w-full py-2 border border-orange-900/50 text-orange-400 rounded hover:bg-orange-900/20 disabled:opacity-30 transition-all text-sm"
            >
              Rollback Selected
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-semibold text-slate-400">Deployment History</h2>
          <div className="grid gap-4">
            {deployments.map((d) => (
              <div 
                key={d.id} 
                onClick={() => setSelectedDeployment(d)}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${selectedDeployment?.id === d.id ? 'border-indigo-500 bg-indigo-900/10' : 'border-slate-800 bg-[#1a1a2e] hover:border-slate-600'}`}
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-white">{d.agentName}</span>
                    <span className="text-xs text-slate-500 font-mono">{d.version}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-800 ${STATUS_COLORS[d.status]}`}>
                      {d.status.toUpperCase()}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(d.startedAt).toLocaleString()}</span>
                </div>
                
                <div className="relative h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-500"
                    style={{ width: `${(getStepProgress(d.status) / (DEPLOY_STEPS.length - 1)) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2">
                  {DEPLOY_STEPS.map((step, i) => (
                    <span key={step} className={`text-[9px] ${i <= getStepProgress(d.status) ? 'text-indigo-400 font-bold' : 'text-slate-600'}`}>
                      {step}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {selectedDeployment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1a1a2e] border border-slate-700 rounded-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center">
              <h3 className="font-bold text-white">Deployment Details: {selectedDeployment.id}</h3>
              <button onClick={() => setSelectedDeployment(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase">Environment</div>
                  <div className="font-bold text-indigo-400">{selectedDeployment.environment}</div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase">Version</div>
                  <div className="font-bold text-white">{selectedDeployment.version}</div>
                </div>
                <div className="p-3 rounded bg-slate-900 border border-slate-800">
                  <div className="text-xs text-slate-500 uppercase">Status</div>
                  <div className={`font-bold ${STATUS_COLORS[selectedDeployment.status]}`}>{selectedDeployment.status}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Pipeline Logs</h4>
                <div className="bg-black rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto space-y-1 border border-slate-800">
                  {selectedDeployment.logs.map(log => (
                    <div key={log.id} className="flex gap-2">
                      <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                      <span className={log.level === 'error' ? 'text-red-400' : log.level === 'success' ? 'text-emerald-400' : 'text-slate-300'}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
