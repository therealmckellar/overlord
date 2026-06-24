'use client';

import React, { useState } from 'react';
import {
  Newspaper, Calendar, Clock, Send, Settings,
  CheckCircle2, AlertCircle, Loader2, Eye, Edit3,
  BarChart3, Users, TrendingUp
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { PERSONAS } from '@/lib/personas';

type ContentFormat = 'blog' | 'social' | 'email' | 'ad' | 'press';

interface ContentPiece {
  id: string;
  title: string;
  format: ContentFormat;
  status: 'draft' | 'generating' | 'ready' | 'published';
  persona: string;
  createdAt: number;
  content: string;
}

const DEMO_CONTENT: ContentPiece[] = [
  {
    id: 'c1',
    title: 'Spring Promo Merch Ideas for Local Businesses',
    format: 'blog',
    status: 'published',
    persona: 'david',
    createdAt: Date.now() - 86400000 * 2,
    content: 'As the weather warms up, local businesses are looking for fresh promotional items to energize their brand...',
  },
  {
    id: 'c2',
    title: '5 Signs Your Business Needs Working Capital',
    format: 'email',
    status: 'ready',
    persona: 'josh',
    createdAt: Date.now() - 86400000,
    content: 'Cash flow gaps can hit even profitable businesses hard. Here are five warning signs that it\'s time to explore funding options...',
  },
  {
    id: 'c3',
    title: 'NJ Market Update: Q2 Investment Opportunities',
    format: 'social',
    status: 'generating',
    persona: 'fathom',
    createdAt: Date.now() + 86400000,
    content: 'The New Jersey real estate market continues to show strong fundamentals for investors in Q2 2026...',
  },
  {
    id: 'c4',
    title: 'How We Helped a Restaurant Chain Scale to 5 Locations',
    format: 'blog',
    status: 'draft',
    persona: 'steve',
    createdAt: Date.now() + 86400000 * 3,
    content: 'When a regional restaurant group came to us, they had 2 locations and a vision for 5...',
  },
];

interface ContentStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

const FORMAT_LABELS: Record<ContentFormat, string> = {
  blog: '📝 Blog Post',
  social: '📱 Social Post',
  email: '📧 Email',
  ad: '🎯 Ad Copy',
  press: '📰 Press Release',
};

export function ContentStudio({ isOpen, onClose }: ContentStudioProps) {
  const activePersona = useUIStore((s) => s.activePersona);
  const addToast = useUIStore((s) => s.addToast);
  const [content, setContent] = useState<ContentPiece[]>(DEMO_CONTENT);
  const [selected, setSelected] = useState<ContentPiece | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFormat, setNewFormat] = useState<ContentFormat>('blog');

  if (!isOpen) return null;

  const persona = PERSONAS[activePersona as keyof typeof PERSONAS] || PERSONAS.david;
  const filteredContent = content.filter((c) => c.persona === activePersona || c.persona === 'all');

  const stats = {
    total: filteredContent.length,
    ready: filteredContent.filter((c) => c.status === 'ready').length,
    generating: filteredContent.filter((c) => c.status === 'generating').length,
    drafts: filteredContent.filter((c) => c.status === 'draft').length,
  };

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    const piece: ContentPiece = {
      id: `c_${Date.now()}`,
      title: newTitle,
      format: newFormat,
      status: 'generating',
      persona: activePersona,
      createdAt: Date.now(),
      content: '',
    };
    setContent((prev) => [piece, ...prev]);
    setNewTitle('');
    setShowCreate(false);
    addToast({ type: 'info', message: `Generating ${FORMAT_LABELS[newFormat]} for ${persona.name}...`, duration: 3000 });
    // Simulate generation
    setTimeout(() => {
      setContent((prev) =>
        prev.map((c) => (c.id === piece.id ? { ...c, status: 'ready' as const, content: `Generated ${newFormat} content for ${persona.name}...` } : c))
      );
      addToast({ type: 'success', message: 'Content ready!', duration: 2000 });
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg)]">
      {/* Left panel */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <span className="text-base">✨</span>
            Content Studio
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)]">{persona.name}</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
          </button>
        </div>

        {/* Persona indicator */}
        <div className="px-4 py-2 border-b border-[var(--border)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: persona.color }} />
          <span className="text-[10px] text-[var(--text-muted)]">Generating as <span className="text-[var(--text)] font-medium">{persona.name}</span></span>
          <span className="text-[10px] text-[var(--text-muted)] ml-auto">{persona.slug}</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-[var(--border)]">
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.ready}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Ready</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--accent)]">{stats.generating}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Generating</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.drafts}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Drafts</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.total}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Total</div>
          </div>
        </div>

        {/* Create button */}
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="w-full py-2 text-xs font-medium rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            + New Content
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="p-3 border-b border-[var(--border)] space-y-2 bg-[var(--bg-tertiary)]">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Content title..."
              className="w-full px-2 py-1.5 text-xs rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
            />
            <select
              value={newFormat}
              onChange={(e) => setNewFormat(e.target.value as ContentFormat)}
              className="w-full px-2 py-1.5 text-xs rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
            >
              <option value="blog">📝 Blog Post</option>
              <option value="social">📱 Social Post</option>
              <option value="email">📧 Email</option>
              <option value="ad">🎯 Ad Copy</option>
              <option value="press">📰 Press Release</option>
            </select>
            <button
              onClick={handleCreate}
              className="w-full py-1.5 text-xs rounded bg-[var(--success)] text-white hover:opacity-90 transition-opacity"
            >
              Generate with {persona.name}
            </button>
          </div>
        )}

        {/* Content list */}
        <div className="flex-1 overflow-y-auto">
          {filteredContent.length === 0 ? (
            <div className="p-6 text-center text-[var(--text-muted)]">
              <p className="text-2xl mb-2">✨</p>
              <p className="text-xs">No content yet. Create something for {persona.name}!</p>
            </div>
          ) : (
            filteredContent.map((piece) => {
              const statusColors = {
                draft: 'bg-[var(--text-muted)]',
                generating: 'bg-[var(--warning)] animate-pulse',
                ready: 'bg-[var(--success)]',
                published: 'bg-[var(--accent)]',
              };
              return (
                <button
                  key={piece.id}
                  onClick={() => setSelected(piece)}
                  className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                    selected?.id === piece.id ? 'bg-[var(--bg-tertiary)]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusColors[piece.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[var(--text)] truncate">{piece.title}</div>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className="text-[var(--text-muted)]">{FORMAT_LABELS[piece.format]}</span>
                        <span className="text-[var(--text-muted)] capitalize">{piece.status}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        {selected ? (
          <ContentDetail piece={selected} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center space-y-3">
              <p className="text-4xl">✨</p>
              <p className="text-sm font-medium">Content Studio</p>
              <p className="text-xs">Select content from the left, or create new content as <span className="text-[var(--accent)]">{persona.name}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ContentDetail({ piece }: { piece: ContentPiece }) {
  const persona = PERSONAS[piece.persona as keyof typeof PERSONAS] || PERSONAS.david;
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text)]">{piece.title}</h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: persona.color }} />
            {persona.name}
          </span>
          <span>{FORMAT_LABELS[piece.format]}</span>
          <span className="capitalize">{piece.status}</span>
          <span>{new Date(piece.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
              {piece.content || 'Content will appear here once generated...'}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] flex items-center gap-2">
        {piece.status === 'draft' && (
          <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors">
            Generate
          </button>
        )}
        {piece.status === 'ready' && (
          <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--success)] text-white hover:opacity-90 transition-opacity">
            Publish
          </button>
        )}
        <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          Edit
        </button>
      </div>
    </div>
  );
}
