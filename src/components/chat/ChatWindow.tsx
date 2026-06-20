'use client';

import React, { useRef, useEffect } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { ChatMessage } from './ChatMessage';
import { ScrollControls } from './ScrollControls';
import { MessageListSkeleton } from '../skeletons/Skeleton';

interface ChatWindowProps {
  sessionId: string;
  isLoading?: boolean;
}

export function ChatWindow({ sessionId, isLoading }: ChatWindowProps) {
  const messages = useMessageStore((s) => s.messagesBySession[sessionId] || []);
  const streamingContent = useMessageStore((s) => s.streamingContent);
  const isStreaming = useMessageStore((s) => s.isStreaming);
  const { selectedModel, reasoningEffort } = useUIStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, streamingContent]);

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-3xl mx-auto space-y-4">
          <MessageListSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages.length === 0 && !streamingContent ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                showStatus={msg.sender.role === 'assistant'}
                model={selectedModel}
                reasoningEffort={reasoningEffort}
              />
            ))}
            {/* Streaming message */}
            {isStreaming && streamingContent && (
              <ChatMessage
                message={{
                  id: 'streaming',
                  sessionId,
                  content: streamingContent,
                  sender: { id: 'assistant', name: 'Assistant', role: 'assistant' },
                  timestamp: Date.now(),
                  isStreaming: true,
                }}
                showStatus={false}
              />
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>
      <ScrollControls containerRef={scrollRef} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
        <span className="text-3xl">⚡</span>
      </div>
      <h2 className="text-2xl font-bold text-[var(--text)]">
        Phase 2 — Core UX
      </h2>
      <p className="text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
        Thinking blocks, tool cards, markdown rendering, KaTeX math, toast notifications, skeletons, and more — all wired in.
      </p>

      <div className="grid grid-cols-2 gap-3 text-xs pt-4 max-w-lg mx-auto">
        <FeatureCard emoji="🧠" title="Thinking Blocks" desc="Collapsible reasoning sections" />
        <FeatureCard emoji="🔧" title="Tool Cards" desc="Expandable tool call activity" />
        <FeatureCard emoji="📊" title="Status Cards" desc="Tokens, model, elapsed time" />
        <FeatureCard emoji="📋" title="Copy & Clipboard" desc="One-click copy on all messages" />
        <FeatureCard emoji="🔢" title="KaTeX Math" desc="$...$ and $$...$$ rendering" />
        <FeatureCard emoji="📐" title="GFM Tables" desc="Styled responsive tables" />
        <FeatureCard emoji="🔔" title="Toast Queue" desc="Zustand-driven notifications" />
        <FeatureCard emoji="💀" title="Skeletons" desc="Loading placeholders everywhere" />
      </div>
    </div>
  );
}

function FeatureCard({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-left">
      <div className="font-bold text-sm mb-1">{emoji} {title}</div>
      <div className="text-[var(--text-muted)]">{desc}</div>
    </div>
  );
}
