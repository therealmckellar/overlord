'use client';

import React, { useState } from 'react';
import {
  useKanbanStore,
  KanbanTask,
  TaskStatus,
  TaskPriority,
  COLUMNS,
  COLUMN_LABELS,
  COLUMN_COLORS,
} from '@/stores/kanbanStore';
import { useAgentStore } from '@/stores/agentStore';

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#6b7280',
  medium: '#3b82f6',
  high: '#f59e0b',
  urgent: '#ef4444',
};

const STATUS_OPTIONS: TaskStatus[] = ['backlog', 'todo', 'in_progress', 'review', 'done'];

export default function KanbanBoard() {
  const tasks = useKanbanStore((s) => s.tasks);
  const addTask = useKanbanStore((s) => s.addTask);
  const moveTask = useKanbanStore((s) => s.moveTask);
  const deleteTask = useKanbanStore((s) => s.deleteTask);
  const updateTask = useKanbanStore((s) => s.updateTask);
  const agents = useAgentStore((s) => s.presets);

  const [showNewTask, setShowNewTask] = useState(false);
  const [editingTask, setEditingTask] = useState<KanbanTask | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newStatus, setNewStatus] = useState<TaskStatus>('todo');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newAssignee, setNewAssignee] = useState<string>('Rich');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleCreateTask = () => {
    if (!newTitle.trim()) return;
    addTask({
      title: newTitle,
      description: newDesc,
      status: newStatus,
      priority: newPriority,
      assignee: newAssignee,
      agentId: null,
      dueDate: null,
      tags: [],
    });
    setNewTitle('');
    setNewDesc('');
    setNewStatus('todo');
    setNewPriority('medium');
    setShowNewTask(false);
  };

  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDrop = (status: TaskStatus) => {
    if (draggedTask) {
      moveTask(draggedTask, status);
      setDraggedTask(null);
    }
  };

  const getTasksForColumn = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status);

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
            📋 Task Board
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {tasks.length} tasks · {tasks.filter((t) => t.status === 'in_progress').length} in progress
          </p>
        </div>
        <button
          onClick={() => setShowNewTask(true)}
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
          + New Task
        </button>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Task title..."
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTask()}
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              style={{
                flex: 2,
                minWidth: '200px',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            />
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as TaskStatus)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{COLUMN_LABELS[s]}</option>
              ))}
            </select>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select
              value={newAssignee}
              onChange={(e) => setNewAssignee(e.target.value)}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            >
              <option value="Rich">Rich</option>
              {agents.map((a) => (
                <option key={a.name} value={a.name}>{a.name}</option>
              ))}
            </select>
            <button
              onClick={handleCreateTask}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: '#10b981',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Create
            </button>
            <button
              onClick={() => setShowNewTask(false)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Kanban Columns */}
      <div style={{
        display: 'flex',
        flex: 1,
        gap: '12px',
        padding: '16px 20px',
        overflowX: 'auto',
      }}>
        {COLUMNS.map((status) => {
          const columnTasks = getTasksForColumn(status);
          return (
            <div
              key={status}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(status)}
              style={{
                minWidth: '240px',
                flex: 1,
                background: '#0f172a',
                borderRadius: '8px',
                border: '1px solid #1e293b',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Column Header */}
              <div style={{
                padding: '12px 14px',
                borderBottom: `2px solid ${COLUMN_COLORS[status]}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0' }}>
                  {COLUMN_LABELS[status]}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: COLUMN_COLORS[status],
                  borderRadius: '10px',
                  padding: '2px 8px',
                }}>
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks */}
              <div style={{
                flex: 1,
                padding: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                overflowY: 'auto',
              }}>
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => setEditingTask(task)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      background: '#1e293b',
                      border: `1px solid ${PRIORITY_COLORS[task.priority]}33`,
                      borderLeft: `3px solid ${PRIORITY_COLORS[task.priority]}`,
                      cursor: 'grab',
                      opacity: draggedTask === task.id ? 0.5 : 1,
                      transition: 'opacity 0.2s',
                    }}
                  >
                    <div style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#f1f5f9',
                      marginBottom: '4px',
                    }}>
                      {task.title}
                    </div>
                    {task.description && (
                      <div style={{
                        fontSize: '11px',
                        color: '#94a3b8',
                        marginBottom: '6px',
                        lineHeight: '1.4',
                      }}>
                        {task.description.slice(0, 80)}{task.description.length > 80 ? '...' : ''}
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}>
                      <span style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: PRIORITY_COLORS[task.priority],
                        background: `${PRIORITY_COLORS[task.priority]}15`,
                        padding: '2px 6px',
                        borderRadius: '3px',
                      }}>
                        {task.priority.toUpperCase()}
                      </span>
                      <span style={{
                        fontSize: '10px',
                        color: '#64748b',
                      }}>
                        {task.assignee || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Task Modal */}
      {editingTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
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
              Edit Task
            </h3>
            <input
              value={editingTask.title}
              onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#f1f5f9',
                fontSize: '14px',
                marginBottom: '12px',
                boxSizing: 'border-box',
              }}
            />
            <textarea
              value={editingTask.description}
              onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#0f172a',
                color: '#f1f5f9',
                fontSize: '13px',
                marginBottom: '12px',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <select
                value={editingTask.status}
                onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value as TaskStatus })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '13px',
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{COLUMN_LABELS[s]}</option>
                ))}
              </select>
              <select
                value={editingTask.priority}
                onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as TaskPriority })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '13px',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
              <select
                value={editingTask.assignee || 'Unassigned'}
                onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value === 'Unassigned' ? null : e.target.value })}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: '#0f172a',
                  color: '#f1f5f9',
                  fontSize: '13px',
                }}
              >
                <option value="Unassigned">Unassigned</option>
                <option value="Rich">Rich</option>
                {agents.map((a) => (
                  <option key={a.name} value={a.name}>{a.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { deleteTask(editingTask.id); setEditingTask(null); }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #ef4444',
                  background: 'transparent',
                  color: '#ef4444',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
              <button
                onClick={() => setEditingTask(null)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  background: 'transparent',
                  color: '#94a3b8',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  updateTask(editingTask.id, {
                    title: editingTask.title,
                    description: editingTask.description,
                    status: editingTask.status,
                    priority: editingTask.priority,
                    assignee: editingTask.assignee,
                  });
                  setEditingTask(null);
                }}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#3b82f6',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
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
