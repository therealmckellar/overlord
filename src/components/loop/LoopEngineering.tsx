'use client';

import React, { useState, useCallback } from 'react';
import { useLoopStore, type LoopTask } from '@/stores/loopStore';
import { useUIStore } from '@/stores/uiStore';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import {
  RefreshCw, Trophy, TrendingUp, Play, Pause, Square, BarChart3,
  Clock, Zap, CheckCircle2, XCircle, Loader2, Plus, Pencil, Trash2, X
} from 'lucide-react';

interface LoopEngineeringProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoopEngineering({ isOpen, onClose }: LoopEngineeringProps) {
  const loops = useLoopStore((s) => s.loops);
  const createLoop = useLoopStore((s) => s.createLoop);
  const startLoop = useLoopStore((s) => s.startLoop);
  const stopLoop = useLoopStore((s) => s.stopLoop);
  const deleteLoop = useLoopStore((s) => s.deleteLoop);
  const addToast = useUIStore((s) => s.addToast);

  const [selectedLoopId, setSelectedLoopId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingLoopId, setEditingLoopId] = useState<string | null>(null);

  // New loop form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formModel, setFormModel] = useState(UNIQUE_MODELS[0]?.value || 'google/gemma-4-31b-it:free');
  const [formMaxIter, setFormMaxIter] = useState(5);
  const [formPrompt, setFormPrompt] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editMaxIter, setEditMaxIter] = useState(5);
  const [editPrompt, setEditPrompt] = useState('');

  const selectedLoop = loops.find((l) => l.id === selectedLoopId) || null;

  const handleCreateLoop = useCallback(() => {
    if (!formName.trim() || !formPrompt.trim()) return;
    const id = createLoop({
      name: formName.trim(),
      description: formDescription.trim(),
      model: formModel,
      maxIterations: formMaxIter,
      prompt: formPrompt.trim(),
    });
    setSelectedLoopId(id);
    setShowForm(false);
    setFormName('');
    setFormDescription('');
    setFormPrompt('');
    addToast({ type: 'success', message: `Loop "${formName.trim()}" created`, duration: 3000 });
  }, [formName, formDescription, formModel, formMaxIter, formPrompt, createLoop, addToast]);

  const handleStartLoop = useCallback((id: string) => {
    startLoop(id);
    addToast({ type: 'info', message: 'Loop started', duration: 2000 });
  }, [startLoop, addToast]);

  const handleStopLoop = useCallback((id: string) => {
    stopLoop(id);
    addToast({ type: 'warning', message: 'Loop stopped', duration: 2000 });
  }, [stopLoop, addToast]);

  const handleStopAll = useCallback(() => {
    const runningLoops = loops.filter((l) => l.status === 'running');
    runningLoops.forEach((l) => stopLoop(l.id));
    addToast({ type: 'warning', message: `Stopped ${runningLoops.length} running loop(s)`, duration: 3000 });
  }, [loops, stopLoop, addToast]);

  const handleDeleteLoop = useCallback((id: string) => {
    stopLoop(id);
    deleteLoop(id);
    if (selectedLoopId === id) setSelectedLoopId(null);
    addToast({ type: 'info', message: 'Loop deleted', duration: 2000 });
  }, [stopLoop, deleteLoop, selectedLoopId, addToast]);

  const startEdit = useCallback((loop: LoopTask) => {
    setEditingLoopId(loop.id);
    setEditName(loop.name);
    setEditModel(loop.model);
    setEditMaxIter(loop.maxIterations);
    setEditPrompt(loop.prompt);
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!editingLoopId) return;
    const loop = loops.find((l) => l.id === editingLoopId);
    if (!loop || loop.status === 'running') return;
    useLoopStore.getState().updateLoop(editingLoopId, {
      name: editName,
      model: editModel,
      maxIterations: editMaxIter,
      prompt: editPrompt,
    });
    setEditingLoopId(null);
    addToast({ type: 'success', message: 'Loop updated', duration: 2000 });
  }, [editingLoopId, editName, editModel, editMaxIter, editPrompt, loops, addToast]);

  if (!isOpen) return null;

  const runningCount = loops.filter((l) => l.status === 'running').length;

  return (
    <div className="absolute inset-0 z-10 flex bg-[var(--bg)]">
      {/* Left panel — Loop list */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
            Loop Engineering
            {runningCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {runningCount} running
              </span>
            )}
          </h2>
          <div className="flex items-center gap-1">
            {runningCount > 0 && (
              <button
                onClick={handleStopAll}
                className="px-2 py-1 text-xs rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                title="Stop all"
              >
                Stop All
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="px-2 py-1 text-xs rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3 h-3" /> New
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loops.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-6">
              <RefreshCw className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No loops yet</p>
              <p className="text-xs mt-1 text-center">Create a loop to iterate AI tasks across models</p>
            </div>
          ) : (
            loops.map((loop) => {
              const StatusIcon = loop.status === 'running' ? Loader2 : loop.status === 'complete' ? CheckCircle2 : loop.status === 'error' ? XCircle : Pause;
              return (
                <div
                  key={loop.id}
                  className={`relative group px-4 py-3 border-b border-[var(--border)] cursor-pointer transition-colors ${
                    selectedLoopId === loop.id ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                  onClick={() => setSelectedLoopId(loop.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <StatusIcon className={`w-4 h-4 flex-shrink-0 ${
                        loop.status === 'running' ? 'text-[var(--accent)] animate-spin' :
                        loop.status === 'complete' ? 'text-[var(--success)]' :
                        loop.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'
                      }`} />
                      <span className="text-xs font-medium text-[var(--text)] truncate">{loop.name}</span>
                    </div>
                    {loop.status === 'running' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleStopLoop(loop.id); }}
                        className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Stop
                      </button>
                    )}
                    {loop.status !== 'running' && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEdit(loop); }}
                          className="p-0.5 rounded hover:bg-[var(--border)] text-[var(--text-muted)]"
                          title="Edit"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLoop(loop.id); }}
                          className="p-0.5 rounded hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                    <span>{loop.currentIteration}/{loop.maxIterations} iter</span>
                    <span className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-[var(--warning)]" />
                      {loop.bestScore}
                    </span>
                    <span className="text-[var(--accent)] truncate">{loop.model.split('/').pop()}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        loop.status === 'running' ? 'bg-[var(--accent)]' :
                        loop.status === 'complete' ? 'bg-[var(--success)]' :
                        loop.status === 'error' ? 'bg-red-400' : 'bg-[var(--border)]'
                      }`}
                      style={{ width: `${(loop.currentIteration / loop.maxIterations) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel — Detail or Form */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {showForm ? (
          <NewLoopForm
            name={formName}
            setName={setFormName}
            description={formDescription}
            setDescription={setFormDescription}
            model={formModel}
            setModel={setFormModel}
            maxIter={formMaxIter}
            setMaxIter={setFormMaxIter}
            prompt={formPrompt}
            setPrompt={setFormPrompt}
            onSubmit={handleCreateLoop}
            onCancel={() => setShowForm(false)}
          />
        ) : editingLoopId ? (
          <EditLoopForm
            name={editName}
            setName={setEditName}
            model={editModel}
            setModel={setEditModel}
            maxIter={editMaxIter}
            setMaxIter={setEditMaxIter}
            prompt={editPrompt}
            setPrompt={setEditPrompt}
            onSubmit={handleSaveEdit}
            onCancel={() => setEditingLoopId(null)}
          />
        ) : selectedLoop ? (
          <LoopDetail
            loop={selectedLoop}
            onStart={() => handleStartLoop(selectedLoop.id)}
            onStop={() => handleStopLoop(selectedLoop.id)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center space-y-3">
              <RefreshCw className="w-12 h-12 mx-auto opacity-20" />
              <p className="text-sm">Select a loop to view details</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                Or create a new loop
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── New Loop Form ─── */
function NewLoopForm({
  name, setName, description, setDescription, model, setModel, maxIter, setMaxIter, prompt, setPrompt, onSubmit, onCancel,
}: {
  name: string; setName: (v: string) => void;
  description: string; setDescription: (v: string) => void;
  model: string; setModel: (v: string) => void;
  maxIter: number; setMaxIter: (v: number) => void;
  prompt: string; setPrompt: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Create New Loop</h3>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Loop Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Email Subject Line Optimizer"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of what this loop optimizes"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
            {UNIQUE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Max Iterations</label>
            <input
              type="number"
              min="2"
              max="10"
              value={maxIter}
              onChange={(e) => setMaxIter(parseInt(e.target.value) || 5)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            placeholder="The task prompt — what should the AI iterate on?"
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onSubmit}
            disabled={!name.trim() || !prompt.trim()}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            Create Loop
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Edit Loop Form ─── */
function EditLoopForm({
  name, setName, model, setModel, maxIter, setMaxIter, prompt, setPrompt, onSubmit, onCancel,
}: {
  name: string; setName: (v: string) => void;
  model: string; setModel: (v: string) => void;
  maxIter: number; setMaxIter: (v: number) => void;
  prompt: string; setPrompt: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col p-6 overflow-y-auto">
      <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Edit Loop</h3>
      <div className="space-y-4 max-w-lg">
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Loop Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
            {UNIQUE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Max Iterations</label>
            <input
              type="number"
              min="2"
              max="10"
              value={maxIter}
              onChange={(e) => setMaxIter(parseInt(e.target.value) || 5)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Prompt</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onSubmit}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Loop Detail ─── */
function LoopDetail({ loop, onStart, onStop }: { loop: LoopTask; onStart: () => void; onStop: () => void }) {
  const maxScore = Math.max(...loop.results.map((r) => r.score), 1);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text)]">{loop.name}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">{loop.description}</p>
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs">
              <BarChart3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">Best:</span>
              <span className="font-bold text-[var(--accent)]">{loop.bestScore}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Trophy className="w-3.5 h-3.5 text-[var(--warning)]" />
              <span className="text-[var(--text-secondary)]">Model:</span>
              <span className="font-medium text-[var(--text)]">{loop.model.split('/').pop()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)]">Progress:</span>
              <span className="font-medium text-[var(--text)]">{loop.currentIteration}/{loop.maxIterations}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {loop.status === 'running' ? (
            <button
              onClick={onStop}
              className="px-4 py-2 text-sm bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-medium hover:bg-red-500/20 transition-colors flex items-center gap-2"
            >
              <Square className="w-3.5 h-3.5" /> Stop Loop
            </button>
          ) : (
            <button
              onClick={onStart}
              disabled={loop.status === 'complete'}
              className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" /> {loop.currentIteration > 0 ? 'Resume' : 'Start'}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Score chart */}
        {loop.results.length > 0 && (
          <div className="px-6 py-4 border-b border-[var(--border)]">
            <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Score Progression</h4>
            <div className="flex items-end gap-2 h-24">
              {loop.results.map((result) => (
                <div key={result.iteration} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[var(--text-muted)]">{result.score}</span>
                  <div
                    className="w-full rounded-t bg-[var(--accent)] transition-all duration-500 min-h-[4px]"
                    style={{ height: `${(result.score / 100) * 100}%` }}
                  />
                  <span className="text-[10px] text-[var(--text-muted)]">v{result.iteration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results list */}
        <div className="p-6 space-y-3">
          <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Iteration Results</h4>
          {loop.results.length === 0 ? (
            <div className="text-center py-8 text-[var(--text-muted)] text-sm">
              {loop.status === 'running' ? 'Waiting for first iteration...' : 'Click Start to begin'}
            </div>
          ) : (
            loop.results.map((result) => (
              <div
                key={result.iteration}
                className={`rounded-lg border p-4 ${
                  result.score === loop.bestScore
                    ? 'border-[var(--success)] bg-[var(--success)]/5'
                    : 'border-[var(--border)] bg-[var(--bg-secondary)]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[var(--text)]">Iteration {result.iteration}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                      {loop.model.split('/').pop()}
                    </span>
                    {result.score === loop.bestScore && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)] flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Best
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {result.duration}ms
                    </span>
                    <span className="font-bold text-[var(--text)]">{result.score} pts</span>
                  </div>
                </div>
                <p className="text-sm text-[var(--text)]">{result.output}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
