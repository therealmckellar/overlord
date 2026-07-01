'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  Repeat, 
  AlertCircle, 
  Play, 
  Pause, 
  Square, 
  ChevronRight, 
  Activity,
  Zap
} from 'lucide-react';

// --- Types ---
interface ExitCondition {
  id: string;
  type: 'budget' | 'goal' | 'depth' | 'manual';
  threshold: number | string;
  isMet: boolean;
}

interface LoopDefinition {
  id: string;
  name: string;
  trigger: string;
  recursionLimit: number;
  exitConditions: ExitCondition[];
}

interface LoopInstance {
  id: string;
  definitionId: string;
  currentIteration: number;
  maxDepth: number;
  status: 'running' | 'paused' | 'completed' | 'broken';
  logs: LogEntry[];
}

interface LogEntry {
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error';
}

// --- Mock Data ---
const MOCK_DEFINITIONS: LoopDefinition[] = [
  {
    id: 'loop-1',
    name: 'Recursive-Loop-SDR-Cleanup',
    trigger: 'Daily-CRM-Sync',
    recursionLimit: 50,
    exitConditions: [
      { id: 'ec-1', type: 'budget', threshold: '10%', isMet: false },
      { id: 'ec-2', type: 'goal', threshold: 'Clean-State', isMet: false },
      { id: 'ec-3', type: 'depth', threshold: 10, isMet: false },
    ],
  },
  {
    id: 'loop-2',
    name: 'Knowledge-Graph-Expansion',
    trigger: 'New-Entity-Detection',
    recursionLimit: 100,
    exitConditions: [
      { id: 'ec-4', type: 'budget', threshold: '5%', isMet: false },
      { id: 'ec-5', type: 'manual', threshold: 'User-Stop', isMet: false },
    ],
  },
];

const MOCK_INSTANCES: LoopInstance[] = [
  {
    id: 'inst-1',
    definitionId: 'loop-1',
    currentIteration: 4,
    maxDepth: 10,
    status: 'running',
    logs: [
      { timestamp: '10:00:01', message: 'Initiating SDR cleanup iteration 1...', level: 'info' },
      { timestamp: '10:00:45', message: 'Entity ID:USR-442 identified as duplicate.', level: 'info' },
      { timestamp: '10:01:12', message: 'Recursive call triggered for nested dependency.', level: 'info' },
      { timestamp: '10:02:05', message: 'Token budget approaching threshold.', level: 'warn' },
    ],
  },
  {
    id: 'inst-2',
    definitionId: 'loop-2',
    currentIteration: 22,
    maxDepth: 100,
    status: 'paused',
    logs: [
      { timestamp: '09:15:00', message: 'Expanding concept: "Quantum Machine Learning"', level: 'info' },
      { timestamp: '09:16:30', message: 'Connection timeout on node-relay-04.', level: 'error' },
    ],
  },
];

export default function LoopsPage() {
  const [instances] = useState<LoopInstance[]>(MOCK_INSTANCES);

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Global Control Bar */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <Repeat className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Autonomous Loops</h1>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-md text-xs transition-all">
            <Play size={14} /> Resume All
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-md text-xs transition-all">
            <Pause size={14} /> Pause All
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md text-xs transition-all">
            <Square size={14} /> Force Break
          </button>
        </div>
      </div>

      {/* Loop Graph Visualization (Mock) */}
      <div className="col-span-8">
        <PanelWrapper title="Recursive Task Chain">
          <div className="relative h-[500px] w-full bg-slate-900/30 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden">
            {/* Mock SVG Graph */}
            <svg className="absolute inset-0 w-full h-full opacity-40">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
                </marker>
              </defs>
              <circle cx="200" cy="250" r="40" fill="none" stroke="#6366f1" strokeWidth="2" />
              <circle cx="400" cy="150" r="40" fill="none" stroke="#6366f1" strokeWidth="2" />
              <circle cx="400" cy="350" r="40" fill="none" stroke="#6366f1" strokeWidth="2" />
              <circle cx="600" cy="250" r="40" fill="none" stroke="#6366f1" strokeWidth="2" />
              <line x1="240" y1="250" x2="360" y2="150" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="240" y1="250" x2="360" y2="350" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="440" y1="150" x2="560" y2="250" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
              <line x1="440" y1="350" x2="560" y2="250" stroke="#6366f1" strokeWidth="2" markerEnd="url(#arrowhead)" />
            </svg>
            <div className="z-10 text-center">
              <Activity className="w-12 h-12 text-indigo-400 animate-pulse mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Iterative Flow: <span className="text-indigo-300 font-mono">SDR-Cleanup-v4</span></p>
            </div>
          </div>
        </PanelWrapper>
      </div>

      {/* Exit Condition Monitor */}
      <div className="col-span-4 flex flex-col gap-4">
        <PanelWrapper title="Exit Condition Monitor">
          <div className="grid grid-cols-1 gap-3">
            {MOCK_DEFINITIONS[0].exitConditions.map((cond) => (
              <div key={cond.id} className="flex items-center justify-between p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${cond.isMet ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-slate-600'}`} />
                  <div>
                    <p className="text-xs font-medium uppercase text-slate-500">{cond.type}</p>
                    <p className="text-sm text-slate-300 font-mono">{cond.threshold}</p>
                  </div>
                </div>
                {!cond.isMet && <div className="text-[10px] text-slate-600 bg-slate-800 px-2 py-0.5 rounded">WAITING</div>}
                {cond.isMet && <div className="text-[10px] text-green-500 bg-green-500/10 px-2 py-0.5 rounded">MET</div>}
              </div>
            ))}
          </div>
        </PanelWrapper>

        <PanelWrapper title="Active Loop Instances">
          <div className="flex flex-col gap-3">
            {instances.map((inst) => (
              <div key={inst.id} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg hover:border-indigo-500/30 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono text-indigo-400">#{inst.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                    inst.status === 'running' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {inst.status}
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="text-sm text-slate-300">Iteration {inst.currentIteration}/{inst.maxDepth}</div>
                  <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-500" 
                    style={{ width: `${(inst.currentIteration / inst.maxDepth) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      </div>

      {/* Log Stream */}
      <div className="col-span-12">
        <PanelWrapper title="Loop Log Stream">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs h-48 overflow-y-auto space-y-1">
            {MOCK_INSTANCES[0].logs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-slate-600">[{log.timestamp}]</span>
                <span className={`font-bold ${
                  log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-yellow-400' : 'text-indigo-400'
                }`}>
                  {log.level.toUpperCase()}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
            <div className="flex gap-3 animate-pulse">
              <span className="text-slate-600">[NOW]</span>
              <span className="text-indigo-400 font-bold">INFO</span>
              <span className="text-slate-500 italic">Awaiting next recursive step...</span>
            </div>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
