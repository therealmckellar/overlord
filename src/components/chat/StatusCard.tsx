'use client';

import React from 'react';
import { Cpu, Clock, Hash, Zap } from 'lucide-react';

interface StatusCardProps {
  model?: string;
  tokenCount?: number;
  elapsedMs?: number;
  reasoningEffort?: string;
}

export function StatusCard({ model, tokenCount, elapsedMs, reasoningEffort }: StatusCardProps) {
  return (
    <div className="flex items-center gap-3 px-3 py-1.5 text-[10px] text-[var(--text-muted)] border-t border-[var(--border)] bg-[var(--bg-secondary)]">
      {model && (
        <span className="flex items-center gap-1">
          <Cpu className="w-3 h-3" />
          {model}
        </span>
      )}
      {tokenCount !== undefined && (
        <span className="flex items-center gap-1">
          <Hash className="w-3 h-3" />
          {tokenCount.toLocaleString()} tokens
        </span>
      )}
      {elapsedMs !== undefined && (
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {(elapsedMs / 1000).toFixed(1)}s
        </span>
      )}
      {reasoningEffort && (
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3" />
          {reasoningEffort}
        </span>
      )}
    </div>
  );
}
