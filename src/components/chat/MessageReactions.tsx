'use client';

import React, { useState } from 'react';
import { SmilePlus, Pin, PinOff } from 'lucide-react';
import { useMessageStore } from '@/stores/messageStore';
import { Tooltip } from '@/components/ui/Tooltip';

const QUICK_REACTIONS = ['👍', '👎', '❤️', '😂', '😮', '😢', '🔥', '👀'];

interface MessageReactionsProps {
  messageId: string;
  sessionId: string;
  reactions?: { emoji: string; userId: string; userName: string }[];
  isPinned?: boolean;
  showPin?: boolean;
}

export function MessageReactions({
  messageId,
  sessionId,
  reactions = [],
  isPinned = false,
  showPin = true,
}: MessageReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const toggleReaction = useMessageStore((s) => s.toggleReaction);
  const togglePin = useMessageStore((s) => s.togglePin);

  // Group reactions by emoji and count
  const grouped = reactions.reduce<Record<string, { count: number; users: string[]; hasSelf: boolean }>>(
    (acc, r) => {
      if (!acc[r.emoji]) acc[r.emoji] = { count: 0, users: [], hasSelf: false };
      acc[r.emoji].count++;
      acc[r.emoji].users.push(r.userName);
      // For now, assume current user is 'user' — in production this would come from auth
      if (r.userId === 'user') acc[r.emoji].hasSelf = true;
      return acc;
    },
    {},
  );

  const handleReaction = (emoji: string) => {
    toggleReaction(sessionId, messageId, emoji, 'user', 'You');
  };

  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
      {/* Existing reaction pills */}
      {Object.entries(grouped).map(([emoji, { count, hasSelf }]) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
            hasSelf
              ? 'bg-[var(--accent-muted)] border-[var(--accent)] text-[var(--accent)]'
              : 'bg-[var(--bg-tertiary)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
          }`}
        >
          <span>{emoji}</span>
          <span className="font-medium">{count}</span>
        </button>
      ))}

      {/* Add reaction button */}
      <div className="relative">
        <Tooltip content="Add reaction" position="top">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Add reaction"
          >
            <SmilePlus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>

        {/* Quick reaction picker */}
        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 z-50 flex items-center gap-0.5 p-1.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-lg">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  handleReaction(emoji);
                  setShowPicker(false);
                }}
                className="w-7 h-7 flex items-center justify-center rounded hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
                aria-label={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pin button */}
      {showPin && (
        <Tooltip content={isPinned ? 'Unpin message' : 'Pin message'} position="top">
          <button
            onClick={() => togglePin(sessionId, messageId)}
            className={`p-1 rounded-full transition-colors opacity-0 group-hover:opacity-100 ${
              isPinned
                ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
            }`}
            aria-label={isPinned ? 'Unpin message' : 'Pin message'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>
        </Tooltip>
      )}
    </div>
  );
}
