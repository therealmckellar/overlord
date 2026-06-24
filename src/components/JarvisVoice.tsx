'use client';

import { useState, useCallback } from 'react';
import { useJarvis } from '@/hooks/useJarvis';
import { useUIStore } from '@/stores';

const SUGGESTED_COMMANDS = [
  { label: 'Create agent', command: 'create new agent' },
  { label: 'Check status', command: 'what is the status' },
  { label: 'New chat', command: 'open new chat' },
  { label: 'Show dashboard', command: 'show dashboard' },
  { label: 'Export session', command: 'export session' },
];

export function JarvisVoice() {
  const [expanded, setExpanded] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const handleCommand = useCallback((command: string) => {
    const lower = command.toLowerCase();

    if (lower.includes('create') && lower.includes('agent')) {
      addToast({ type: 'info', message: 'Spawn agent dialog opened', duration: 2000 });
    } else if (lower.includes('status')) {
      addToast({ type: 'info', message: 'All systems operational — 4 agents active', duration: 3000 });
    } else if (lower.includes('chat')) {
      addToast({ type: 'info', message: 'Opening new chat', duration: 1500 });
    } else if (lower.includes('dashboard')) {
      addToast({ type: 'info', message: 'Showing dashboard', duration: 1500 });
    } else if (lower.includes('export')) {
      addToast({ type: 'success', message: 'Session exported', duration: 2000 });
    } else {
      addToast({ type: 'info', message: `Command: "${command}"`, duration: 2000 });
    }
  }, [addToast]);

  const { isListening, isSpeaking, isSupported, transcript, lastCommand, toggle, speak } = useJarvis(handleCommand);

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Expanded Panel */}
      {expanded && (
        <div className="w-80 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl overflow-hidden animate-slide-in-right">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--success)]'}`} />
              <span className="text-sm font-medium text-[var(--text)]">Jarvis</span>
            </div>
            <button
              onClick={() => setExpanded(false)}
              className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 1l12 12M13 1L1 13" />
              </svg>
            </button>
          </div>

          {/* Transcript */}
          <div className="p-4 min-h-[60px] max-h-[120px] overflow-y-auto">
            {transcript ? (
              <p className="text-sm text-[var(--text)]">
                <span className="text-[var(--text-muted)]">You said: </span>
                {transcript}
              </p>
            ) : isListening ? (
              <p className="text-sm text-[var(--text-muted)] animate-pulse">Listening...</p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">Click the mic to speak</p>
            )}
            {lastCommand && (
              <p className="text-xs text-[var(--accent)] mt-2">Last: {lastCommand}</p>
            )}
          </div>

          {/* Voice Visualizer */}
          {isListening && (
            <div className="px-4 pb-2 flex items-center justify-center gap-1 h-8">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-[var(--accent)] rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 24 + 8}px`,
                    animationDelay: `${i * 80}ms`,
                    animationDuration: '400ms',
                  }}
                />
              ))}
            </div>
          )}

          {/* Suggested Commands */}
          <div className="px-4 pb-4">
            <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Try saying...</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => {
                    speak(`Running: ${cmd.label}`);
                    handleCommand(cmd.command);
                  }}
                  className="px-2.5 py-1 rounded-full text-xs border border-[var(--border)] bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent)]/30 hover:text-[var(--text)] transition-colors"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Mic Button */}
      <button
        onClick={() => {
          toggle();
          if (!expanded) setExpanded(true);
        }}
        className={`
          w-14 h-14 rounded-full flex items-center justify-center
          transition-all duration-300 shadow-lg
          ${isListening
            ? 'bg-red-500 hover:bg-red-600 scale-110'
            : isSpeaking
              ? 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] animate-pulse'
              : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] hover:scale-105'
          }
        `}
        title={isListening ? 'Listening... (click to stop)' : 'Jarvis — click to speak'}
      >
        {isListening ? (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
            <rect x="3" y="1" width="10" height="14" rx="5" />
            <path d="M8 13v2M5 15h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ) : isSpeaking ? (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 6v4M5 4v8M8 2v12M11 5v6M14 7v2" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 16 16" fill="white">
            <rect x="3" y="1" width="10" height="14" rx="5" />
            <path d="M8 13v2M5 15h6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {/* Status indicator */}
      {isListening && (
        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border-2 border-[var(--bg)] animate-ping" />
      )}
    </div>
  );
}
