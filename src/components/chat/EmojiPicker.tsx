'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Search, Clock } from 'lucide-react';

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  /** Position the picker near the cursor/insert point */
  anchorRef?: React.RefObject<HTMLElement | null>;
}

const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'Smileys', emojis: ['😀','😂','🤣','😊','😍','🥰','😎','🤔','😤','😢','😭','🥺','😱','🤗','🤫','🫠','🥹','😈','👻','💀','🤖','👽','🎃'] },
  { name: 'Gestures', emojis: ['👍','👎','👌','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👏','🙌','🤝','🙏','💪','🦾','🫶','❤️','🔥','⚡','✨','💥','🎉','🎊'] },
  { name: 'Objects', emojis: ['💡','📌','🔑','🔒','🔓','📎','✏️','📝','📋','📁','📂','🗂️','📅','⏰','🔔','📱','💻','🖥️','⌨️','🖱️','💾','💿','📷','🎥','🎵','🎮','🏆','🎯','🛠️','🔧','🧰'] },
  { name: 'Nature', emojis: ['🌱','🌿','🍀','🌸','🌺','🌻','🌹','🌴','🌊','🔥','⭐','🌙','☀️','⛈️','🌈','❄️','🦋','🐝','🦊','🐻','🦁','🐯','🐸','🦖','🦕','🌍','🚀','🛸'] },
  { name: 'Food', emojis: ['🍎','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍒','🥭','🍍','🥥','🥑','🍆','🥕','🌽','🌶️','🥒','🥦','🧄','🧅','🍞','🧀','🥩','🍗','🍕','🌮','🍔','🍟','🍩','🎂','☕','🍷'] },
];

const RECENT_KEY = 'overlord-recent-emojis';
const MAX_RECENT = 20;

function getRecent(): string[] {
  try {
    const stored = localStorage.getItem(RECENT_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecent(emojis: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(emojis.slice(0, MAX_RECENT)));
  } catch { /* ignore */ }
}

export function EmojiPicker({ isOpen, onClose, onSelect }: EmojiPickerProps) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(0);
  const [recent, setRecent] = useState<string[]>(getRecent);
  const [tab, setTab] = useState<'recents' | 'grid'>('recents');
  const pickerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveCategory(0);
      setRecent(getRecent());
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const handleSelect = useCallback((emoji: string) => {
    onSelect(emoji);
    // Update recents
    const updated = [emoji, ...recent.filter((e) => e !== emoji)];
    setRecent(updated);
    saveRecent(updated);
    onClose();
  }, [onSelect, recent, onClose]);

  const filteredCategories = query
    ? EMOJI_CATEGORIES.map((cat) => ({
        ...cat,
        emojis: cat.emojis.filter((e) => e.includes(query)),
      })).filter((cat) => cat.emojis.length > 0)
    : EMOJI_CATEGORIES;

  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 z-50 w-80 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden"
      role="dialog"
      aria-label="Emoji picker"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)]">
        <div className="flex items-center gap-2 flex-1">
          <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search emoji..."
            className="flex-1 bg-transparent text-xs text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
            aria-label="Search emoji"
          />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          aria-label="Close emoji picker"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)]">
        <button
          onClick={() => setTab('recents')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors ${
            tab === 'recents'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          <Clock className="w-3 h-3" />
          Recent
        </button>
        <button
          onClick={() => setTab('grid')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-medium transition-colors ${
            tab === 'grid'
              ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
              : 'text-[var(--text-muted)] hover:text-[var(--text)]'
          }`}
        >
          All
        </button>
      </div>

      {/* Content */}
      <div className="max-h-52 overflow-y-auto p-2">
        {tab === 'recents' ? (
          recent.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {recent.map((emoji, i) => (
                <button
                  key={`${emoji}-${i}`}
                  onClick={() => handleSelect(emoji)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-tertiary)] transition-colors text-lg"
                  aria-label={`Select ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">
              No recent emoji. Start using some!
            </p>
          )
        ) : filteredCategories.length > 0 ? (
          filteredCategories.map((cat, catIdx) => (
            <div key={catIdx} className="mb-2">
              <p className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider px-1 mb-1">
                {cat.name}
              </p>
              <div className="flex flex-wrap gap-0.5">
                {cat.emojis.map((emoji, i) => (
                  <button
                    key={`${emoji}-${i}`}
                    onClick={() => handleSelect(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-[var(--bg-tertiary)] transition-colors text-lg"
                    aria-label={`Select ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            No emoji found for &ldquo;{query}&rdquo;
          </p>
        )}
      </div>
    </div>
  );
}
