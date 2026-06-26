'use client';

import React, { useState } from 'react';
import { useMissionStore, MissionAgent, AgentStatus } from '@/stores/missionStore';

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: '#6b7280',
  running: '#10b981',
  paused: '#f59e0b',
  error: '#ef4444',
  completed: '#3b82f6',
  deployed: '#8b5cf6',
};

const STATUS_ICONS: Record<AgentStatus, string> = {
  idle: '⏸',
  running: '▶',
  paused: '⏯',
  error: '⚠',
  completed: '✓',
  deployed: '🚀',
};

export default function MissionControl() {
  const agents = useMissionStore((s) => s.agents);
  const activityLog = useMissionStore((s) => s.activityLog);
  const stopAgent = useMissionStore((s) => s.stopAgent);
  const restartAgent = useMissionStore((s) => s.restartAgent);
  const addActivity = useMissionStore((s) => s.addActivity);
  const updateAgent = useMissionStore((s) => s.updateAgent);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('gpt-oss-120b');
  const [newTask, setNewTask] = useState('');

  const handleAddAgent = () => {
    if (!newName.trim() || !newTask.trim()) return;
    const { addAgent } = useMissionStore.getState();
    addAgent(newName, newModel, newTask);
    addActivity(newName, 'Agent added to mission', 'info');
    setNewName('');
    setNewTask('');
    setShowAddAgent(false);
  };

  const simulateProgress = (id: string) => {
    const agent = agents.find((a) => a.id === id);
    if (!agent || agent.status !== 'running') return;
    const newProgress = Math.min(agent.progress + Math.random() * 5, 100);
    updateAgent(id, { progress: newProgress });
    if (newProgress >= 100) {
      updateAgent(id, { status: 'completed', progress: 100 });
      addActivity(agent.name, 'Task completed', 'success');
    }
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Left Panel — Agent List */}
      <div style={{
        width: '320px',
        borderRight: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #1e293b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
            🛸 Agents
          </h2>
          <button
            onClick={() => setShowAddAgent(true)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: 'none',
              background: '#3b82f6',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            + Add
          </button>
        </div>

        {/* Add Agent Form */}
        {showAddAgent && (
          <div style={{ padding: '12px', borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Agent name"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
                marginBottom: '6px',
                boxSizing: 'border-box',
              }}
            />
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Model"
              style={{
                width: '100%',
                padding: '6px 10px',
                borderRadius: '4px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '12px',
                marginBottom: '6px',
                boxSizing: 'border-box',
              }}
            />
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task description"
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
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={handleAddAgent}
                style={{
                  flex: 1,
                  padding: '6px',
                  borderRadius: '4px',
                  border: 'none',
                  background: '#10b981',
                  color: '#fff',
                  fontSize: '12px',
                  cursor: 'pointer',
                }}
              >
                Deploy
              </button>
              <button
                onClick={() => setShowAddAgent(false)}
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
            </div>
          </div>
        )}

        {/* Agent List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {agents.map((agent) => (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                marginBottom: '4px',
                background: selectedAgent === agent.id ? '#1e293b' : 'transparent',
                border: `1px solid ${selectedAgent === agent.id ? '#334155' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontSize: '14px' }}>{STATUS_ICONS[agent.status]}</span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9', flex: 1 }}>
                  {agent.name}
                </span>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: STATUS_COLORS[agent.status],
                  background: `${STATUS_COLORS[agent.status]}20`,
                  padding: '2px 6px',
                  borderRadius: '3px',
                }}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                {agent.task}
              </div>
              {agent.status === 'running' && (
                <div style={{
                  height: '3px',
                  background: '#1e293b',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${agent.progress}%`,
                    background: '#10b981',
                    borderRadius: '2px',
                    transition: 'width 0.3s',
                  }} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Agent Detail & Activity */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedAgentData ? (
          <>
            {/* Agent Detail Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f1f5f9' }}>
                  {STATUS_ICONS[selectedAgentData.status]} {selectedAgentData.name}
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {selectedAgentData.model} · {selectedAgentData.task}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedAgentData.status === 'running' && (
                  <>
                    <button
                      onClick={() => {
                        stopAgent(selectedAgentData.id);
                        addActivity(selectedAgentData.name, 'Agent stopped', 'warning');
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #f59e0b',
                        background: 'transparent',
                        color: '#f59e0b',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ⏸ Pause
                    </button>
                    <button
                      onClick={() => {
                        simulateProgress(selectedAgentData.id);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #3b82f6',
                        background: 'transparent',
                        color: '#3b82f6',
                        fontSize: '12px',
                        cursor: 'pointer',
                      }}
                    >
                      ⚡ Step
                    </button>
                  </>
                )}
                {(selectedAgentData.status === 'idle' || selectedAgentData.status === 'error' || selectedAgentData.status === 'completed') && (
                  <button
                    onClick={() => {
                      restartAgent(selectedAgentData.id);
                      addActivity(selectedAgentData.name, 'Agent restarted', 'info');
                    }}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#10b981',
                      color: '#fff',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    ▶ Restart
                  </button>
                )}
              </div>
            </div>

            {/* Agent Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              padding: '16px 20px',
            }}>
              {[
                { label: 'Status', value: selectedAgentData.status, color: STATUS_COLORS[selectedAgentData.status] },
                { label: 'Progress', value: `${Math.round(selectedAgentData.progress)}%`, color: '#3b82f6' },
                { label: 'Model', value: selectedAgentData.model.split('/').pop() || '', color: '#8b5cf6' },
                { label: 'Runtime', value: selectedAgentData.startedAt ? `${Math.round((Date.now() - selectedAgentData.startedAt) / 60000)}m` : '—', color: '#64748b' },
              ].map((stat) => (
                <div key={stat.label} style={{
                  padding: '12px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  border: '1px solid #1e293b',
                }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px' }}>{stat.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Agent Logs */}
            <div style={{
              flex: 1,
              margin: '0 20px 16px',
              borderRadius: '8px',
              background: '#0a0f1a',
              border: '1px solid #1e293b',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid #1e293b',
                fontSize: '12px',
                fontWeight: 600,
                color: '#94a3b8',
              }}>
                📜 Agent Logs
              </div>
              <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '8px',
                fontFamily: 'monospace',
                fontSize: '11px',
                lineHeight: '1.6',
              }}>
                {selectedAgentData.logs.length === 0 ? (
                  <div style={{ color: '#475569', padding: '12px' }}>No logs yet</div>
                ) : (
                  selectedAgentData.logs.map((log) => (
                    <div key={log.id} style={{
                      color:
                        log.level === 'error' ? '#ef4444' :
                        log.level === 'success' ? '#10b981' :
                        log.level === 'warning' ? '#f59e0b' : '#94a3b8',
                    }}>
                      <span style={{ color: '#475569' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>{' '}
                      {log.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#475569',
            fontSize: '14px',
          }}>
            Select an agent to view details
          </div>
        )}

        {/* Activity Feed */}
        <div style={{
          height: '160px',
          borderTop: '1px solid #1e293b',
          padding: '12px 20px',
          overflowY: 'auto',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>
            📡 Activity Feed
          </div>
          {activityLog.slice(0, 10).map((entry) => (
            <div key={entry.id} style={{
              fontSize: '11px',
              color:
                entry.type === 'error' ? '#ef4444' :
                entry.type === 'success' ? '#10b981' :
                entry.type === 'warning' ? '#f59e0b' : '#94a3b8',
              marginBottom: '3px',
            }}>
              <span style={{ color: '#475569' }}>
                {new Date(entry.timestamp).toLocaleTimeString()}
              </span>{' '}
              <strong>{entry.agentName}</strong> — {entry.action}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
