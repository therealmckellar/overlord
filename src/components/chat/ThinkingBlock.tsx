'use client';

import React, { useState } from 'react';
import { ChevronRight, Brain } from 'lucide-react';

interface ThinkingBlockProps {
  content: string;
}

export function ThinkingBlock({ content }: ThinkingBlockProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="my-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
      >
        <Brain className="w-3.5 h-3.5 text-[var(--accent)]" />
        <span className="font-medium">Thinking</span>
        <ChevronRight
          className={`w-3.5 h-3.5 ml-auto transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
        />
      </button>
      {expanded && (
        <div className="px-3 pb-3 border-t border-[var(--border)]">
          <pre className="mt-2 text-xs text-[var(--text-muted)] whitespace-pre-wrap font-mono leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
}
