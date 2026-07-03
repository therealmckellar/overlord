'use client';

import React, { useState } from 'react';
import { useAgentStore, type Agent } from '@/stores/agentStore';
import { Play, Pause, RotateCcw, Plus, X, Terminal, Cpu } from 'lucide-react';

type MCStatus = 'idle' | 'running' | 'paused' | 'error' | 'completed' | 'deployed';

const STATUS_ICONS: Record<MCStatus, string> = {
  idle: '⏸',
  running: '▶',
  paused: '⏯',
  error: '⚠',
  completed: '✓',
  deployed: '🚀',
};

// Map agentStore Agent.status to MCStatus
function toMCStatus(s: Agent['status']): MCStatus {
  if (s === 'active') return 'running';
  if (s === 'idle') return 'idle';
  return 'error';
}

// Build a display-compatible agent from agentStore Agent
function toMCAgent(a: Agent) {
  const status = toMCStatus(a.status);
  return {
    id: a.id,
    name: a.name,
    status,
    model: a.model,
    task: a.role,
    context: a.role,
    progress: status === 'running' ? 50 : 0,
    startedAt: Date.now(),
    lastHeartbeat: Date.now(),
    logs: (a.logs ?? []).map(l => ({
      id: `log_${Date.now()}_${Math.random()}`,
      text: `[${l.type.toUpperCase()}] ${l.message}`,
      timestamp: new Date(l.timestamp).getTime(),
      level: l.type as 'info' | 'success' | 'warning' | 'error'
    })),
    pid: null as string | null,
  };
}

export default function MissionControl() {
  const rawAgents = useAgentStore((s) => s.agents);
  const agents = rawAgents.map(toMCAgent);
  const pauseAgent = useAgentStore((s) => s.pauseAgent);
  const restartAgent = useAgentStore((s) => s.restartAgent);
  const spawnAgent = useAgentStore((s) => s.spawnAgent);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [showAddAgent, setShowAddAgent] = useState(false);
  const [newName, setNewName] = useState('');
  const [newModel, setNewModel] = useState('gpt-oss-120b');
  const [newTask, setNewTask] = useState('');
  const [newContext, setNewContext] = useState('');
  const [showStartTask, setShowStartTask] = useState(false);
  const [startTaskText, setStartTaskText] = useState('');
  const [startContext, setStartContext] = useState('');
  const [editingContext, setEditingContext] = useState(false);
  const [contextDraft, setContextDraft] = useState('');

  const handleAddAgent = () => {
    if (!newName.trim() || !newTask.trim()) return;
    spawnAgent(newName, newTask, newModel);
    setNewName('');
    setNewTask('');
    setNewContext('');
    setShowAddAgent(false);
  };

  const handleStartTask = () => {
    if (!selectedAgent || !startTaskText.trim()) return;
    restartAgent(selectedAgent);
    setStartTaskText('');
    setStartContext('');
    setShowStartTask(false);
  };

  const handleSaveContext = () => {
    if (!selectedAgent) return;
    setEditingContext(false);
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <div className="flex h-full overflow-hidden bg-[var(--bg)]">
      {/* Left Panel — Agent List */}
      <div className="w-[280px] flex-shrink-0 border-r border-[var(--border)] bg-[var(--bg-secondary)] flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-secondary)] shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">🛸 Active Agents</span>
          <button
            onClick={() => setShowAddAgent(true)}
            className="btn btn-primary btn-xs"
          >
            <Plus size={10} /> Add
          </button>
        </div>

        {/* Add Agent Form */}
        {showAddAgent && (
          <div className="p-3 border-b border-[var(--border)] bg-[var(--bg-tertiary)] flex flex-col gap-2 shrink-0 animate-fade-in">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Agent name"
              className="input text-[11px] py-1 px-2"
            />
            <input
              value={newModel}
              onChange={(e) => setNewModel(e.target.value)}
              placeholder="Model"
              className="input text-[11px] py-1 px-2"
            />
            <input
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="Task description"
              className="input text-[11px] py-1 px-2"
            />
            <textarea
              value={newContext}
              onChange={(e) => setNewContext(e.target.value)}
              placeholder="Context (optional)..."
              rows={2}
              className="input textarea text-[11px] py-1 px-2"
            />
            <div className="flex gap-1.5 mt-1">
              <button
                onClick={handleAddAgent}
                className="btn btn-primary btn-xs flex-1"
              >
                Deploy
              </button>
              <button
                onClick={() => setShowAddAgent(false)}
                className="btn btn-secondary btn-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={`w-full flex flex-col text-left p-2.5 rounded-md transition-all border ${
                selectedAgent === agent.id
                  ? 'bg-[var(--nav-active-bg)] text-[var(--accent)] border-[rgba(14,165,233,0.2)]'
                  : 'bg-transparent border-transparent text-[var(--text-muted)] hover:bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              <div className="w-full flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12px] font-semibold text-[var(--text)] truncate">{agent.name}</span>
                <span className={`badge text-[8px] tracking-wide ${
                  agent.status === 'running' ? 'badge-success' :
                  agent.status === 'paused'  ? 'badge-warning' : 'badge-error'
                }`}>
                  {agent.status.toUpperCase()}
                </span>
              </div>
              <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed">{agent.task}</p>
              {agent.status === 'running' && (
                <div className="w-full h-1 bg-[var(--border-subtle)] rounded-full overflow-hidden mt-2">
                  <div
                    className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
                    style={{ width: `${agent.progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
          {agents.length === 0 && (
            <p className="text-[10px] text-[var(--text-muted)] text-center py-6">No agents deployed</p>
          )}
        </div>
      </div>

      {/* Right Panel — Agent Detail & Activity */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg)]">
        {selectedAgentData ? (
          <div className="flex-1 flex flex-col overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="panel-header">
              <div className="flex items-center gap-2">
                <span className="text-base">{STATUS_ICONS[selectedAgentData.status]}</span>
                <div>
                  <h2 className="panel-title">{selectedAgentData.name}</h2>
                  <p className="panel-subtitle font-mono text-[9px] uppercase tracking-wide">
                    {selectedAgentData.model} · {selectedAgentData.task}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedAgentData.status === 'running' && (
                  <button
                    onClick={() => pauseAgent(selectedAgentData.id)}
                    className="btn btn-secondary btn-xs"
                  >
                    <Pause size={10} /> Pause
                  </button>
                )}
                {(selectedAgentData.status === 'idle' || selectedAgentData.status === 'error' || selectedAgentData.status === 'completed') && (
                  <>
                    <button
                      onClick={() => {
                        setShowStartTask(true);
                        setContextDraft(selectedAgentData.context);
                      }}
                      className="btn btn-primary btn-xs"
                    >
                      <Play size={10} /> Start Task
                    </button>
                    <button
                      onClick={() => restartAgent(selectedAgentData.id)}
                      className="btn btn-secondary btn-xs"
                    >
                      <RotateCcw size={10} /> Restart
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Content body split */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { label: 'Status', value: selectedAgentData.status.toUpperCase(), badge: true },
                  { label: 'Progress', value: `${Math.round(selectedAgentData.progress)}%` },
                  { label: 'Model', value: selectedAgentData.model.split('/').pop() || '' },
                  { label: 'Runtime', value: selectedAgentData.startedAt ? `${Math.round((Date.now() - selectedAgentData.startedAt) / 60000)}m` : '—' },
                ].map((stat) => (
                  <div key={stat.label} className="card p-3 flex flex-col justify-between">
                    <span className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-semibold">{stat.label}</span>
                    {stat.badge ? (
                      <span className={`badge mt-1 self-start ${
                        selectedAgentData.status === 'running' ? 'badge-success' :
                        selectedAgentData.status === 'paused'  ? 'badge-warning' : 'badge-error'
                      }`}>{stat.value}</span>
                    ) : (
                      <span className="text-[14px] font-bold text-[var(--text)] mt-1">{stat.value}</span>
                    )}
                  </div>
                ))}
              </div>

              {/* Start Task Form */}
              {showStartTask && (
                <div className="card p-3 border-[rgba(14,165,233,0.3)] bg-[var(--bg-tertiary)] flex flex-col gap-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-[var(--accent)] uppercase tracking-wider">Start New Task</span>
                  <input
                    value={startTaskText}
                    onChange={(e) => setStartTaskText(e.target.value)}
                    placeholder="Task description"
                    className="input text-[11.5px]"
                  />
                  <textarea
                    value={startContext}
                    onChange={(e) => setStartContext(e.target.value)}
                    placeholder="Context (optional)..."
                    rows={2.5}
                    className="input textarea text-[11.5px]"
                  />
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={handleStartTask} className="btn btn-primary btn-xs flex-1">Start</button>
                    <button onClick={() => setShowStartTask(false)} className="btn btn-secondary btn-xs">Cancel</button>
                  </div>
                </div>
              )}

              {/* Context Panel */}
              <div className="card p-3 flex flex-col gap-2">
                <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Context / Role</span>
                  {!editingContext ? (
                    <button
                      onClick={() => {
                        setContextDraft(selectedAgentData.context);
                        setEditingContext(true);
                      }}
                      className="btn btn-secondary btn-xs py-0.5"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={handleSaveContext} className="btn btn-primary btn-xs py-0.5">Save</button>
                      <button onClick={() => setEditingContext(false)} className="btn btn-secondary btn-xs py-0.5">Cancel</button>
                    </div>
                  )}
                </div>
                {editingContext ? (
                  <textarea
                    value={contextDraft}
                    onChange={(e) => setContextDraft(e.target.value)}
                    rows={3}
                    className="input textarea font-mono text-[11px]"
                  />
                ) : (
                  <p className="text-[11.5px] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap font-mono">
                    {selectedAgentData.context || 'No instructions set.'}
                  </p>
                )}
              </div>

              {/* Logs */}
              <div className="card flex flex-col min-h-[220px] overflow-hidden">
                <div className="panel-header border-b border-[var(--border)] shrink-0 py-2">
                  <span className="panel-title flex items-center gap-1.5"><Terminal size={12} /> Agent Logs</span>
                </div>
                <div className="flex-1 overflow-y-auto p-3 font-mono text-[10.5px] leading-relaxed space-y-1 bg-[var(--code-bg)]">
                  {selectedAgentData.logs.length === 0 ? (
                    <p className="text-[var(--text-muted)]">No logs available</p>
                  ) : (
                    selectedAgentData.logs.map((log) => (
                      <div
                        key={log.id}
                        className={
                          log.level === 'error' ? 'text-[var(--error)]' :
                          log.level === 'success' ? 'text-[var(--success)]' :
                          log.level === 'warning' ? 'text-[var(--warning)]' : 'text-[var(--text-secondary)]'
                        }
                      >
                        <span className="text-[var(--text-muted)] mr-1.5">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        {log.text}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state h-full">
            <div className="empty-state-icon"><Cpu size={20} className="text-[var(--text-muted)]" /></div>
            <p className="empty-state-title">No Agent Selected</p>
            <p className="empty-state-desc">Select an agent from the sidebar list to monitor logs, edit its context, or issue tasks.</p>
          </div>
        )}
      </div>
    </div>
  );
}
