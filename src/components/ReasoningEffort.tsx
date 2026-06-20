'use client';

import React from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Brain } from 'lucide-react';

const LEVELS = ['low', 'medium', 'high'] as const;
type Level = typeof LEVELS[number];

const LEVEL_LABELS: Record<Level, string> = {
  low: 'Fast',
  medium: 'Balanced',
  high: 'Deep',
};

const LEVEL_COLORS: Record<Level, string> = {
  low: 'text-zinc-400',
  medium: 'text-amber-400',
  high: 'text-emerald-400',
};

export const ReasoningEffort = () => {
  const { reasoningEffort, setReasoningEffort } = useUIStore();

  const cycle = () => {
    const idx = LEVELS.indexOf(reasoningEffort);
    const next = LEVELS[(idx + 1) % LEVELS.length];
    setReasoningEffort(next);
  };

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 transition-all duration-200 group"
      title={`Reasoning: ${reasoningEffort} (click to cycle)`}
    >
      <Brain className={`w-3 h-3 ${LEVEL_COLORS[reasoningEffort]} group-hover:brightness-125`} />
      <span className={`text-xs font-medium ${LEVEL_COLORS[reasoningEffort]}`}>
        {LEVEL_LABELS[reasoningEffort]}
      </span>
    </button>
  );
};
