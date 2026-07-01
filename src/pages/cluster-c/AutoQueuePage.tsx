'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  ListOrdered, 
  Zap, 
  Activity, 
  Settings, 
  Cpu, 
  Clock, 
  Trophy,
  AlertCircle,
  ChevronRight
} from 'lucide-react';

// --- Types ---
interface QueuedTask {
  id: string;
  priority: 'high' | 'medium' | 'low';
  taskType: string;
  scheduledTime: string;
  resourceRequirements: {
    tokens: number;
    compute: number;
  };
  status: 'pending' | 'executing' | 'completed';
}

// --- Mock Data ---
const MOCK_QUEUE: QueuedTask[] = [
  { 
    id: 'task-101', 
    priority: 'high', 
    taskType: 'Emergency-API-Patch', 
    scheduledTime: '2026-06-30T14:00:00Z', 
    resourceRequirements: { tokens: 5000, compute: 20 }, 
    status: 'executing' 
  },
  { 
    id: 'task-102', 
    priority: 'medium', 
    taskType: 'Weekly-Market-Audit', 
    scheduledTime: '2026-06-30T15:30:00Z', 
    resourceRequirements: { tokens: 12000, compute: 40 }, 
    status: 'pending' 
  },
  { 
    id: 'task-103', 
    priority: 'low', 
    taskType: 'Log-Cleanup-Job', 
    scheduledTime: '2026-07-01T02:00:00Z', 
    resourceRequirements: { tokens: 2000, compute: 10 }, 
    status: 'pending' 
  },
  { 
    id: 'task-104', 
    priority: 'high', 
    taskType: 'Knowledge-Sync-Core', 
    scheduledTime: '2026-06-30T16:00:00Z', 
    resourceRequirements: { tokens: 25000, compute: 60 }, 
    status: 'pending' 
  },
];

export default function AutoQueuePage() {
  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <ListOrdered className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Autonomous Task Queue</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md text-xs hover:bg-indigo-500/20 transition-all">
            AI-Optimize Queue
          </button>
          <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-700 transition-all">
            Queue Settings
          </button>
        </div>
      </div>

      {/* Resource Monitor */}
      <div className="col-span-12 grid grid-cols-3 gap-4">
        <PanelWrapper title="API Token Pool">
          <div className="flex items-center justify-between">
            <Zap className="text-indigo-400 w-5 h-5" />
            <span className="text-xs font-mono text-slate-300">1.4M / 5M tokens</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[28%] shadow-[0_0_10px_#6366f1]" />
          </div>
        </PanelWrapper>
        <PanelWrapper title="Compute Allocation">
          <div className="flex items-center justify-between">
            <Cpu className="text-indigo-400 w-5 h-5" />
            <span className="text-xs font-mono text-slate-300">32% utilized</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[32%]" />
          </div>
        </PanelWrapper>
        <PanelWrapper title="Memory Buffer">
          <div className="flex items-center justify-between">
            <Activity className="text-indigo-400 w-5 h-5" />
            <span className="text-xs font-mono text-slate-300">4.2GB / 16GB</span>
          </div>
          <div className="mt-3 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[26%]" />
          </div>
        </PanelWrapper>
      </div>

      {/* Task Queue Table */}
      <div className="col-span-8">
        <PanelWrapper title="Priority Task Schedule">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                <th className="pb-2 font-medium">ID</th>
                <th className="pb-2 font-medium">Task Type</th>
                <th className="pb-2 font-medium">Priority</th>
                <th className="pb-2 font-medium">Resources</th>
                <th className="pb-2 font-medium">Scheduled</th>
                <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {MOCK_QUEUE.map(task => (
                  <tr key={task.id} className="group hover:bg-indigo-500/5 transition-colors">
                    <td className="py-3 text-slate-500">{task.id}</td>
                    <td className="py-3 text-slate-300 font-bold">{task.taskType}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${
                        task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                        task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                        'bg-slate-700 text-slate-400 border border-slate-700'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">
                      {task.resourceRequirements.tokens.toLocaleString()}t / {task.resourceRequirements.compute}c
                    </td>
                    <td className="py-3 text-slate-400">{new Date(task.scheduledTime).toLocaleString()}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'executing' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'
                        }`} />
                        <span className={task.status === 'executing' ? 'text-indigo-400' : 'text-slate-500'}>
                          {task.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelWrapper>
      </div>

      {/* Scheduler Settings */}
      <div className="col-span-4 space-y-4">
        <PanelWrapper title="Autonomous Scheduler">
          <div className="space-y-4">
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Recurrence Pattern</span>
                <Clock size={14} className="text-indigo-400" />
              </div>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value="0 0 * * *" 
                  readOnly
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-xs font-mono text-indigo-300"
                />
                <button className="p-1.5 bg-slate-800 border border-slate-700 rounded-md hover:bg-slate-700 transition-all">
                  <Settings size={14} />
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic">Runs daily at midnight UTC</p>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg space-y-3">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-slate-400">Resource Guardrails</span>
                <AlertCircle size={14} className="text-indigo-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Max Daily Tokens</span>
                  <span>5,000,000</span>
                </div>
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full w-1/2" />
                </div>
              </div>
            </div>
            <button className="w-full py-2 bg-indigo-500 text-white rounded-md text-xs font-medium hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">
              Apply Scheduler Changes
            </button>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
