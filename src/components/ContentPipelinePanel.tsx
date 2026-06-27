'use client';

import React, { useState } from 'react';
import { usePipelineStore } from '@/stores/pipelineStore';
import { useAutomationQueueStore } from '@/stores/automationQueueStore';
import { Plus, Trash2, Play, CheckCircle, AlertCircle, Loader2, FileText, Mail, Share2, Presentation, Newspaper } from 'lucide-react';

const FORMAT_ICONS = {
  blog: FileText,
  email: Mail,
  social: Share2,
  deck: Presentation,
  newsletter: Newspaper,
};

const STAGE_LABELS = {
  draft: 'Draft',
  format: 'Format & Polish',
  review: 'Review',
  publish: 'Publish',
};

export function ContentPipelinePanel() {
  const tasks = usePipelineStore((s) => s.tasks);
  const addTask = usePipelineStore((s) => s.addTask);
  const updateTaskStage = usePipelineStore((s) => s.updateTaskStage);
  const updateTaskStatus = usePipelineStore((s) => s.updateTaskStatus);
  const deleteTask = usePipelineStore((s) => s.deleteTask);
  const clearComplete = usePipelineStore((s) => s.clearComplete);

  const addAutomationTask = useAutomationQueueStore((s) => s.addTask);
  const startAutomationTask = useAutomationQueueStore((s) => s.startTask);
  const completeAutomationTask = useAutomationQueueStore((s) => s.completeTask);

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [format, setFormat] = useState<'blog' | 'email' | 'social' | 'deck' | 'newsletter'>('blog');

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) return;
    addTask(title.trim(), content.trim(), format);
    addAutomationTask({
      type: 'content',
      title: `Content: ${title.trim()}`,
      description: `Generate ${format} content`,
      agentId: 'agent-builder',
      agentName: 'Builder',
    });
    setTitle('');
    setContent('');
    setShowCreate(false);
  };

  const handleAdvanceStage = (taskId: string, currentStage: string) => {
    const stages = ['draft', 'format', 'review', 'publish'];
    const idx = stages.indexOf(currentStage);
    if (idx < stages.length - 1) {
      const nextStage = stages[idx + 1] as any;
      updateTaskStage(taskId, currentStage as any, 'complete');
      updateTaskStage(taskId, nextStage, 'running');
    } else {
      updateTaskStage(taskId, currentStage as any, 'complete');
      updateTaskStatus(taskId, 'complete');
    }
  };

  const runningTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'complete');

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h2 className="text-sm font-semibold text-[var(--text)]">Content Pipeline</h2>
          {runningTasks.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] animate-pulse">
              {runningTasks.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          <Plus className="w-3 h-3" />
          New
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="p-4 border-b border-[var(--border)] space-y-3 bg-[var(--bg-secondary)]">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Content title..."
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Raw content or outline..."
            rows={3}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)] resize-none"
          />
          <div className="flex items-center gap-2">
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
            >
              <option value="blog">Blog Post</option>
              <option value="email">Email</option>
              <option value="social">Social Media</option>
              <option value="deck">Presentation Deck</option>
              <option value="newsletter">Newsletter</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={!title.trim() || !content.trim()}
              className="px-4 py-2 text-sm rounded-lg bg-[var(--success)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Add to Pipeline
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {tasks.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)]">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No content in pipeline yet.</p>
            <p className="text-xs mt-1">Add content to start the generate → format → review → publish flow.</p>
          </div>
        )}

        {runningTasks.map((task) => {
          const Icon = FORMAT_ICONS[task.targetFormat] || FileText;
          return (
            <div key={task.id} className="p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text)]">{task.title}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] uppercase">
                    {task.targetFormat}
                  </span>
                </div>
                <button
                  onClick={() => handleAdvanceStage(task.id, task.currentStage)}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-[var(--success)]/20 text-[var(--success)] hover:bg-[var(--success)]/30 transition-colors"
                >
                  <Play className="w-3 h-3" />
                  Advance
                </button>
              </div>

              {/* Stage Progress */}
              <div className="flex items-center gap-1">
                {task.stages.map((stage, i) => (
                  <React.Fragment key={stage.name}>
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${
                      stage.status === 'running' ? 'bg-[var(--accent)]/20 text-[var(--accent)] animate-pulse' :
                      stage.status === 'complete' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                      'bg-[var(--bg-tertiary)] text-[var(--text-muted)]'
                    }`}>
                      {stage.status === 'complete' && <CheckCircle className="w-2.5 h-2.5" />}
                      {stage.status === 'running' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
                      {STAGE_LABELS[stage.name]}
                    </div>
                    {i < task.stages.length - 1 && (
                      <div className="w-3 h-px bg-[var(--border)]" />
                    )}
                  </React.Fragment>
                ))}
              </div>

              {task.currentStage === 'draft' && (
                <p className="text-xs text-[var(--text-muted)] mt-2 line-clamp-2">{task.content}</p>
              )}
            </div>
          );
        })}

        {completedTasks.length > 0 && (
          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-muted)]">Completed ({completedTasks.length})</span>
              <button onClick={clearComplete} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                Clear
              </button>
            </div>
            {completedTasks.slice(0, 5).map((task) => {
              const Icon = FORMAT_ICONS[task.targetFormat] || FileText;
              return (
                <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-[var(--success)]" />
                    <Icon className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    <span className="text-xs text-[var(--text-secondary)]">{task.title}</span>
                  </div>
                  <button onClick={() => deleteTask(task.id)} className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
