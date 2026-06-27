'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useUIStore } from '@/stores/uiStore';
import { useChatStream } from '@/hooks/useChatStream';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import { PERSONAS, type PersonaSlug } from '@/lib/personas';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ScrollControls } from './ScrollControls';
import { ChatComposer } from './ChatComposer';
import { useSpaceStore } from '@/stores/spaceStore';
import {
  ChevronDown,
  Square,
  RotateCcw,
  Cpu,
  UserCircle,
  X,
} from 'lucide-react';

export const ChatWindow = () => {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeSession = activeSessionId || 'default';

  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const activePersona = useUIStore((s) => s.activePersona);
  const setActivePersona = useUIStore((s) => s.setActivePersona);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const isStreaming = useMessageStore((s) => s.isStreaming);
  const streamingContent = useMessageStore((s) => s.streamingContent);

  const currentPersona = PERSONAS[activePersona as PersonaSlug] || PERSONAS.david;

  // Get active space instructions for chat context (select primitive to avoid render loop)
  const spaceInstructions = useSpaceStore((s) => {
    const spaceId = s.activeSpaceId;
    const space = spaceId ? s.spaces.find(sp => sp.id === spaceId) : null;
    return space?.customInstructions || undefined;
  });

  const { sendMessage, cancelStream, reconnect } = useChatStream({
    sessionId: activeSession,
    persona: currentPersona.slug,
    model: selectedModel,
    systemPrompt: spaceInstructions,
  });

  // FIX: Do NOT use || [] in the selector — it creates a new array ref on every render
  // causing an infinite re-render loop. Handle undefined in JSX instead.
  const messages = useMessageStore((s) => s.messagesBySession[activeSession]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent]);

  const handleSend = useCallback((text: string) => {
    if (!text.trim()) return;
    setLastError(null);
    sendMessage(text);
  }, [sendMessage]);

  // Listen for voice input from VoiceControls (Web Speech API)
  useEffect(() => {
    const handleVoiceInput = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.text) {
        handleSend(detail.text);
      }
    };
    window.addEventListener('overlord-voice-input', handleVoiceInput);
    return () => window.removeEventListener('overlord-voice-input', handleVoiceInput);
  }, [handleSend]);

  const handleStop = useCallback(() => {
    cancelStream();
  }, [cancelStream]);

  const handleRetry = useCallback(() => {
    setLastError(null);
    reconnect();
  }, [reconnect]);

  const currentModelLabel = UNIQUE_MODELS.find((m) => m.value === selectedModel)?.label || 'Select Model';

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header bar with controls */}
      <div className="px-4 py-2.5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)] gap-2">
        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          <div className={`w-2 h-2 rounded-full ${
            connectionStatus === 'connected' ? 'bg-[var(--success)]' :
            connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' :
            'bg-[var(--error)]'
          }`} />
          <span className="text-xs text-[var(--text-muted)]">Chat</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Persona Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowPersonaDropdown(!showPersonaDropdown); setShowModelDropdown(false); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg)] border border-[var(--border)] transition-colors text-xs"
            >
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: currentPersona.color }} />
              <span className="text-[var(--text-secondary)] max-w-[80px] truncate">{currentPersona.name}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
            {showPersonaDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowPersonaDropdown(false)} />
                <div className="absolute right-0 mt-1 w-44 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xl z-20 py-1">
                  {Object.values(PERSONAS).map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => { setActivePersona(p.slug); setShowPersonaDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        activePersona === p.slug ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="flex-1 text-left">{p.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Model Selector */}
          <div className="relative">
            <button
              onClick={() => { setShowModelDropdown(!showModelDropdown); setShowPersonaDropdown(false); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-tertiary)] hover:bg-[var(--bg)] border border-[var(--border)] transition-colors text-xs"
            >
              <Cpu className="w-3 h-3 text-[var(--text-muted)]" />
              <span className="text-[var(--text-secondary)] max-w-[100px] truncate">{currentModelLabel}</span>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
            </button>
            {showModelDropdown && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowModelDropdown(false)} />
                <div className="absolute right-0 mt-1 w-60 max-h-64 overflow-y-auto rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] shadow-xl z-20 py-1">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
                    Model Graph
                  </div>
                  {UNIQUE_MODELS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => { setSelectedModel(m.value); setShowModelDropdown(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors ${
                        selectedModel === m.value ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <span className="flex-1 text-left truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Stop / Retry buttons */}
          {isStreaming ? (
            <button
              onClick={handleStop}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-xs"
              title="Stop generating"
            >
              <Square className="w-3 h-3" />
              <span>Stop</span>
            </button>
          ) : lastError ? (
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--warning)]/20 text-[var(--warning)] hover:bg-[var(--warning)]/30 transition-colors text-xs"
              title="Retry last message"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          ) : null}
        </div>

        <ScrollControls containerRef={scrollRef} />
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {!messages && !isStreaming && (
          <div className="h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <UserCircle className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <div className="text-center">
              <p className="text-sm text-[var(--text-secondary)]">Start a conversation</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Using {currentModelLabel} as {currentPersona.name}</p>
            </div>
          </div>
        )}

        {messages?.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Streaming content preview */}
        {isStreaming && streamingContent && (
          <div className="group flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-tertiary)]">
              <svg className="w-4 h-4 text-[var(--text-secondary)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1 max-w-[85%]">
              <div className="rounded-xl px-4 py-3 bg-[var(--bg-secondary)] border border-[var(--border)]">
                <div className="text-sm text-[var(--text)] whitespace-pre-wrap">{streamingContent}</div>
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator (before first chunk) */}
        {isStreaming && !streamingContent && <TypingIndicator />}
      </div>

      {/* Error bar */}
      {lastError && !isStreaming && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20 flex items-center justify-between">
          <span className="text-xs text-red-400">{lastError}</span>
          <button onClick={() => setLastError(null)} className="text-red-400 hover:text-red-300">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Composer */}
      <ChatComposer onSend={handleSend} />
    </div>
  );
};
