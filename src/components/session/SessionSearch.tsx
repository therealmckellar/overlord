'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useMessageStore } from '@/stores/messageStore';
import { Search, X, MessageSquare, Pin, Archive } from 'lucide-react';

interface SessionSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

interface SearchResult {
  type: 'session' | 'message';
  id: string;
  sessionId: string;
  title: string;
  snippet: string;
  messageCount: number;
  updatedAt: number;
  pinned: boolean;
}

export function SessionSearch({ isOpen, onClose, onSelectSession }: SessionSearchProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const sessions = useSessionStore((s) => s.sessions);
  const messagesBySession = useMessageStore((s) => s.messagesBySession);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(handler);
  }, [query]);

  const results = useMemo<SearchResult[]>(() => {
    if (!debouncedQuery.trim()) {
      return sessions.filter((s) => !s.archived).slice(0, 10).map(s => ({
        type: 'session',
        id: s.id,
        sessionId: s.id,
        title: s.title,
        snippet: 'Recent session',
        messageCount: s.messageCount,
        updatedAt: s.updatedAt,
        pinned: s.pinned,
      }));
    }

    const lower = debouncedQuery.toLowerCase();
    const matched: SearchResult[] = [];

    // Search session titles
    sessions.forEach(s => {
      if (!s.archived && s.title.toLowerCase().includes(lower)) {
        matched.push({
          type: 'session',
          id: s.id,
          sessionId: s.id,
          title: s.title,
          snippet: 'Session title match',
          messageCount: s.messageCount,
          updatedAt: s.updatedAt,
          pinned: s.pinned,
        });
      }
    });

    // Search across ALL messages
    Object.entries(messagesBySession).forEach(([sessionId, messages]) => {
      messages.forEach(m => {
        if (m.content.toLowerCase().includes(lower)) {
          const session = sessions.find(s => s.id === sessionId);
          const snippet = m.content.slice(0, 80).replace(/\n/g, ' ');
          matched.push({
            type: 'message',
            id: m.id,
            sessionId,
            title: session?.title || 'Unknown',
            snippet: `...${snippet}...`,
            messageCount: messages.length,
            updatedAt: m.timestamp,
            pinned: session?.pinned || false,
          });
        }
      });
    });

    return matched.slice(0, 20);
  }, [debouncedQuery, sessions, messagesBySession]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50" onClick={onClose}>
      <div className="w-full max-w-lg bg-[var(--bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
          <Search className="w-5 h-5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search sessions and messages..."
            className="flex-1 bg-transparent text-[var(--text)] text-sm outline-none placeholder:text-[var(--text-muted)]"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[var(--text-muted)] hover:text-[var(--text)]">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">
              {query ? 'No results found' : 'Start typing to search'}
            </div>
          ) : (
            results.map(result => (
              <button
                key={`${result.type}-${result.id}`}
                onClick={() => { onSelectSession(result.sessionId); onClose(); }}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-[var(--bg-tertiary)] transition-colors text-left"
              >
                <div className="mt-0.5">
                  {result.type === 'session' ? (
                    <MessageSquare className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <Search className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--text)] truncate">{result.title}</span>
                    {result.pinned && <Pin className="w-3 h-3 text-[var(--accent)]" />}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{result.snippet}</p>
                </div>
                {result.type === 'message' && (
                  <span className="text-[10px] text-[var(--text-muted)] mt-0.5">msg</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
