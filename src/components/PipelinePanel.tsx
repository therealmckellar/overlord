'use client';

import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  AlertCircle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Rocket, 
  Search,
  Layers
} from 'lucide-react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useUIStore } from '@/stores/uiStore';

type StageStatus = 'pending' | 'active' | 'blocked' | 'done';

interface Stage {
  id: string;
  name: string;
  status: StageStatus;
  entryCriteria: string[];
  exitCriteria: string[];
  estimatedDuration: string;
  blockers: string[];
  icon: React.ElementType;
}

interface PipelineData {
  id: string;
  name: string;
  currentStageIndex: number;
  stages: Stage[];
  workspaceId?: string;
}

const STAGE_DEFAULTS: any[] = [
  {
    id: 'plan',
    name: 'PLAN',
    icon: Search,
    entryCriteria: ['Project goals defined', 'Target persona identified'],
    exitCriteria: ['Implementation plan approved', 'Architecture signed off'],
    estimatedDuration: '1-2 days',
  },
  {
    id: 'build',
    name: 'BUILD',
    icon: Zap,
    entryCriteria: ['Plan approved', 'Workspace initialized'],
    exitCriteria: ['Feature complete', 'Code linted', 'Unit tests passing'],
    estimatedDuration: '3-5 days',
  },
  {
    id: 'review',
    name: 'REVIEW',
    icon: ShieldCheck,
    entryCriteria: ['Build complete', 'PR created'],
    exitCriteria: ['Code review approved', 'Stakeholder sign-off'],
    estimatedDuration: '1-2 days',
  },
  {
    id: 'test',
    name: 'TEST',
    icon: Layers,
    entryCriteria: ['Review complete', 'Staging environment ready'],
    exitCriteria: ['QA passing', 'Performance benchmarks met'],
    estimatedDuration: '2-3 days',
  },
  {
    id: 'ship',
    name: 'SHIP',
    icon: Rocket,
    entryCriteria: ['QA approved', 'Release notes written'],
    exitCriteria: ['Deployed to production', 'Health checks passing'],
    estimatedDuration: '1 day',
  },
];

export function PipelinePanel() {
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { workspaces } = useWorkspaceStore();
  const addToast = useUIStore((s) => s.addToast);

  useEffect(() => {
    fetchPipeline();
  }, []);

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/pipeline');
      const data = await res.json();
      if (data.pipeline) {
        setPipeline(data.pipeline);
      } else {
        await createDefaultPipeline();
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to load pipeline' });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultPipeline = async () => {
    const res = await fetch('/api/pipeline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Default Project Pipeline',
        stages: STAGE_DEFAULTS.map(s => ({ ...s, status: 'pending' as StageStatus, blockers: [] })),
        currentStageIndex: 0,
      }),
    });
    const data = await res.json();
    if (data.pipeline) setPipeline(data.pipeline);
  };

  const advanceStage = async () => {
    if (!pipeline) return;
    
    const currentStage = pipeline.stages[pipeline.currentStageIndex];
    
    if (currentStage.blockers.length > 0) {
      addToast({ type: 'error', message: 'Cannot advance: blocker present' });
      return;
    }

    try {
      const pipelineId = pipeline.id;
      const res = await fetch('/api/pipeline/' + pipelineId + '/advance', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.pipeline) {
        setPipeline(data.pipeline);
        addToast({ type: 'success', message: 'Advanced to next stage' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Failed to advance stage' });
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Loading Pipeline...</div>;
  if (!pipeline) return <div className="p-8 text-center text-gray-400">No pipeline found.</div>;

  return (
    <div className="flex flex-col w-full h-full p-6 space-y-6 bg-[#0f0f1a] text-white font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{pipeline.name}</h2>
          <p className="text-sm text-gray-400">Workflow progress and validation</p>
        </div>
        <button 
          onClick={advanceStage}
          disabled={pipeline.currentStageIndex === pipeline.stages.length - 1}
          className="px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-all flex items-center gap-2"
        >
          Advance Stage <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="relative flex items-center justify-between max-w-5xl mx-auto w-full px-4 py-8">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-[#2a2a3e] -translate-y-1/2 z-0" />
        <div 
          className="absolute top-1/2 left-0 h-1 bg-[#6366f1] -translate-y-1/2 z-0 transition-all duration-500" 
          style={{ width: String((pipeline.currentStageIndex / (pipeline.stages.length - 1)) * 100) + '%' }}
        />
        
        {pipeline.stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === pipeline.currentStageIndex;
          const isDone = stage.status === 'done';
          const isBlocked = stage.status === 'blocked';

          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center gap-3 group cursor-pointer" onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}>
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 border-4
                ${isDone ? 'bg-[#6366f1] border-[#6366f1] text-white' : 
                  isActive ? 'bg-[#1a1a2e] border-[#6366f1] text-[#6366f1] ring-4 ring-[#6366f1]/20' : 
                  isBlocked ? 'bg-[#1a1a2e] border-red-500 text-red-500' : 
                  'bg-[#1a1a2e] border-[#2a2a3e] text-gray-500'}
              `}>
                {isDone ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
              </div>
              <div className="text-center">
                <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-500'} transition-colors`}>
                  {stage.name}
                </span>
                <div className="text-[10px] uppercase tracking-tighter mt-1">
                  <span className={`
                    px-1.5 py-0.5 rounded-full font-medium
                    ${stage.status === 'done' ? 'bg-green-500/20 text-green-400' : 
                      stage.status === 'active' ? 'bg-blue-500/20 text-blue-400' : 
                      stage.status === 'blocked' ? 'bg-red-500/20 text-red-400' : 
                      stage.status === 'pending' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-500/20 text-gray-400'}
                  `}>
                    {stage.status}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto w-full">
        {expandedStage ? (
          <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2a2a3e] animate-in fade-in slide-in-from-top-2 duration-200">
            {(() => {
              const stage = pipeline.stages.find(s => s.id === expandedStage);
              if (!stage) return null;
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                        <stage.icon className="w-5 h-5 text-[#6366f1]" />
                        {stage.name} Stage Details
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {stage.estimatedDuration}</span>
                        <span className="flex items-center gap-1"><Layers className="w-4 h-4" /> Status: {stage.status}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Entry Criteria</h4>
                      <ul className="space-y-2">
                        {stage.entryCriteria.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Circle className="w-3 h-3 text-gray-600" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Exit Criteria</h4>
                      <ul className="space-y-2">
                        {stage.exitCriteria.map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                            <Circle className="w-3 h-3 text-gray-600" /> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-lg bg-[#0f0f1a] border border-[#2a2a3e]">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <AlertCircle className="w-3 h-3" /> Blockers
                      </h4>
                      {stage.blockers.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No current blockers.</p>
                      ) : (
                        <ul className="space-y-2">
                          {stage.blockers.map((b, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                              <span className="text-red-500">•</span> {b}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="p-4 rounded-lg bg-[#0f0f1a] border border-[#2a2a3e]">
                      <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Linked Workspaces</h4>
                      <div className="flex flex-wrap gap-2">
                        {workspaces.length > 0 ? (
                          workspaces.slice(0, 3).map(ws => (
                            <span key={ws.id} className="px-2 py-1 text-[10px] bg-[#1a1a2e] border border-[#2a2a3e] rounded text-gray-300">
                              {ws.name}
                            </span>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 italic">No linked workspaces.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl border-2 border-dashed border-[#2a2a3e] text-gray-500">
            <p>Click a stage to view detailed criteria and blockers</p>
          </div>
        )}
      </div>
    </div>
  );
}
