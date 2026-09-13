'use client';

import React, { useState, useEffect } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';

interface KanbanTask {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string | null;
  agentId: string | null;
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'text-slate-400' },
  { id: 'todo', label: 'To Do', color: 'text-blue-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-indigo-400' },
  { id: 'paused', label: 'Paused', color: 'text-amber-400' },
  { id: 'review', label: 'Review', color: 'text-purple-400' },
  { id: 'done', label: 'Done', color: 'text-emerald-400' },
];

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  medium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  high: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  urgent: 'bg-red-500/20 text-red-400 border-red-500/30',
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TaskBoardPage() {
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/kanban')
      .then(r => r.json())
      .then(data => {
        setTasks(data.tasks || data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Task Board</h1>
          <p className="text-slate-400 text-sm">
            {loading ? 'Loading...' : `${tasks.length} tasks from Hermes kanban`}
          </p>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-slate-400 text-sm">Loading tasks...</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter(t => t.status === col.id);
            return (
              <div key={col.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-2 px-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${col.color.replace('text-', 'bg-')}`} />
                  <h2 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{col.label}</h2>
                  <span className="ml-auto text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex flex-col gap-3 min-h-[200px]">
                  {colTasks.map((task) => (
                    <PanelWrapper key={task.id} className="hover:border-indigo-500/50 transition-all cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium uppercase ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.medium}`}>
                          {task.priority}
                        </span>
                        <span className="text-[9px] text-slate-500 font-mono">{task.id.slice(0, 8)}</span>
                      </div>

                      <h4 className="text-xs font-medium text-slate-200 mb-1 group-hover:text-white transition-colors line-clamp-2">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                        {task.assignee ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[8px] font-bold text-indigo-400">
                              {task.assignee[0]?.toUpperCase()}
                            </div>
                            <span className="text-[9px] text-slate-400 truncate max-w-[60px]">
                              {task.assignee}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-600">Unassigned</span>
                        )}
                        {task.tags?.length > 0 && (
                          <span className="text-[8px] text-slate-500 bg-slate-800 px-1 py-0.5 rounded">
                            {task.tags[0]}
                          </span>
                        )}
                      </div>
                    </PanelWrapper>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-[10px] text-slate-600 text-center py-8">No tasks</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
