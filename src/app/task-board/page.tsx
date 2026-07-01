'use client';

import React from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { useMockData } from '@/hooks/useMockData';
import { TaskCard } from '@/hooks/useMockData';

const COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'text-slate-400' },
  { id: 'active', label: 'In Progress', color: 'text-indigo-400' },
  { id: 'review', label: 'Review', color: 'text-amber-400' },
  { id: 'done', label: 'Done', color: 'text-emerald-400' },
];

const PRIORITY_COLORS = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TaskBoardPage() {
  const { tasks } = useMockData();

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Operational Task Board</h1>
          <p className="text-slate-400 text-sm">Manage agent queues and human-in-the-loop reviews</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            + New Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {COLUMNS.map((col) => (
          <div key={col.id} className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2 mb-2">
              <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{col.label}</h2>
              <span className="ml-auto text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
                {tasks.filter(t => t.status === col.id).length}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 min-h-[calc(100vh-200px)]">
              {tasks
                .filter(t => t.status === col.id)
                .map((task) => (
                  <PanelWrapper key={task.id} className="hover:border-indigo-500/50 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium uppercase ${PRIORITY_COLORS[task.priority]}`}>
                        {task.priority}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{task.id}</span>
                    </div>
                    
                    <h4 className="text-sm font-medium text-slate-200 mb-1 group-hover:text-white transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4">
                      {task.description}
                    </p>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                          {task.assignedAgentName?.[0]}
                        </div>
                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                          {task.assignedAgentName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {task.deadline}
                      </span>
                    </div>
                  </PanelWrapper>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
