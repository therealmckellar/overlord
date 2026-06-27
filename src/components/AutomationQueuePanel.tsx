'use client';

import React from 'react';
import { useAutomationQueueStore, type AutomationTaskType } from '@/stores/automationQueueStore';
import { Play, CheckCircle, XCircle, AlertCircle, Trash2, RotateCcw, Loader2, Clock, Zap, FileText, Rocket, RefreshCw, Search } from 'lucide-react';

const TYPE_ICONS: Record<AutomationTaskType, any> = {
  research: Search,
  content: FileText,
  deployment: Rocket,
  sync: RefreshCw,
  scan: Zap,
};

const STATUS_COLORS = {
  queued: 'text-[var(--text-muted)] bg-[var(--bg-tertiary)]',
  running: 'text-[var(--accent)] bg-[var(--accent)]/20 animate-pulse',
  complete: 'text-[var(--success)] bg-[var(--success)]/20',
  failed: 'text-[var(--error)] bg-[var(--error)]/20',
  cancelled: 'text-[var(--warning)] bg-[var(--warning)]/20',
};

export function AutomationQueuePanel() {
  const tasks = useAutomationQueueStore((s) => s.tasks);
  const startTask = useAutomationQueueStore((s) => s.startTask);
  const completeTask = useAutomationQueueStore((s) => s.completeTask);
  const failTask = useAutomationQueueStore((s) => s.failTask);
  const cancelTask = useAutomationQueueStore((s) => s.cancelTask);
  const retryTask = useAutomationQueueStore((s) => s.retryTask);
  const clearCompleted = useAutomationQueueStore((s) => s.clearCompleted);
  const clearAll = useAutomationQueueStore((s) => s.clearAll);

  const activeTasks = tasks.filter(t => t.status === 'running' || t.status === 'queued');
  const completedTasks = tasks.filter(t => t.status === 'complete' || t.status === 'failed' || t.status === 'cancelled');

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <h2 className="text-sm font-semibold text-[var(--text)]">Automation Queue</h2>
          {activeTasks.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)]">
              {activeTasks.length} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {completedTasks.length > 0 && (
            <button
              onClick={clearCompleted}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Clear done
            </button>
          )}
          {tasks.length > 0 && (
            <button
              onClick={clearAll}
              className="text-[10px] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {tasks.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Queue is empty.</p>
            <p className="text-xs mt-1">Tasks from pipelines, research, and deployments appear here.</p>
          </div>
        )}

        {/* Active Tasks */}
        {activeTasks.map((task) => {
          const Icon = TYPE_ICONS[task.type] || Zap;
          return (
            <div key={task.id} className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${task.status === 'running' ? 'text-[var(--accent)] animate-pulse' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-sm font-medium text-[var(--text)]">{task.title}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[task.status]}`}>
                  {task.status}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mb-2">{task.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-muted)]">by {task.agentName}</span>
                <div className="flex items-center gap-1">
                  {task.status === 'queued' && (
                    <button
                      onClick={() => startTask(task.id)}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                      title="Start"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                  )}
                  {task.status === 'running' && (
                    <>
                      <button
                        onClick={() => completeTask(task.id)}
                        className="p-1 rounded hover:bg-[var(--success)]/20 text-[var(--text-muted)] hover:text-[var(--success)] transition-colors"
                        title="Mark complete"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => failTask(task.id, 'Manual failure')}
                        className="p-1 rounded hover:bg-[var(--error)]/20 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                        title="Mark failed"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Completed Tasks */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <span className="text-xs text-[var(--text-muted)] mb-2 block">History ({completedTasks.length})</span>
            {completedTasks.slice(0, 10).map((task) => {
              const Icon = TYPE_ICONS[task.type] || Zap;
              return (
                <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center gap-2">
                    {task.status === 'complete' ? (
                      <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                    ) : task.status === 'failed' ? (
                      <XCircle className="w-3.5 h-3.5 text-[var(--error)]" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-[var(--warning)]" />
                    )}
                    <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {task.status === 'failed' && (
                      <button
                        onClick={() => retryTask(task.id)}
                        className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"
                        title="Retry"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                    {task.status === 'running' && (
                      <Loader2 className="w-3 h-3 text-[var(--accent)] animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
