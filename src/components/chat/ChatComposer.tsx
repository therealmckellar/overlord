'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { Send, Paperclip, Smile } from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';

interface ChatComposerProps {
  onSend: (message: string) => void;
}

// Built-in slash commands for autocomplete
const SLASH_COMMANDS = [
  { value: '/help', description: 'Show available commands' },
  { value: '/clear', description: 'Clear current session' },
  { value: '/export', description: 'Export session as JSON' },
  { value: '/settings', description: 'Open settings panel' },
  { value: '/new', description: 'Start a new session' },
];

// Mock mentionable users
const MENTIONABLE_USERS = [
  { id: 'david', name: 'David', avatar: 'D' },
  { id: 'josh', name: 'Josh', avatar: 'J' },
  { id: 'steve', name: 'Steve', avatar: 'S' },
  { id: 'fathom', name: 'Fathom', avatar: 'F' },
];

export function ChatComposer({ onSend }: ChatComposerProps) {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);

  // Emoji picker
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  // Autocomplete state
  const [autocompleteType, setAutocompleteType] = useState<'none' | 'slash' | 'mention'>('none');
  const [autocompleteIndex, setAutocompleteIndex] = useState(0);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');

  const getWordAtCursor = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return { word: '', start: 0, end: 0 };
    const pos = textarea.selectionStart;
    const text = textarea.value;
    // Find start of current word
    let start = pos;
    while (start > 0 && text[start - 1] !== ' ' && text[start - 1] !== '\n') start--;
    return { word: text.slice(start, pos), start, end: pos };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    // Detect autocomplete triggers
    const { word } = getWordAtCursor();
    if (word.startsWith('/') && word.length >= 1) {
      setAutocompleteType('slash');
      setAutocompleteQuery(word.toLowerCase());
      setAutocompleteIndex(0);
    } else if (word.startsWith('@') && word.length >= 1) {
      setAutocompleteType('mention');
      setAutocompleteQuery(word.slice(1).toLowerCase());
      setAutocompleteIndex(0);
    } else {
      setAutocompleteType('none');
    }
  };

  const filteredSlashCommands = SLASH_COMMANDS.filter(
    (cmd) => cmd.value.includes(autocompleteQuery),
  );

  const filteredMentions = MENTIONABLE_USERS.filter(
    (u) => u.name.toLowerCase().includes(autocompleteQuery) || u.id.includes(autocompleteQuery),
  );

  const insertAutocomplete = useCallback((value: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { word, start } = getWordAtCursor();
    const before = input.slice(0, start);
    const after = input.slice(start + word.length);
    const newValue = before + value + ' ' + after;
    setInput(newValue);
    setAutocompleteType('none');
    // Restore cursor position after the inserted value
    setTimeout(() => {
      const newPos = start + value.length + 1;
      textarea.selectionStart = newPos;
      textarea.selectionEnd = newPos;
      textarea.focus();
    }, 0);
  }, [input, getWordAtCursor]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle autocomplete navigation
    if (autocompleteType !== 'none') {
      const items = autocompleteType === 'slash' ? filteredSlashCommands : filteredMentions;
      if (items.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setAutocompleteIndex((i) => (i + 1) % items.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          setAutocompleteIndex((i) => (i - 1 + items.length) % items.length);
          return;
        }
        if (e.key === 'Tab' || e.key === 'Enter') {
          e.preventDefault();
          if (autocompleteType === 'slash') {
            insertAutocomplete((items[autocompleteIndex] as typeof SLASH_COMMANDS[number]).value);
          } else {
            insertAutocomplete(`@${(items[autocompleteIndex] as typeof MENTIONABLE_USERS[number]).name}`);
          }
          return;
        }
        if (e.key === 'Escape') {
          setAutocompleteType('none');
          return;
        }
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput('');
    setAutocompleteType('none');
  }, [input, onSend]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const pos = textarea.selectionStart;
      const newValue = input.slice(0, pos) + emoji + input.slice(pos);
      setInput(newValue);
      setTimeout(() => {
        textarea.selectionStart = pos + emoji.length;
        textarea.selectionEnd = pos + emoji.length;
        textarea.focus();
      }, 0);
    }
  }, [input]);

  return (
    <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] p-3 relative">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        {/* Emoji button */}
        <div className="relative">
          <button
            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
            className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors"
            title="Emoji"
            aria-label="Open emoji picker"
          >
            <Smile className="w-4 h-4" />
          </button>
          <EmojiPicker
            isOpen={emojiPickerOpen}
            onClose={() => setEmojiPickerOpen(false)}
            onSelect={handleEmojiSelect}
          />
        </div>

        {/* Attachment button */}
        <button
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors"
          title="Attach file"
          aria-label="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Input area with autocomplete */}
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

          {/* Autocomplete dropdown */}
          {autocompleteType !== 'none' && (
            <div className="absolute bottom-full left-0 mb-1 w-full max-w-sm bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden z-50">
              {autocompleteType === 'slash' && filteredSlashCommands.length > 0 && (
                <div className="py-1">
                  <p className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    Commands
                  </p>
                  {filteredSlashCommands.map((cmd, i) => (
                    <button
                      key={cmd.value}
                      onClick={() => insertAutocomplete(cmd.value)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-xs transition-colors ${
                        i === autocompleteIndex
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <code className="font-mono font-bold">{cmd.value}</code>
                      <span className="text-[var(--text-muted)]">{cmd.description}</span>
                    </button>
                  ))}
                </div>
              )}
              {autocompleteType === 'mention' && filteredMentions.length > 0 && (
                <div className="py-1">
                  <p className="px-3 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                    People
                  </p>
                  {filteredMentions.map((user, i) => (
                    <button
                      key={user.id}
                      onClick={() => insertAutocomplete(`@${user.name}`)}
                      className={`w-full flex items-center gap-3 px-3 py-1.5 text-left text-xs transition-colors ${
                        i === autocompleteIndex
                          ? 'bg-[var(--accent)] text-white'
                          : 'text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
                      }`}
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--accent)] flex items-center justify-center text-[10px] font-bold text-white">
                        {user.avatar}
                      </div>
                      <span>{user.name}</span>
                    </button>
                  ))}
                </div>
              )}
              {((autocompleteType === 'slash' && filteredSlashCommands.length === 0) ||
                (autocompleteType === 'mention' && filteredMentions.length === 0)) && (
                <p className="px-3 py-2 text-xs text-[var(--text-muted)]">No matches found</p>
              )}
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white"
          title="Send (Enter)"
          aria-label="Send message"
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
        <span>@ to mention</span>
        <span>·</span>
        <span>Tab to autocomplete</span>
      </div>
    </div>
  );
}
