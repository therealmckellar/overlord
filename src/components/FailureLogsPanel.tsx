'use client';

import React, { useState, useMemo } from 'react';
import { useFailureLogStore, type FailureLog } from '@/stores/failureLogStore';

const TYPE_COLORS: Record<string, string> = {
  runtime: '#ef4444',
  api: '#f59e0b',
  timeout: '#8b5cf6',
  logic: '#3b82f6',
};

const TYPE_ICONS: Record<string, string> = {
  runtime: '💥',
  api: '🌐',
  timeout: '⏱️',
  logic: '🧠',
};

export default function FailureLogsPanel() {
  const logs = useFailureLogStore((s) => s.logs);
  const resolveLog = useFailureLogStore((s) => s.resolveLog);
  const deleteLog = useFailureLogStore((s) => s.deleteLog);

  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const agents = useMemo(() => [...new Set(logs.map((l) => l.agentName))], [logs]);
  const types = useMemo(() => [...new Set(logs.map((l) => l.type))], [logs]);

  const filtered = useMemo(() => {
    return logs.filter((l) => {
      if (filterAgent !== 'all' && l.agentName !== filterAgent) return false;
      if (filterType !== 'all' && l.type !== filterType) return false;
      return true;
    });
  }, [logs, filterAgent, filterType]);

  const unresolved = filtered.filter((l) => !l.resolved).length;
  const resolved = filtered.filter((l) => l.resolved).length;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>🔥 Failure Logs</h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {filtered.length} logs · {unresolved} unresolved · {resolved} resolved
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #1e293b', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <select
          value={filterAgent}
          onChange={(e) => setFilterAgent(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '12px' }}
        >
          <option value="all">All Agents</option>
          {agents.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #334155', background: '#1e293b', color: '#f1f5f9', fontSize: '12px' }}
        >
          <option value="all">All Types</option>
          {types.map((t) => <option key={t} value={t}>{TYPE_ICONS[t]} {t}</option>)}
        </select>
      </div>

      {/* Logs List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <p style={{ fontSize: '14px' }}>No failure logs found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((log) => (
              <div
                key={log.id}
                style={{
                  background: log.resolved ? '#0f172a' : '#1a1028',
                  border: `1px solid ${log.resolved ? '#1e293b' : TYPE_COLORS[log.type] + '44'}`,
                  borderLeft: `3px solid ${TYPE_COLORS[log.type]}`,
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                  style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{TYPE_ICONS[log.type]}</span>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: TYPE_COLORS[log.type], textTransform: 'uppercase' }}>{log.type}</span>
                      {log.resolved && <span style={{ fontSize: '10px', background: '#10b98133', color: '#10b981', padding: '1px 6px', borderRadius: '4px' }}>RESOLVED</span>}
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: '#e2e8f0', lineHeight: 1.4 }}>{log.message}</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                      <span>🤖 {log.agentName}</span>
                      <span>🕐 {formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>{expandedId === log.id ? '▲' : '▼'}</span>
                </div>

                {expandedId === log.id && (
                  <div style={{ padding: '0 14px 12px', borderTop: '1px solid #1e293b' }}>
                    {log.stack && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ margin: '0 0 4px', fontSize: '10px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Stack Trace</p>
                        <pre style={{ margin: 0, padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '11px', color: '#94a3b8', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
                          {log.stack}
                        </pre>
                      </div>
                    )}
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      {!log.resolved && (
                        <button
                          onClick={(e) => { e.stopPropagation(); resolveLog(log.id); }}
                          style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #10b981', background: '#10b98122', color: '#10b981', fontSize: '11px', cursor: 'pointer' }}
                        >
                          Mark Resolved
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteLog(log.id); }}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid #ef4444', background: '#ef444422', color: '#ef4444', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
