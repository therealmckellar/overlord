'use client';

import React, { useState, useMemo } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { Search, X, MessageSquare, Pin, Archive } from 'lucide-react';

interface SessionSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function SessionSearch({ isOpen, onClose, onSelectSession }: SessionSearchProps) {
  const [query, setQuery] = useState('');
  const sessions = useSessionStore((s) => s.sessions);

  const results = useMemo(() => {
    if (!query.trim()) return sessions.filter((s) => !s.archived).slice(0, 10);
    const lower = query.toLowerCase();
    return sessions
      .filter((s) => !s.archived && s.title.toLowerCase().includes(lower))
      .slice(0, 20);
  }, [query, sessions]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[var(--overlay)]" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search sessions..."
            className="flex-1 bg-transparent text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              No sessions found
            </div>
          ) : (
            results.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  onSelectSession(session.id);
                  onClose();
                  setQuery('');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
              >
                <MessageSquare className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--text)] truncate">{session.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {session.messageCount} messages · {new Date(session.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {session.pinned && <Pin className="w-3 h-3 text-[var(--accent)]" />}
                  {session.archived && <Archive className="w-3 h-3 text-[var(--text-muted)]" />}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
          {results.length} result{results.length !== 1 ? 's' : ''} · Esc to close
        </div>
      </div>
    </div>
  );
}
