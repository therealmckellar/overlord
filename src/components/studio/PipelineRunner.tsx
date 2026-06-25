'use client';

import React, { useState, useCallback } from 'react';
import { Play, Pause, CheckCircle2, XCircle, Loader2, X } from 'lucide-react';

interface PipelineRunnerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  output: string;
}

const DEFAULT_STEPS: PipelineStep[] = [
  { id: '1', name: 'Analyze Request', status: 'pending', output: '' },
  { id: '2', name: 'Plan Architecture', status: 'pending', output: '' },
  { id: '3', name: 'Implement Code', status: 'pending', output: '' },
  { id: '4', name: 'Review & Test', status: 'pending', output: '' },
  { id: '5', name: 'Deploy', status: 'pending', output: '' },
];

export function PipelineRunner({ isOpen, onClose }: PipelineRunnerProps) {
  const [steps, setSteps] = useState<PipelineStep[]>(DEFAULT_STEPS);
  const [isRunning, setIsRunning] = useState(false);

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    setSteps(DEFAULT_STEPS.map((s) => ({ ...s, status: 'pending', output: '' })));

    for (let i = 0; i < DEFAULT_STEPS.length; i++) {
      setSteps((prev) =>
        prev.map((s, idx) => (idx === i ? { ...s, status: 'running' } : s))
      );

      // Simulate execution
      await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));

      const success = Math.random() > 0.1;
      setSteps((prev) =>
        prev.map((s, idx) =>
          idx === i
            ? {
                ...s,
                status: success ? 'complete' : 'error',
                output: success
                  ? `✓ ${s.name} completed successfully`
                  : `✗ ${s.name} failed: Process error`,
              }
            : s
        )
      );

      if (!success) {
        setIsRunning(false);
        return;
      }
    }

    setIsRunning(false);
  }, []);

  const resetPipeline = useCallback(() => {
    setSteps(DEFAULT_STEPS.map((s) => ({ ...s, status: 'pending', output: '' })));
  }, []);

  if (!isOpen) return null;

  const completedCount = steps.filter((s) => s.status === 'complete').length;
  const errorCount = steps.filter((s) => s.status === 'error').length;

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">Pipeline Runner</span>
          {completedCount === steps.length && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--success)]/10 text-[var(--success)]">
              Complete
            </span>
          )}
          {errorCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400">
              {errorCount} error{errorCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {!isRunning ? (
            <button
              onClick={runPipeline}
              className="px-2 py-1 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> Run
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(false)}
              className="px-2 py-1 text-xs rounded bg-[var(--warning)] text-white hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <Pause className="w-3 h-3" /> Stop
            </button>
          )}
          <button
            onClick={resetPipeline}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Pipeline Steps */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
              step.status === 'complete'
                ? 'border-[var(--success)]/30 bg-[var(--success)]/5'
                : step.status === 'error'
                ? 'border-red-500/30 bg-red-500/5'
                : step.status === 'running'
                ? 'border-[var(--accent)]/30 bg-[var(--accent)]/5'
                : 'border-[var(--border)] bg-[var(--bg-secondary)]'
            }`}
          >
            <div className="mt-0.5">
              {step.status === 'complete' ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" />
              ) : step.status === 'error' ? (
                <XCircle className="w-4 h-4 text-red-400" />
              ) : step.status === 'running' ? (
                <Loader2 className="w-4 h-4 text-[var(--accent)] animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-[var(--border)]" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text)]">
                  {idx + 1}. {step.name}
                </span>
              </div>
              {step.output && (
                <p className={`text-[10px] mt-1 font-mono ${
                  step.status === 'error' ? 'text-red-400' : 'text-[var(--text-muted)]'
                }`}>
                  {step.output}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-[var(--text-muted)]">{completedCount}/{steps.length} steps</span>
          <span className="text-[10px] text-[var(--text-muted)]">{Math.round((completedCount / steps.length) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}
