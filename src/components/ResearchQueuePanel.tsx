'use client';

import React, { useState } from 'react';
import { useResearchStore, type ResearchStatus, type ResearchTask } from '@/stores/researchStore';

const STATUS_CONFIG: Record<ResearchStatus, { color: string; bg: string; icon: string; label: string }> = {
  queued: { color: '#6b7280', bg: '#6b728022', icon: '⏳', label: 'Queued' },
  researching: { color: '#3b82f6', bg: '#3b82f622', icon: '🔍', label: 'Researching' },
  complete: { color: '#10b981', bg: '#10b98122', icon: '✅', label: 'Complete' },
  failed: { color: '#ef4444', bg: '#ef444422', icon: '❌', label: 'Failed' },
};

const AGENTS = ['Researcher', 'Explorer', 'Builder', 'Hermes'];

export default function ResearchQueuePanel() {
  const queue = useResearchStore((s) => s.queue);
  const addTopic = useResearchStore((s) => s.addTopic);
  const updateStatus = useResearchStore((s) => s.updateStatus);
  const deleteTask = useResearchStore((s) => s.deleteTask);

  const [newTopic, setNewTopic] = useState('');
  const [newAgent, setNewAgent] = useState('Researcher');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [simulating, setSimulating] = useState<string | null>(null);

  const counts = {
    queued: queue.filter((t) => t.status === 'queued').length,
    researching: queue.filter((t) => t.status === 'researching').length,
    complete: queue.filter((t) => t.status === 'complete').length,
    failed: queue.filter((t) => t.status === 'failed').length,
  };

  const handleAdd = () => {
    if (!newTopic.trim()) return;
    addTopic(newTopic.trim(), 'agent-' + newAgent.toLowerCase());
    setNewTopic('');
  };

  const handleSimulate = (task: ResearchTask) => {
    if (task.status === 'queued') {
      setSimulating(task.id);
      updateStatus(task.id, 'researching');
      setTimeout(() => {
        updateStatus(task.id, 'complete', 'Research complete. Key findings compiled.', generateFakeResult(task.topic));
        setSimulating(null);
      }, 2000);
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b' }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>📊 Research Queue</h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          {queue.length} items · {counts.queued} queued · {counts.researching} active
        </p>
      </div>

      {/* Status summary */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px' }}>
        {Object.entries(counts).map(([status, count]) => {
          const cfg = STATUS_CONFIG[status as ResearchStatus];
          return (
            <div key={status} style={{ background: cfg.bg, border: '1px solid ' + cfg.color + '33', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px' }}>{cfg.icon}</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: cfg.color }}>{count}</span>
              <span style={{ fontSize: '10px', color: '#64748b' }}>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Add new */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '8px' }}>
        <input
          value={newTopic}
          onChange={(e) => setNewTopic(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Research topic..."
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '13px' }}
        />
        <select
          value={newAgent}
          onChange={(e) => setNewAgent(e.target.value)}
          style={{ padding: '8px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '12px' }}
        >
          {AGENTS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button
          onClick={handleAdd}
          style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
        >
          + Add
        </button>
      </div>

      {/* Queue List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {queue.map((task) => {
            const cfg = STATUS_CONFIG[task.status];
            const isExpanded = expandedId === task.id;
            return (
              <div
                key={task.id}
                style={{ background: '#0f172a', border: '1px solid #1e293b', borderLeft: '3px solid ' + cfg.color, borderRadius: '8px', overflow: 'hidden' }}
              >
                <div
                  onClick={() => setExpandedId(isExpanded ? null : task.id)}
                  style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px' }}>{cfg.icon}</span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.topic}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '11px', color: '#64748b' }}>
                      <span style={{ background: cfg.bg, color: cfg.color, padding: '1px 6px', borderRadius: '4px' }}>{cfg.label}</span>
                      <span>🤖 {task.agentId.replace('agent-', '')}</span>
                      <span>🕐 {formatTime(task.createdAt)}</span>
                    </div>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{isExpanded ? '▲' : '▼'}</span>
                </div>

                {isExpanded && (
                  <div style={{ padding: '0 14px 12px', borderTop: '1px solid #1e293b' }}>
                    {task.status === 'complete' && task.result && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Result</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>{task.result}</p>
                        {task.summary && (
                          <>
                            <p style={{ margin: '8px 0 4px', fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Summary</p>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: 1.5 }}>{task.summary}</p>
                          </>
                        )}
                      </div>
                    )}
                    {task.status === 'failed' && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#ef4444' }}>Research failed. Check agent logs for details.</p>
                      </div>
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      {task.status === 'queued' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSimulate(task); }}
                          disabled={simulating === task.id}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #3b82f6', background: '#3b82f622', color: '#3b82f6', fontSize: '11px', cursor: simulating ? 'wait' : 'pointer' }}
                        >
                          {simulating === task.id ? '⏳ Simulating...' : '▶ Start Research'}
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #ef4444', background: '#ef444422', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function generateFakeResult(topic: string): string {
  return 'Based on extensive analysis of "' + topic + '", key findings indicate significant patterns in the domain. Multiple sources were consulted and cross-referenced for accuracy. The research reveals both opportunities and challenges that warrant further investigation. Recommended next steps include deeper analysis of the top 3 findings and stakeholder review.';
}
