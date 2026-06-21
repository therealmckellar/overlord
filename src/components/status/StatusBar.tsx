'use client';

import React from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { Wifi, WifiOff, Loader2, MessageSquare, Zap } from 'lucide-react';

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

  const ConnectionIcon = connectionStatus === 'connected'
    ? Wifi
    : connectionStatus === 'reconnecting'
      ? Loader2
      : WifiOff;

  const connectionLabel =
    connectionStatus === 'connected'
      ? 'Connected'
      : connectionStatus === 'reconnecting'
        ? 'Reconnecting…'
        : 'Disconnected';

  const connectionColor =
    connectionStatus === 'connected'
      ? 'text-[var(--success)]'
      : connectionStatus === 'reconnecting'
        ? 'text-[var(--warning)]'
        : 'text-[var(--error)]';

  return (
    <div className="flex items-center justify-between px-4 py-1.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-[11px] text-[var(--text-muted)]">
      {/* Left: Connection status */}
      <div className="flex items-center gap-3">
        <div className={`flex items-center gap-1.5 ${connectionColor}`}>
          <ConnectionIcon className={`w-3.5 h-3.5 ${connectionStatus === 'reconnecting' ? 'animate-spin' : ''}`} />
          <span>{connectionLabel}</span>
        </div>

        {isStreaming && (
          <div className="flex items-center gap-1.5 text-[var(--accent)]">
            <Zap className="w-3.5 h-3.5 animate-pulse" />
            <span>Streaming</span>
          </div>
        )}
      </div>

      {/* Center: Session name */}
      {activeSession && (
        <div className="flex items-center gap-1.5 text-[var(--text-secondary)]">
          <span className="font-medium truncate max-w-[200px]">{activeSession.title}</span>
        </div>
      )}

      {/* Right: Message count */}
      <div className="flex items-center gap-1.5">
        <MessageSquare className="w-3.5 h-3.5" />
        <span>{messageCount} messages</span>
      </div>
    </div>
  );
}
