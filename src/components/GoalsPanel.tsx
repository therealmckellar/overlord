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
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleCreate = () => {
    if (!newTitle.trim()) return;
    addGoal({ title: newTitle, description: newDesc, linkedTasks: [], linkedAgents: [] });
    setNewTitle('');
    setNewDesc('');
    setShowNewGoal(false);
  };

  const activeGoals = getActiveGoals();
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const pausedGoals = goals.filter((g) => g.status === 'paused');

  const getStatusColor = (status: Goal['status']) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'paused': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: Goal['status']) => {
    switch (status) {
      case 'active': return '🟢 Active';
      case 'completed': return '✅ Done';
      case 'paused': return '⏸ Paused';
      default: return status;
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
            {activeGoals.length} active · {pausedGoals.length} paused · {completedGoals.length} done
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
              style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#10b981', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
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
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              Active
            </div>
            {activeGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
                onEdit={setEditingGoal}
              />
            ))}
          </div>
        )}

        {/* Paused Goals */}
        {pausedGoals.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
              ⏸ Paused
            </div>
            {pausedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                onUpdate={updateGoal}
                onDelete={deleteGoal}
                onEdit={setEditingGoal}
              />
            ))}
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
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
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '13px', color: '#94a3b8', textDecoration: 'line-through' }}>
                  ✓ {goal.title}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => updateGoal(goal.id, { status: 'active' })}
                    style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', cursor: 'pointer' }}
                  >
                    Reactivate
                  </button>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {goals.length === 0 && (
          <div style={{ textAlign: 'center', color: '#475569', fontSize: '13px', padding: '40px 0' }}>
            No goals yet. Click "+ Add Goal" to create one.
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {editingGoal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1e293b',
            borderRadius: '12px',
            padding: '24px',
            width: '500px',
            maxWidth: '90vw',
            border: '1px solid #334155',
          }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#f1f5f9' }}>
              Edit Goal
            </h3>
            <input
              value={editingGoal.title}
              onChange={(e) => setEditingGoal({ ...editingGoal, title: e.target.value })}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155',
                background: '#0f172a', color: '#f1f5f9', fontSize: '14px', marginBottom: '12px', boxSizing: 'border-box',
              }}
            />
            <textarea
              value={editingGoal.description}
              onChange={(e) => setEditingGoal({ ...editingGoal, description: e.target.value })}
              rows={3}
              placeholder="Description"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #334155',
                background: '#0f172a', color: '#f1f5f9', fontSize: '13px', marginBottom: '12px', resize: 'vertical', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <label style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Progress: {editingGoal.progress}%
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={editingGoal.progress}
                  onChange={(e) => setEditingGoal({ ...editingGoal, progress: parseInt(e.target.value) })}
                  style={{ width: '120px' }}
                />
              </label>
            </div>

            {/* Quick status actions */}
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
              {editingGoal.status !== 'active' && (
                <button onClick={() => setEditingGoal({ ...editingGoal, status: 'active' })} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#10b98122', color: '#10b981', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                  ▶ Start
                </button>
              )}
              {editingGoal.status === 'active' && (
                <button onClick={() => setEditingGoal({ ...editingGoal, status: 'paused' })} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#f59e0b22', color: '#f59e0b', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                  ⏸ Pause
                </button>
              )}
              {editingGoal.status === 'paused' && (
                <button onClick={() => setEditingGoal({ ...editingGoal, status: 'active' })} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#10b98122', color: '#10b981', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                  ▶ Resume
                </button>
              )}
              {editingGoal.status !== 'completed' && (
                <button onClick={() => setEditingGoal({ ...editingGoal, status: 'completed', progress: 100 })} style={{ padding: '6px 12px', borderRadius: '4px', border: 'none', background: '#3b82f622', color: '#3b82f6', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                  ✓ Complete
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { deleteGoal(editingGoal.id); setEditingGoal(null); }} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: '13px', cursor: 'pointer' }}>
                Delete
              </button>
              <button onClick={() => setEditingGoal(null)} style={{ padding: '8px 14px', borderRadius: '6px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
                Cancel
              </button>
              <button
                onClick={() => {
                  updateGoal(editingGoal.id, {
                    title: editingGoal.title,
                    description: editingGoal.description,
                    progress: editingGoal.progress,
                    status: editingGoal.status,
                  });
                  setEditingGoal(null);
                }}
                style={{ padding: '8px 14px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Goal Card ─── */
function GoalCard({
  goal,
  onUpdate,
  onDelete,
  onEdit,
}: {
  goal: Goal;
  onUpdate: (id: string, updates: Partial<Goal>) => void;
  onDelete: (id: string) => void;
  onEdit: (goal: Goal) => void;
}) {
  const statusColor = goal.status === 'active' ? '#10b981' : goal.status === 'paused' ? '#f59e0b' : '#6b7280';

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: '8px',
        border: `1px solid ${statusColor}33`,
        background: '#0f172a',
        marginBottom: '8px',
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
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
        <span style={{ fontSize: '16px', fontWeight: 700, color: statusColor, marginLeft: '12px' }}>
          {goal.progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ height: '100%', width: `${goal.progress}%`, background: statusColor, borderRadius: '3px', transition: 'width 0.3s' }} />
      </div>

      {/* Linked info */}
      {(goal.linkedTasks.length > 0 || goal.linkedAgents.length > 0) && (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
          {goal.linkedAgents.map((agent) => (
            <span key={agent} style={{ fontSize: '10px', color: '#8b5cf6', background: '#8b5cf615', padding: '2px 6px', borderRadius: '3px' }}>
              🤖 {agent}
            </span>
          ))}
          {goal.linkedTasks.map((task) => (
            <span key={task} style={{ fontSize: '10px', color: '#3b82f6', background: '#3b82f615', padding: '2px 6px', borderRadius: '3px' }}>
              📋 {task.slice(0, 12)}...
            </span>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        {goal.status === 'active' && (
          <>
            <button onClick={() => onUpdate(goal.id, { progress: Math.min(goal.progress + 10, 100) })} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#10b98120', color: '#10b981', fontSize: '10px', cursor: 'pointer' }}>
              +10%
            </button>
            <button onClick={() => onUpdate(goal.id, { progress: Math.max(goal.progress - 10, 0) })} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: '10px', cursor: 'pointer' }}>
              -10%
            </button>
            <button onClick={() => onUpdate(goal.id, { status: 'paused' })} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#f59e0b22', color: '#f59e0b', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>
              ⏸ Pause
            </button>
            <button onClick={() => onUpdate(goal.id, { status: 'completed', progress: 100 })} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#3b82f620', color: '#3b82f6', fontSize: '10px', cursor: 'pointer' }}>
              ✓ Complete
            </button>
          </>
        )}
        {goal.status === 'paused' && (
          <button onClick={() => onUpdate(goal.id, { status: 'active' })} style={{ padding: '4px 8px', borderRadius: '4px', border: 'none', background: '#10b98122', color: '#10b981', fontSize: '10px', cursor: 'pointer', fontWeight: 600 }}>
            ▶ Resume
          </button>
        )}
        <button onClick={() => onEdit(goal)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #3b82f6', background: 'transparent', color: '#3b82f6', fontSize: '10px', cursor: 'pointer' }}>
          ✏️ Edit
        </button>
        <button onClick={() => onDelete(goal.id)} style={{ padding: '4px 8px', borderRadius: '4px', border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', fontSize: '10px', cursor: 'pointer', marginLeft: 'auto' }}>
          Delete
        </button>
      </div>
    </div>
  );
}
