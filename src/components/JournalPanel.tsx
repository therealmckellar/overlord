'use client';

import React, { useState } from 'react';
import { useSharedMemoryStore, JournalEntry } from '@/stores/sharedMemoryStore';
import { InlineModelSelector } from '@/components/ui/InlineModelSelector';

const TYPE_CONFIG: Record<JournalEntry['type'], { icon: string; color: string; label: string }> = {
  built: { icon: '🔨', color: '#10b981', label: 'Built' },
  blocked: { icon: '🚧', color: '#ef4444', label: 'Blocked' },
  learned: { icon: '💡', color: '#f59e0b', label: 'Learned' },
  decided: { icon: '⚖️', color: '#8b5cf6', label: 'Decided' },
};

export default function JournalPanel() {
  const journal = useSharedMemoryStore((s) => s.journal);
  const addJournal = useSharedMemoryStore((s) => s.addJournal);
  const updateJournal = useSharedMemoryStore((s) => s.updateJournal);
  const deleteJournal = useSharedMemoryStore((s) => s.deleteJournal);
  const getRecentJournal = useSharedMemoryStore((s) => s.getRecentJournal);

  const [showNew, setShowNew] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newType, setNewType] = useState<JournalEntry['type']>('built');
  const [newAgent, setNewAgent] = useState('');
  const [filterType, setFilterType] = useState<JournalEntry['type'] | 'all'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<JournalEntry['type']>('built');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const recentEntries = getRecentJournal(7);
  const filtered = filterType === 'all' ? recentEntries : recentEntries.filter((j) => j.type === filterType);

  const handleAdd = () => {
    if (!newContent.trim()) return;
    addJournal({
      date: today,
      content: newContent,
      type: newType,
      agentName: newAgent || null,
    });
    setNewContent('');
    setNewAgent('');
    setShowNew(false);
  };

  const startEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditType(entry.type);
  };

  const saveEdit = () => {
    if (editingId) {
      updateJournal(editingId, { content: editContent, type: editType });
      setEditingId(null);
    }
  };

  // Group by date
  const grouped: Record<string, JournalEntry[]> = {};
  filtered.forEach((entry) => {
    if (!grouped[entry.date]) grouped[entry.date] = [];
    grouped[entry.date].push(entry);
  });

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
            📓 Daily Journal
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {journal.length} entries · Click to expand · Double-click to edit
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
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
          + Add Entry
        </button>
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: '4px',
        padding: '10px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        {(['all', 'built', 'blocked', 'learned', 'decided'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              border: filterType === type ? 'none' : '1px solid #334155',
              background: filterType === type ? '#1e293b' : 'transparent',
              color: filterType === type ? '#f1f5f9' : '#64748b',
              fontSize: '11px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {type === 'all' ? 'All' : `${TYPE_CONFIG[type].icon} ${TYPE_CONFIG[type].label}`}
          </button>
        ))}
      </div>

      {/* New Entry Form */}
      {showNew && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as JournalEntry['type'])}
              style={{
                padding: '6px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
              }}
            >
              <option value="built">🔨 Built</option>
              <option value="blocked">🚧 Blocked</option>
              <option value="learned">💡 Learned</option>
              <option value="decided">⚖️ Decided</option>
            </select>
            <input
              value={newAgent}
              onChange={(e) => setNewAgent(e.target.value)}
              placeholder="Agent name (optional)"
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
            placeholder="What happened today?"
            rows={3}
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowNew(false)}
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
                background: '#10b981',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Save Entry
            </button>
            <InlineModelSelector compact />
          </div>
        </div>
      )}

      {/* Journal Entries */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {Object.entries(grouped).map(([date, entries]) => (
          <div key={date} style={{ marginBottom: '16px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              {date === today ? '📅 Today' : date}
            </div>
            {entries.map((entry) => {
              const isExpanded = expandedId === entry.id;
              const isEditing = editingId === entry.id;
              const isLong = entry.content.length > 120;

              return (
                <div
                  key={entry.id}
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '6px',
                    background: isExpanded ? '#0f172a' : '#0f172a',
                    borderLeft: `3px solid ${TYPE_CONFIG[entry.type].color}`,
                    marginBottom: '6px',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                    boxShadow: isExpanded ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px' }}>{TYPE_CONFIG[entry.type].icon}</span>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      color: TYPE_CONFIG[entry.type].color,
                      background: `${TYPE_CONFIG[entry.type].color}15`,
                      padding: '2px 6px',
                      borderRadius: '3px',
                    }}>
                      {TYPE_CONFIG[entry.type].label}
                    </span>
                    {entry.agentName && (
                      <span style={{
                        fontSize: '10px',
                        color: '#8b5cf6',
                        background: '#8b5cf615',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}>
                        {entry.agentName}
                      </span>
                    )}
                    <span style={{ fontSize: '10px', color: '#475569', marginLeft: 'auto' }}>
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {isEditing ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '6px' }}>
                        <select
                          value={editType}
                          onChange={(e) => setEditType(e.target.value as JournalEntry['type'])}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #334155',
                            background: '#1e293b',
                            color: '#f1f5f9',
                            fontSize: '11px',
                          }}
                        >
                          <option value="built">🔨 Built</option>
                          <option value="blocked">🚧 Blocked</option>
                          <option value="learned">💡 Learned</option>
                          <option value="decided">⚖️ Decided</option>
                        </select>
                      </div>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadius: '4px',
                          border: '1px solid #334155',
                          background: '#1e293b',
                          color: '#f1f5f9',
                          fontSize: '12px',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '4px' }}>
                        <button
                          onClick={saveEdit}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: 'none',
                            background: '#10b981',
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #334155',
                            background: 'transparent',
                            color: '#94a3b8',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: '1.5' }}>
                      {isLong && !isExpanded
                        ? `${entry.content.slice(0, 120)}...`
                        : entry.content
                      }
                    </div>
                  )}

                  {/* Expanded action bar */}
                  {isExpanded && !isEditing && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: 'flex',
                        gap: '6px',
                        marginTop: '8px',
                        paddingTop: '8px',
                        borderTop: '1px solid #1e293b',
                      }}
                    >
                      <button
                        onClick={() => startEdit(entry)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #3b82f6',
                          background: 'transparent',
                          color: '#3b82f6',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => { deleteJournal(entry.id); setExpandedId(null); }}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid #ef4444',
                          background: 'transparent',
                          color: '#ef4444',
                          fontSize: '10px',
                          cursor: 'pointer',
                        }}
                      >
                        🗑 Delete
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center',
            color: '#475569',
            fontSize: '13px',
            padding: '40px 0',
          }}>
            No journal entries yet. Click "+ Add Entry" to start.
          </div>
        )}
      </div>
    </div>
  );
}
