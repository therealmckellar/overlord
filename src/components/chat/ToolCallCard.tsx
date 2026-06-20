'use client';

import React, { useState } from 'react';
import { ChevronRight, Wrench, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface ToolCallCardProps {
  toolName: string;
  input: string;
  output?: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  duration?: number;
}

export function ToolCallCard({ toolName, input, output, status, duration }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-3.5 h-3.5 text-[var(--warning)] animate-spin" />,
    running: <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />,
    complete: <CheckCircle2 className="w-3.5 h-3.5 text-[var(--success)]" />,
    error: <XCircle className="w-3.5 h-3.5 text-[var(--error)]" />,
  };

  const statusColor = {
    pending: 'border-[var(--warning)]',
    running: 'border-[var(--accent)]',
    complete: 'border-[var(--success)]',
    error: 'border-[var(--error)]',
  };

  return (
    <div className={`my-2 rounded-lg border ${statusColor[status]} bg-[var(--bg-secondary)] overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        {statusIcon[status]}
        <Wrench className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="font-medium text-[var(--text)]">{toolName}</span>
        {duration !== undefined && (
          <span className="text-[var(--text-muted)] ml-1">{duration}ms</span>
        )}
        <ChevronRight
          className={`w-3.5 h-3.5 ml-auto text-[var(--text-muted)] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="border-t border-[var(--border)]">
          <div className="px-3 py-2">
            <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Input</div>
            <pre className="text-xs text-[var(--code-text)] bg-[var(--code-bg)] rounded p-2 overflow-x-auto font-mono">
              {input}
            </pre>
          </div>
          {output && (
            <div className="px-3 pb-2">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1">Output</div>
              <pre className="text-xs text-[var(--code-text)] bg-[var(--code-bg)] rounded p-2 overflow-x-auto font-mono max-h-48 overflow-y-auto">
                {output}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
