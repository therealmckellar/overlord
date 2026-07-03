'use client';

import { useState } from 'react';

type AgentStatus = 'idle' | 'running' | 'error' | 'paused';

interface Agent {
  id: string;
  name: string;
  role: string;
  path: string;
  status: AgentStatus;
  emoji: string;
  description: string;
}

const AGENTS: Agent[] = [
  { id: 'planner',    name: 'Planner',      role: 'Path 1',  path: 'plan',     status: 'idle',    emoji: '🗺️',  description: 'Decomposes goals into subtasks' },
  { id: 'architect',  name: 'Architect',    role: 'Path 1',  path: 'plan',     status: 'idle',    emoji: '🏛️',  description: 'Designs system structure and interfaces' },
  { id: 'builder',    name: 'Builder',      role: 'Path 2',  path: 'build',    status: 'idle',    emoji: '🔨',  description: 'Heavy fix / fast build' },
  { id: 'reviewer',   name: 'Reviewer',     role: 'Path 1',  path: 'review',   status: 'idle',    emoji: '👁️',  description: 'Reviews code for correctness and style' },
  { id: 'security',   name: 'Security',     role: 'Path 8',  path: 'security', status: 'idle',    emoji: '🔒',  description: 'Hunts silent failures and security gaps' },
  { id: 'sdr',        name: 'SDR',          role: 'Path 6',  path: 'research', status: 'idle',    emoji: '📞',  description: 'Outbound research and outreach' },
  { id: 'docs',       name: 'Docs',         role: 'Path 3',  path: 'docs',     status: 'idle',    emoji: '📚',  description: 'Specs, documentation, copy' },
  { id: 'researcher', name: 'Researcher',   role: 'Path 6',  path: 'research', status: 'idle',    emoji: '🔬',  description: 'Research, decks, landing pages' },
  { id: 'refactor',   name: 'Refactor',     role: 'Path 7',  path: 'refactor', status: 'idle',    emoji: '♻️',  description: 'Code refactoring and cleanup' },
  { id: 'e2e',        name: 'E2E Tester',   role: 'Path 9',  path: 'e2e',      status: 'idle',    emoji: '🧪',  description: 'End-to-end testing' },
  { id: 'explorer',   name: 'Explorer',     role: 'Path 10', path: 'explore',  status: 'idle',    emoji: '🗺️',  description: 'Read-only codebase exploration' },
  { id: 'jarvis',     name: 'Jarvis',       role: 'Voice',   path: 'voice',    status: 'idle',    emoji: '🎙️',  description: 'Voice interface and orchestration' },
];

const STATUS_COLORS: Record<AgentStatus, string> = {
  idle:    'bg-slate-500',
  running: 'bg-green-400 animate-pulse',
  error:   'bg-red-500',
  paused:  'bg-yellow-400',
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  idle:    'Idle',
  running: 'Running',
  error:   'Error',
  paused:  'Paused',
};

export default function AgentOfficePanel() {
  const [selected, setSelected] = useState<string | null>(null);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);

  const selectedAgent = agents.find(a => a.id === selected);

  const cycleStatus = (id: string) => {
    const cycle: AgentStatus[] = ['idle', 'running', 'paused', 'error'];
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = cycle[(cycle.indexOf(a.status) + 1) % cycle.length];
      return { ...a, status: next };
    }));
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main canvas */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-[var(--text)]">🏢 Agent Office</h2>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Visual command floor for all active agents and paths.
          </p>
        </div>

        {/* Agent grid — "desks" */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelected(agent.id === selected ? null : agent.id)}
              className={`
                relative text-left p-4 rounded-xl border transition-all duration-150
                ${selected === agent.id
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-[0_0_20px_rgba(99,102,241,0.3)]'
                  : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-tertiary)]'
                }
              `}
            >
              {/* Status dot */}
              <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${STATUS_COLORS[agent.status]}`} />

              <div className="text-2xl mb-2">{agent.emoji}</div>
              <div className="text-sm font-medium text-[var(--text)]">{agent.name}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{agent.role}</div>
              <div className="mt-2 text-[10px] text-[var(--text-muted)] uppercase tracking-wide">
                {STATUS_LABELS[agent.status]}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      {selectedAgent && (
        <div className="w-[280px] border-l border-[var(--border)] bg-[var(--bg-secondary)] p-5 flex flex-col gap-4 shrink-0">
          <div className="text-3xl">{selectedAgent.emoji}</div>
          <div>
            <h3 className="font-semibold text-[var(--text)]">{selectedAgent.name}</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedAgent.role}</p>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">{selectedAgent.description}</p>

          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${STATUS_COLORS[selectedAgent.status]}`} />
            <span className="text-xs text-[var(--text-secondary)]">{STATUS_LABELS[selectedAgent.status]}</span>
          </div>

          <button
            onClick={() => cycleStatus(selectedAgent.id)}
            className="mt-auto px-3 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-medium
              hover:opacity-90 transition-opacity"
          >
            Cycle Status (dev)
          </button>
        </div>
      )}
    </div>
  );
}
