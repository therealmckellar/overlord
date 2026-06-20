'use client';

import React, { useState } from 'react';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { timeAgo, truncate } from '@/utils/helpers';
import { SessionContextMenu } from './SessionContextMenu';

// Inline SVG icons (replacing @heroicons/react)
function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  );
}

function MagnifyingGlassIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
    </svg>
  );
}

function PinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  );
}

function ArchiveBoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
    </svg>
  );
}

export const SessionSidebar: React.FC = () => {
  const { 
    sessions, 
    activeSessionId, 
    setActiveSession, 
    createSession,
    searchSessions,
    togglePinSession,
    archiveSession 
  } = useSessionStore();
  
  const { sidebarOpen } = useUIStore();
  const [searchQuery, setSearchQuery] = useState('');

  if (!sidebarOpen) return null;

  const filteredSessions = searchQuery 
    ? searchSessions(searchQuery) 
    : sessions.filter(s => !s.archived);

  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  return (
    <aside className="w-[var(--sidebar-width)] h-screen bg-[var(--bg-secondary)] border-r border-[var(--border)] flex flex-col transition-all duration-300 overflow-hidden">
      <div className="p-4 space-y-4">
        <button 
          onClick={() => createSession()}
          className="w-full py-2 px-4 bg-[var(--accent)] text-[var(--text)] rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-[var(--accent-hover)] transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          New Chat
        </button>

        <div className="relative">
          <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input 
            type="text" 
            placeholder="Search sessions..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-tertiary)] text-[var(--text)] border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {sortedSessions.map((session) => (
          <div 
            key={session.id}
            onClick={() => setActiveSession(session.id)}
            className={`group relative p-3 rounded-lg cursor-pointer transition-all duration-200 flex items-center gap-3 ${
              activeSessionId === session.id 
                ? 'bg-[var(--accent-muted)] text-[var(--text)]' 
                : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-medium truncate pr-4">{session.title}</h3>
                <span className="text-[10px] text-[var(--text-muted)] whitespace-nowrap">
                  {timeAgo(session.updatedAt)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {session.lastMessage?.content || 'No messages yet'}
                </p>
                {session.unreadCount > 0 && (
                  <span className="bg-[var(--accent)] text-[var(--text)] text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {session.unreadCount}
                  </span>
                )}
              </div>
            </div>
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  togglePinSession(session.id);
                }}
                className={`p-1 rounded hover:bg-[var(--bg-tertiary)] ${session.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
              >
                <PinIcon className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  archiveSession(session.id);
                }}
                className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
              >
                <ArchiveBoxIcon className="w-3.5 h-3.5" />
              </button>
              <SessionContextMenu sessionId={session.id} />
            </div>
          </div>
        ))}
        
        {sortedSessions.length === 0 && (
          <div className="text-center py-8 text-xs text-[var(--text-muted)] italic">
            No sessions found
          </div>
        )}
      </div>
    </aside>
  );
};
