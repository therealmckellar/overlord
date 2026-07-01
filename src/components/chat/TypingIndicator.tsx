'use client';

import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  agentName?: string;
  persona?: string;
}

export function TypingIndicator({ agentName = 'Assistant', persona }: TypingIndicatorProps) {
  return (
    <div className="flex gap-3 items-start">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-tertiary)]">
        <Bot className="w-4 h-4 text-[var(--text-secondary)]" />
      </div>

      {/* Typing bubble */}
      <div className="flex flex-col items-start">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-[var(--text-secondary)]">
            {agentName}
          </span>
          {persona && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent)]">
              {persona}
            </span>
          )}
        </div>
        <div className="rounded-xl px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div className="flex items-center gap-1.5">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '0ms', animationDuration: '1.4s' }} />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '200ms', animationDuration: '1.4s' }} />
              <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" style={{ animationDelay: '400ms', animationDuration: '1.4s' }} />
            </div>
            <span className="text-xs text-[var(--text-muted)] ml-1">thinking…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
