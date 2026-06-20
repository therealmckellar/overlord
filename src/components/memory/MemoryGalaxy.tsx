'use client';

import React, { useState } from 'react';
import { useMemoryStore, type Memory } from '@/stores/memoryStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Brain, Search, Plus, Trash2, Pin, Tag, Filter,
  X, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';

interface MemoryGalaxyProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MemoryGalaxy({ isOpen, onClose }: MemoryGalaxyProps) {
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('steve');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const {
    searchQuery, setSearchQuery,
    filterTag, setFilterTag,
    filterSource, setFilterSource,
    getAllTags, getAllSources,
    getFilteredMemories,
    addMemory, deleteMemory, updateMemory,
  } = useMemoryStore();

  const { addToast } = useUIStore();

  const filtered = getFilteredMemories();
  const allTags = getAllTags();
  const allSources = getAllSources();

  const handleAdd = () => {
    if (!content.trim()) return;
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    addMemory({ content: content.trim(), tags: tagList, source, pinned: false });
    setContent('');
    setTags('');
    setShowForm(false);
    addToast({ type: 'success', message: 'Memory saved to galaxy' });
  };

  const togglePin = (mem: Memory) => {
    updateMemory(mem.id, { pinned: !mem.pinned });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg)]">
      {/* Sidebar — filters */}
      <div className="w-64 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[var(--accent)]" />
            Memory Galaxy
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] border-b border-[var(--border)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </span>
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFilters && (
          <div className="p-3 border-b border-[var(--border)] space-y-3">
            {/* Tag filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">Tag</label>
              <select
                value={filterTag || ''}
                onChange={(e) => setFilterTag(e.target.value || null)}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            {/* Source filter */}
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">Source</label>
              <select
                value={filterSource || ''}
                onChange={(e) => setFilterSource(e.target.value || null)}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="">All sources</option>
                {allSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {(filterTag || filterSource) && (
              <button
                onClick={() => { setFilterTag(null); setFilterSource(null); }}
                className="text-[10px] text-[var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto px-4 py-3 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
          {filtered.length} memory{filtered.length !== 1 ? 'ies' : ''} · {allTags.length} tags · {allSources.length} sources
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--text)]">
            {searchQuery ? `Results for "${searchQuery}"` : 'All Memories'}
          </h3>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Memory
          </button>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should the agents remember?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="flex-1 px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="steve">Steve</option>
                <option value="david">David</option>
                <option value="josh">Josh</option>
                <option value="fathom">Fathom</option>
                <option value="system">System</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={!content.trim()}
                className="px-4 py-1.5 text-xs rounded bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Memory list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-20 mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                {searchQuery ? 'No memories match your search' : 'No memories yet. Add one to start building the knowledge base.'}
              </p>
            </div>
          ) : (
            filtered.map((mem) => (
              <MemoryCard
                key={mem.id}
                memory={mem}
                expanded={expandedId === mem.id}
                onToggle={() => setExpandedId(expandedId === mem.id ? null : mem.id)}
                onPin={() => togglePin(mem)}
                onDelete={() => { deleteMemory(mem.id); addToast({ type: 'info', message: 'Memory deleted' }); }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function MemoryCard({
  memory,
  expanded,
  onToggle,
  onPin,
  onDelete,
}: {
  memory: Memory;
  expanded: boolean;
  onToggle: () => void;
  onPin: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={`rounded-lg border ${memory.pinned ? 'border-[var(--accent)]' : 'border-[var(--border)]'} bg-[var(--bg-secondary)] overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <Brain className={`w-4 h-4 mt-0.5 flex-shrink-0 ${memory.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-[var(--text)] ${expanded ? '' : 'line-clamp-2'}`}>
            {memory.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              {memory.source}
            </span>
            {memory.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {tag}
              </span>
            ))}
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">
              {new Date(memory.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>
      {expanded && (
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button
            onClick={onPin}
            className={`p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors ${memory.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
            title={memory.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
