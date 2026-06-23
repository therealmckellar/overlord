'use client';

import React, { useState, useRef } from 'react';
import { CommandPalette } from '@/components/CommandPalette';
import { useUIStore } from '@/stores/uiStore';

export function ChatComposer() {
  const [text, setText] = useState('');
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setText(value);

    // Trigger command palette if user types / at the end of the current word/cursor position
    // Simplified: trigger if the last character typed is /
    if (value.endsWith('/')) {
      toggleCommandPalette();
    }
  };

  const handleCommandSelect = (command: string) => {
    // Replace the trailing '/' with the selected command
    const newText = text.endsWith('/') ? text.slice(0, -1) + command + ' ' : text + command + ' ';
    setText(newText);
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-3xl mx-auto p-4">
      <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] focus-within:border-[var(--accent)] transition-colors shadow-sm">
        <textarea
          ref={inputRef}
          value={text}
          onChange={handleInputChange}
          placeholder="Type a message or '/' for commands..."
          className="flex-1 bg-transparent border-none outline-none resize-none p-2 max-h-40 min-h-[44px] text-sm text-[var(--text)] placeholder:text-[var(--text-muted)]"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              console.log('Sending message:', text);
              setText('');
            }
          }}
        />
        <button 
          className="p-2 rounded-xl bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          disabled={!text.trim()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <CommandPalette onSelect={handleCommandSelect} />
    </div>
  );
}
