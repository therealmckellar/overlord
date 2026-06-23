'use client';

import React, { useState } from 'react';
import {
  RefreshCw, Trophy, TrendingUp, Play, Pause,
  BarChart3, Clock, Zap, CheckCircle2, XCircle, Loader2
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface LoopTask {
  id: string;
  name: string;
  description: string;
  status: 'idle' | 'running' | 'complete' | 'error';
  iterations: number;
  maxIterations: number;
  currentScore: number;
  bestScore: number;
  bestModel: string;
  results: LoopResult[];
  createdAt: number;
}

interface LoopResult {
  iteration: number;
  model: string;
  score: number;
  output: string;
  duration: number;
  timestamp: number;
}

const DEMO_TASKS: LoopTask[] = [
  {
    id: 'loop_1',
    name: 'Email Subject Line Optimizer',
    description: 'Generate and score email subject lines for Robbi Promotional outreach',
    status: 'complete',
    iterations: 5,
    maxIterations: 5,
    currentScore: 94,
    bestScore: 94,
    bestModel: 'claude-sonnet-4',
    results: [
      { iteration: 1, model: 'gpt-4o', score: 72, output: 'Boost Your Brand with Custom Merch', duration: 1200, timestamp: Date.now() - 300000 },
      { iteration: 2, model: 'claude-sonnet-4', score: 85, output: 'Your Brand Deserves Better Merch', duration: 980, timestamp: Date.now() - 240000 },
      { iteration: 3, model: 'gpt-4o', score: 78, output: 'Stand Out with Promotional Products', duration: 1100, timestamp: Date.now() - 180000 },
      { iteration: 4, model: 'claude-sonnet-4', score: 91, output: 'Merch That Moves: Custom Branding Solutions', duration: 1050, timestamp: Date.now() - 120000 },
      { iteration: 5, model: 'claude-sonnet-4', score: 94, output: '🔥 Limited: Premium Merch for Forward-Thinking Brands', duration: 920, timestamp: Date.now() - 60000 },
    ],
    createdAt: Date.now() - 600000,
  },
  {
    id: 'loop_2',
    name: 'Funding Pitch Refiner',
    description: 'Iterate on commercial funding pitch copy for maximum conversion',
    status: 'running',
    iterations: 3,
    maxIterations: 5,
    currentScore: 81,
    bestScore: 81,
    bestModel: 'gpt-4o',
    results: [
      { iteration: 1, model: 'gpt-4o', score: 65, output: 'Get the capital your business needs', duration: 1400, timestamp: Date.now() - 120000 },
      { iteration: 2, model: 'claude-sonnet-4', score: 74, output: 'Unlock growth capital in as little as 24 hours', duration: 1100, timestamp: Date.now() - 60000 },
      { iteration: 3, model: 'gpt-4o', score: 81, output: 'From application to funding: your 24-hour capital solution', duration: 1300, timestamp: Date.now() - 10000 },
    ],
    createdAt: Date.now() - 300000,
  },
];

interface LoopEngineeringProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoopEngineering({ isOpen, onClose }: LoopEngineeringProps) {
  const [tasks, setTasks] = useState<LoopTask[]>(DEMO_TASKS);
  const [selectedTask, setSelectedTask] = useState<LoopTask | null>(null);
  const [showForm, setShowForm] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg)]">
      {/* Left panel — Task list */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[var(--accent)]" />
            Loop Engineering
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="px-2 py-1 text-xs rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              + New Loop
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {tasks.map((task) => {
            const StatusIcon = task.status === 'running' ? Loader2 : task.status === 'complete' ? CheckCircle2 : task.status === 'error' ? XCircle : Play;
            return (
              <button
                key={task.id}
                onClick={() => setSelectedTask(task)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                  selectedTask?.id === task.id ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <StatusIcon className={`w-4 h-4 flex-shrink-0 ${task.status === 'running' ? 'text-[var(--accent)] animate-spin' : task.status === 'complete' ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`} />
                  <span className="text-xs font-medium text-[var(--text)] truncate">{task.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-[10px] text-[var(--text-muted)]">
                  <span>{task.iterations}/{task.maxIterations} iterations</span>
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-[var(--warning)]" />
                    {task.bestScore}
                  </span>
                  <span className="text-[var(--accent)]">{task.bestModel}</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                    style={{ width: `${(task.iterations / task.maxIterations) * 100}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel — Task detail */}
      <div className="flex-1 flex flex-col">
        {selectedTask ? (
          <TaskDetail task={selectedTask} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center space-y-3">
              <RefreshCw className="w-12 h-12 mx-auto opacity-20" />
              <p className="text-sm">Select a loop task to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskDetail({ task }: { task: LoopTask }) {
  const maxScore = Math.max(...task.results.map((r) => r.score), 1);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text)]">{task.name}</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1">{task.description}</p>
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1.5 text-xs">
            <BarChart3 className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">Best Score:</span>
            <span className="font-bold text-[var(--accent)]">{task.bestScore}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Trophy className="w-3.5 h-3.5 text-[var(--warning)]" />
            <span className="text-[var(--text-secondary)]">Best Model:</span>
            <span className="font-medium text-[var(--text)]">{task.bestModel}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            <span className="text-[var(--text-secondary)]">Iterations:</span>
            <span className="font-medium text-[var(--text)]">{task.iterations}/{task.maxIterations}</span>
          </div>
        </div>
      </div>

      {/* Score chart */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Score Progression</h4>
        <div className="flex items-end gap-2 h-24">
          {task.results.map((result) => (
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

      {/* Results list */}
      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        <h4 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Iteration Results</h4>
        {task.results.map((result) => (
          <div
            key={result.iteration}
            className={`rounded-lg border p-4 ${
              result.score === task.bestScore
                ? 'border-[var(--success)] bg-[var(--success)]/5'
                : 'border-[var(--border)] bg-[var(--bg-secondary)]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[var(--text)]">Iteration {result.iteration}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                  {result.model}
                </span>
                {result.score === task.bestScore && (
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
        ))}
      </div>
    </div>
  );
}
