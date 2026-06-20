'use client';

import React, { useEffect } from 'react';
import { useCommandPalette, COMMANDS } from '@/hooks/useCommandPalette';

interface CommandPaletteProps {
  onSelect: (command: string) => void;
}

export function CommandPalette({ onSelect }: CommandPaletteProps) {
  const { query, setQuery, results, isOpen, setOpen } = useCommandPalette();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-[var(--border)]">
          <input
            autoFocus
            type="text"
            placeholder="Search commands..."
            className="w-full bg-transparent border-none outline-none text-[var(--text)] placeholder:text-[var(--text-muted)] text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
          {results.length > 0 ? (
            results.map((cmd) => (
              <button
                key={cmd.value}
                onClick={() => {
                  onSelect(cmd.value);
                  setOpen(false);
                }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors group"
              >
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium text-[var(--text)] group-hover:text-[var(--accent)]">
                    {cmd.label}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">{cmd.description}</span>
                </div>
                <span className="text-xs font-mono text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-2 py-1 rounded border border-[var(--border)]">
                  {cmd.value}
                </span>
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-[var(--text-muted)]">
              No commands found matching "{query}"
            </div>
          )}
        </div>
        <div className="p-2 bg-[var(--bg-tertiary)] border-t border-[var(--border)] flex justify-end gap-2">
          <span className="text-[10px] text-[var(--text-muted)] px-2 py-1">
            Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}
