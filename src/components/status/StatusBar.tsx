'use client';

import React from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Zap, MessageSquare, Radio } from 'lucide-react';

interface StatusBarProps {
  sessionId?: string;
}

export function StatusBar({ sessionId }: StatusBarProps) {
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const isStreaming = useMessageStore((s) => s.isStreaming);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const activeSession = sessions.find((s) => s.id === activeSessionId);
  const messageCount = useMessageStore(
    (s) => (sessionId ? (s.messagesBySession[sessionId] || []).length : 0),
  );

  return (
    <div className="flex items-center justify-between px-4 py-1 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-[10px]">
      {/* Left: Connection + streaming */}
      <div className="flex items-center gap-3">
        {isStreaming ? (
          <div className="flex items-center gap-1.5 text-[var(--accent)]">
            <Zap className="w-3 h-3" style={{ animation: 'blink 0.8s infinite' }} />
            <span className="font-mono tracking-wide">STREAMING</span>
          </div>
        ) : (
          <div className={`flex items-center gap-1.5 ${
            connectionStatus === 'connected' ? 'text-[var(--success)]' :
            connectionStatus === 'reconnecting' ? 'text-[var(--warning)]' :
            'text-[var(--error)]'
          }`}>
            <span className={`status-dot ${
              connectionStatus === 'connected' ? 'online' :
              connectionStatus === 'reconnecting' ? 'warning' : 'error'
            }`} />
            <span className="font-mono tracking-wide capitalize">{connectionStatus}</span>
          </div>
        )}
      </div>

      {/* Center: Session */}
      {activeSession && (
        <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
          <Radio className="w-2.5 h-2.5" />
          <span className="font-medium truncate max-w-[160px]">{activeSession.title}</span>
        </div>
      )}

      {/* Right: Message count */}
      <div className="flex items-center gap-1.5 text-[var(--text-muted)]">
        <MessageSquare className="w-2.5 h-2.5" />
        <span className="font-mono">{messageCount} msgs</span>
      </div>
    </div>
  );
}
