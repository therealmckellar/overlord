'use client';

import React, { useState } from 'react';
import { useSharedMemoryStore, Goal } from '@/stores/sharedMemoryStore';

export default function GoalsPanel() {
  const goals = useSharedMemoryStore((s) => s.goals);
  const addGoal = useSharedMemoryStore((s) => s.addGoal);
  const updateGoal = useSharedMemoryStore((s) => s.updateGoal);
  const deleteGoal = useSharedMemoryStore((s) => s.deleteGoal);
  const getActiveGoals = useSharedMemoryStore((s) => s.getActiveGoals);

  const [showNewGoal, setShowNewGoal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addGoal({ title: newTitle, description: newDesc, linkedTasks: [], linkedAgents: [] });
    setNewTitle('');
    setNewDesc('');
    setShowNewGoal(false);
  };

  const activeGoals = getActiveGoals();
  const completedGoals = goals.filter((g) => g.status === 'completed');

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'paused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

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
            🎯 Goals
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {activeGoals.length} active · {completedGoals.length} completed
          </p>
        </div>
        <button
          onClick={() => setShowNewGoal(true)}
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
          + Add Goal
        </button>
      </div>

      {/* New Goal Form */}
      {showNewGoal && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Goal title..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #334155',
              background: '#1e293b',
              color: '#f1f5f9',
              fontSize: '13px',
              marginBottom: '8px',
              boxSizing: 'border-box',
            }}
          />
          <textarea
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
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
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowNewGoal(false)}
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
              onClick={handleCreate}
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
              Create Goal
            </button>
          </div>
        </div>
      )}

      {/* Goals List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Active Goals
            </div>
            {activeGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '14px 16px',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  background: '#0f172a',
                  marginBottom: '8px',
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px',
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                      {goal.title}
                    </div>
                    {goal.description && (
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>
                        {goal.description}
                      </div>
                    )}
                  </div>
                  <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    color: getStatusColor(goal.status),
                    marginLeft: '12px',
                  }}>
                    {goal.progress}%
                  </span>
                </div>

                {/* Progress bar */}
                <div style={{
                  height: '6px',
                  background: '#1e293b',
                  borderRadius: '3px',
                  overflow: 'hidden',
                  marginBottom: '10px',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${goal.progress}%`,
                    background: getStatusColor(goal.status),
                    borderRadius: '3px',
                    transition: 'width 0.3s',
                  }} />
                </div>

                {/* Linked info */}
                {(goal.linkedTasks.length > 0 || goal.linkedAgents.length > 0) && (
                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    flexWrap: 'wrap',
                    marginBottom: '8px',
                  }}>
                    {goal.linkedAgents.map((agent) => (
                      <span key={agent} style={{
                        fontSize: '10px',
                        color: '#8b5cf6',
                        background: '#8b5cf615',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}>
                        🤖 {agent}
                      </span>
                    ))}
                    {goal.linkedTasks.map((task) => (
                      <span key={task} style={{
                        fontSize: '10px',
                        color: '#3b82f6',
                        background: '#3b82f615',
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}>
                        📋 {task.slice(0, 12)}...
                      </span>
                    ))}
                  </div>
                )}

                {/* Controls */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => updateGoal(goal.id, { progress: Math.min(goal.progress + 10, 100) })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#10b98120',
                      color: '#10b981',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    +10%
                  </button>
                  <button
                    onClick={() => updateGoal(goal.id, { progress: Math.max(goal.progress - 10, 0) })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #334155',
                      background: 'transparent',
                      color: '#94a3b8',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    -10%
                  </button>
                  <button
                    onClick={() => updateGoal(goal.id, { status: 'completed' })}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: 'none',
                      background: '#3b82f620',
                      color: '#3b82f6',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    ✓ Complete
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #ef4444',
                      background: 'transparent',
                      color: '#ef4444',
                      fontSize: '10px',
                      cursor: 'pointer',
                      marginLeft: 'auto',
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <div style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#64748b',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '8px',
            }}>
              Completed
            </div>
            {completedGoals.map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '1px solid #1e293b',
                  background: '#0a0f1a',
                  marginBottom: '6px',
                  opacity: 0.7,
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    ✓ {goal.title}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    color: '#3b82f6',
                    background: '#3b82f615',
                    padding: '2px 6px',
                    borderRadius: '3px',
                  }}>
                    DONE
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
