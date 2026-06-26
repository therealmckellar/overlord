'use client';

import React, { useState } from 'react';
import { useSharedMemoryStore, MemoryEntry } from '@/stores/sharedMemoryStore';

const TYPE_COLORS: Record<MemoryEntry['type'], string> = {
  insight: '#8b5cf6',
  fact: '#3b82f6',
  todo: '#f59e0b',
  decision: '#10b981',
  context: '#64748b',
};

export default function MemoryPanel() {
  const memory = useSharedMemoryStore((s) => s.memory);
  const addMemory = useSharedMemoryStore((s) => s.addMemory);
  const searchMemory = useSharedMemoryStore((s) => s.searchMemory);
  const deleteMemory = useSharedMemoryStore((s) => s.deleteMemory);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newType, setNewType] = useState<MemoryEntry['type']>('fact');
  const [newTags, setNewTags] = useState('');
  const [filterType, setFilterType] = useState<MemoryEntry['type'] | 'all'>('all');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filtered = searchQuery
    ? searchMemory(searchQuery)
    : memory;

  const finalFiltered = filterType === 'all' ? filtered : filtered.filter((m) => m.type === filterType);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addMemory({
      content: newContent,
      source: newSource || 'Rich',
      type: newType,
      tags: newTags.split(',').map((t) => t.trim()).filter(Boolean),
    });
    setNewContent('');
    setNewSource('');
    setNewTags('');
    setShowAdd(false);
  };

  // Get all unique tags
  const allTags = [...new Set(memory.flatMap((m) => m.tags))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
            🧠 Shared Memory
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {memory.length} entries · Cross-agent knowledge base
          </p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Add Memory
        </button>
      </div>

      {/* Search & Filters */}
      <div style={{
        padding: '12px 20px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <input
          value={searchQuery}
          onChange={handleSearch}
          placeholder="Search memory..."
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #334155',
            background: '#0f172a',
            color: '#f1f5f9',
            fontSize: '13px',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {(['all', 'insight', 'fact', 'todo', 'decision', 'context'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: filterType === type ? 'none' : '1px solid #334155',
                background: filterType === type ? '#1e293b' : 'transparent',
                color: filterType === type ? '#f1f5f9' : '#64748b',
                fontSize: '10px',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {type}
            </button>
          ))}
        </div>
        {allTags.length > 0 && (
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {allTags.slice(0, 10).map((tag) => (
              <span
                key={tag}
                onClick={() => setSearchQuery(tag)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: '#1e293b',
                  color: '#94a3b8',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Form */}
      {showAdd && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as MemoryEntry['type'])}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
            >
              <option value="fact">Fact</option>
              <option value="insight">Insight</option>
              <option value="decision">Decision</option>
              <option value="todo">Todo</option>
              <option value="context">Context</option>
            </select>
            <input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="Source (agent name)"
              style={{
                flex: 1,
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Memory content..."
            rows={2}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '13px',
              marginBottom: '8px',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <input
            value={newTags}
            onChange={(e) => setNewTags(e.target.value)}
            placeholder="Tags (comma-separated)"
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '4px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '12px',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowAdd(false)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: 'none',
                background: '#8b5cf6',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Memory
            </button>
          </div>
        </div>
      )}

      {/* Memory Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {finalFiltered.map((entry) => (
          <div
            key={entry.id}
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: '#0f172a',
              borderLeft: `3px solid ${TYPE_COLORS[entry.type]}`,
              marginBottom: '6px',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '4px',
            }}>
              <span style={{
                fontSize: '10px',
                fontWeight: 600,
                color: TYPE_COLORS[entry.type],
                background: `${TYPE_COLORS[entry.type]}15`,
                padding: '2px 6px',
                borderRadius: '3px',
                textTransform: 'uppercase',
              }}>
                {entry.type}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#8b5cf6',
                background: '#8b5cf615',
                padding: '2px 6px',
                borderRadius: '3px',
              }}>
                {entry.source}
              </span>
              <span style={{ fontSize: '10px', color: '#475569', marginLeft: 'auto' }}>
                {new Date(entry.timestamp).toLocaleDateString()}
              </span>
              <button
                onClick={() => deleteMemory(entry.id)}
                style={{
                  padding: '2px 6px',
                  borderRadius: '3px',
                  border: 'none',
                  background: 'transparent',
                  color: '#64748b',
                  fontSize: '10px',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5', marginBottom: '4px' }}>
              {entry.content}
            </div>
            {entry.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {entry.tags.map((tag) => (
                  <span key={tag} style={{
                    fontSize: '9px',
                    color: '#64748b',
                    background: '#1e293b',
                    padding: '1px 5px',
                    borderRadius: '2px',
                  }}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {finalFiltered.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: '13px',
            padding: '40px 0',
          }}>
            {searchQuery ? 'No matching memories found' : 'No memory entries yet'}
          </div>
        )}
      </div>
    </div>
  );
}
