'use client';

import React, { useState, useMemo } from 'react';
import { useSharedMemoryStore, type MemoryEntry, type JournalEntry } from '@/stores/sharedMemoryStore';

const TYPE_COLORS: Record<string, string> = {
  insight: '#8b5cf6',
  fact: '#3b82f6',
  todo: '#f59e0b',
  decision: '#10b981',
  context: '#6b7280',
};

const JOURNAL_COLORS: Record<string, string> = {
  built: '#10b981',
  blocked: '#ef4444',
  learned: '#3b82f6',
  decided: '#f59e0b',
};

export default function InsightsPanel() {
  const memory = useSharedMemoryStore((s) => s.memory);
  const journal = useSharedMemoryStore((s) => s.journal);
  const [activeTab, setActiveTab] = useState<'tags' | 'themes' | 'timeline'>('tags');

  // Tag frequency analysis
  const tagFrequencies = useMemo(() => {
    const counts: Record<string, number> = {};
    memory.forEach((m) => m.tags.forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15);
  }, [memory]);

  const maxTagCount = tagFrequencies.length > 0 ? tagFrequencies[0][1] : 1;

  // Journal type clustering
  const journalClusters = useMemo(() => {
    const counts: Record<string, number> = {};
    const byType: Record<string, JournalEntry[]> = {};
    journal.forEach((j) => {
      counts[j.type] = (counts[j.type] || 0) + 1;
      if (!byType[j.type]) byType[j.type] = [];
      byType[j.type].push(j);
    });
    return { counts, byType };
  }, [journal]);

  // Merged timeline (memory + journal, sorted by recency)
  const timeline = useMemo(() => {
    const items: Array<{ id: string; content: string; timestamp: number; source: string; type: string; color: string }> = [];
    memory.forEach((m) => items.push({ id: m.id, content: m.content, timestamp: m.timestamp, source: m.source, type: m.type, color: TYPE_COLORS[m.type] || '#6b7280' }));
    journal.forEach((j) => items.push({ id: j.id, content: j.content, timestamp: j.timestamp, source: j.agentName || 'System', type: j.type, color: JOURNAL_COLORS[j.type] || '#6b7280' }));
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 30);
  }, [memory, journal]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const tabs = [
    { id: 'tags' as const, label: '🏷️ Top Tags', icon: '📊' },
    { id: 'themes' as const, label: '🔄 Themes', icon: '🧩' },
    { id: 'timeline' as const, label: '📋 Timeline', icon: '⏱️' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>💡 Insights</h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          Patterns across {memory.length} memories · {journal.length} journal entries
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1e293b', padding: '0 20px' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 16px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab.id ? '#f1f5f9' : '#64748b',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? 600 : 400,
              cursor: 'pointer',
              borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* TAGS TAB */}
        {activeTab === 'tags' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#64748b' }}>Most frequent tags across all memory entries</p>
            {tagFrequencies.map(([tag, count]) => (
              <div key={tag} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#e2e8f0', minWidth: '120px', textAlign: 'right' }}>{tag}</span>
                <div style={{ flex: 1, background: '#1e293b', borderRadius: '4px', height: '20px', overflow: 'hidden' }}>
                  <div style={{ width: String((count / maxTagCount) * 100) + '%', height: '100%', background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '4px', transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', minWidth: '24px' }}>{count}</span>
              </div>
            ))}
            {tagFrequencies.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No tags found</p>
            )}
          </div>
        )}

        {/* THEMES TAB */}
        {activeTab === 'themes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Journal type clusters */}
            <div>
              <p style={{ margin: '0 0 10px', fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Journal Themes</p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                {Object.entries(journalClusters.counts).map(([type, count]) => (
                  <div key={type} style={{ background: JOURNAL_COLORS[type] + '15', border: `1px solid ${JOURNAL_COLORS[type]}44`, borderRadius: '8px', padding: '12px 16px', minWidth: '140px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 700, color: JOURNAL_COLORS[type] }}>{count}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'capitalize', marginTop: '2px' }}>{type}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent entries by type */}
            {Object.entries(journalClusters.byType).map(([type, entries]) => (
              <div key={type}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: JOURNAL_COLORS[type] }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{type}</span>
                </div>
                <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {entries.slice(0, 3).map((entry) => (
                    <p key={entry.id} style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
                      {entry.content}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {timeline.map((item, i) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', padding: '10px 0', position: 'relative' }}>
                {/* Timeline line */}
                {i < timeline.length - 1 && (
                  <div style={{ position: 'absolute', left: '7px', top: '28px', bottom: '-10px', width: '1px', background: '#1e293b' }} />
                )}
                {/* Dot */}
                <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: item.color + '33', border: `2px solid ${item.color}`, flexShrink: 0, marginTop: '2px' }} />
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 600, color: item.color, textTransform: 'uppercase' }}>{item.type}</span>
                    <span style={{ fontSize: '10px', color: '#64748b', flexShrink: 0 }}>{formatTime(item.timestamp)}</span>
                  </div>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.content}
                  </p>
                  <span style={{ fontSize: '10px', color: '#475569' }}>via {item.source}</span>
                </div>
              </div>
            ))}
            {timeline.length === 0 && (
              <p style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>No activity yet</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
