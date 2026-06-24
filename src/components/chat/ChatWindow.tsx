import React, { useRef, useEffect } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import { ScrollControls } from './ScrollControls';
import { MessageListSkeleton } from '../skeletons/Skeleton';

const EMPTY_MESSAGES: never[] = [];

interface ChatWindowProps {
  sessionId: string;
  isLoading?: boolean;
}

export function ChatWindow({ sessionId, isLoading }: ChatWindowProps) {
  const messages = useMessageStore((s) => s.messagesBySession[sessionId] ?? EMPTY_MESSAGES);
  const streamingContent = useMessageStore((s) => s.streamingContent);
  const isStreaming = useMessageStore((s) => s.isStreaming);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const reasoningEffort = useUIStore((s) => s.reasoningEffort);
  const activePersona = useUIStore((s) => s.activePersona);
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
                  sender: { id: 'assistant', name: 'Assistant', role: 'assistant' as const },
                  timestamp: Date.now(),
                  isStreaming: true,
                }}
                showStatus={false}
              />
            )}
            {/* Typing indicator — shown when streaming but no content yet */}
            {isStreaming && !streamingContent && (
              <TypingIndicator agentName={activePersona.charAt(0).toUpperCase() + activePersona.slice(1)} persona={activePersona} />
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
        Overlord
      </h2>
      <p className="text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto">
        Ask anything. Your agents are ready.
      </p>
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
