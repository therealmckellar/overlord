'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { COMMANDS } from '@/hooks/useCommandPalette';
import { Send, Paperclip } from 'lucide-react';

interface ChatComposerProps {
  onSend: (message: string) => void;
}

export function ChatComposer({ onSend }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { setCommandPaletteOpen } = useUIStore();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detect "/" at start of line to open command palette
    if (value === '/' || (value.startsWith('/') && !value.includes(' '))) {
      setCommandPaletteOpen(true);
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;

    // Check if it's a slash command
    if (trimmed.startsWith('/')) {
      let cmd: typeof COMMANDS[number] | undefined;
      for (const c of COMMANDS) {
        if (trimmed.startsWith(c.value)) { cmd = c; break; }
      }
      if (cmd) {
        onSend(trimmed);
        setInput('');
        return;
      }
    }

    onSend(trimmed);
    setInput('');
  }, [input, onSend, COMMANDS]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-3">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* Attachment button */}
        <button
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 transition-colors"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message or / for commands..."
            rows={1}
            className="w-full resize-none rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border)] px-4 py-2.5 text-sm text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            style={{ minHeight: '36px', maxHeight: '120px' }}
          />
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
          title="Send (Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Command hint */}
      <div className="max-w-3xl mx-auto mt-1.5 flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
        <span>Enter to send</span>
        <span>·</span>
        <span>Shift+Enter for new line</span>
        <span>·</span>
        <span>/ for commands</span>
        <span>·</span>
        <span>Cmd+K for palette</span>
      </div>
    </div>
  );
}
