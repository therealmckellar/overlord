import { create } from 'zustand';
import { getAllAgents, type AgentConfig } from '@/lib/model-graph';

export type AgentStatus = 'active' | 'idle' | 'error';

export interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  model: string;
  provider: string;
  agentFlag: string;
  maxTokens: number;
  lastActivity: string;
  tokensUsed: number;
  color: string;
  skills: string[];
  allowedTasks: string[];
  logs: { timestamp: string; message: string; type: 'info' | 'warn' | 'error' }[];
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
}

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  spawnAgent: (name: string, role: string, model: string) => void;
  killAgent: (id: string) => void;
  pauseAgent: (id: string) => void;
  restartAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
}

const ROLE_COLORS: Record<string, string> = {
  orchestrator: '#8B5CF6',
  planner: '#06B6D4',
  architect: '#3B82F6',
  builder: '#10B981',
  'build-fixer': '#F59E0B',
  researcher: '#2563EB',
  reviewer: '#EC4899',
  security: '#EF4444',
  perf: '#F97316',
  'silent-failure': '#6366F1',
  docs: '#14B8A6',
  sdr: '#84CC16',
  e2e: '#A855F7',
  explorer: '#0EA5E9',
  refactor: '#64748B',
  fast: '#22D3EE',
  trading: '#DC2626',
  utility: '#78716C',
};

const ROLE_SKILLS: Record<string, string[]> = {
  orchestrator: ['Delegation', 'Task Routing', 'Verification'],
  planner: ['Task Decomposition', 'Planning', 'Dependency Analysis'],
  architect: ['System Design', 'Architecture', 'API Contracts'],
  builder: ['Code Generation', 'UI Builds', 'Full-Stack'],
  'build-fixer': ['Build Repair', 'Test Fixes', 'Debugging'],
  researcher: ['Deep Research', 'Analysis', 'Report Generation'],
  reviewer: ['Code Review', 'Quality Gates', 'Security Checks'],
  security: ['Security Audit', 'Vulnerability Scanning', 'OWASP'],
  perf: ['Performance Audit', 'Core Web Vitals', 'Profiling'],
  'silent-failure': ['Log Analysis', 'Pattern Detection', 'Alerting'],
  docs: ['Documentation', 'Copy Writing', 'Marketing'],
  sdr: ['Outreach', 'Email Generation', 'Lead Qualification'],
  e2e: ['End-to-End Testing', 'Playwright', 'QA'],
  explorer: ['Codebase Analysis', 'Code Graph', 'Read-Only Audit'],
  refactor: ['Code Refactoring', 'Pattern Matching', 'Cleanup'],
  fast: ['Quick Fixes', 'Patching', 'Hot Fixes'],
  trading: ['Market Analysis', 'Technical Analysis', 'Forecasting'],
  utility: ['Glue Code', 'Data Transfer', 'Formatting'],
};

function buildAgentsFromGraph(): Agent[] {
  const configs = getAllAgents();
  return configs.map((config: AgentConfig, idx: number) => ({
    id: `agent-${config.role}`,
    name: config.role.charAt(0).toUpperCase() + config.role.slice(1).replace('-', ' '),
    role: config.role,
    status: idx < 3 ? 'active' : idx < 8 ? 'idle' : 'active',
    model: config.model,
    provider: config.provider,
    agentFlag: config.agentFlag,
    maxTokens: config.maxTokens,
    lastActivity: idx < 3 ? 'Just now' : idx < 8 ? `${idx * 2} mins ago` : `${idx * 5} mins ago`,
    tokensUsed: idx < 3 ? Math.floor(Math.random() * 50000) : Math.floor(Math.random() * 10000),
    color: ROLE_COLORS[config.role] || '#64748B',
    skills: ROLE_SKILLS[config.role] || ['General Purpose'],
    allowedTasks: config.allowedTasks,
    logs: [
      { timestamp: new Date().toLocaleTimeString(), message: `Agent initialized — ${config.model}`, type: 'info' },
    ],
    messages: [],
  }));
}

const AGENTS = buildAgentsFromGraph();

export const useAgentStore = create<AgentState>((set) => ({
  agents: AGENTS,
  selectedAgentId: null,
  spawnAgent: (name, role, model) => set((state) => ({
    agents: [
      ...state.agents,
      {
        id: Math.random().toString(36).substr(2, 9),
        name,
        role,
        status: 'active',
        model,
        lastActivity: 'Just now',
        tokensUsed: 0,
        color: '#'+Math.floor(Math.random()*16777215).toString(16),
        skills: ['General Purpose'],
        logs: [{ timestamp: new Date().toLocaleTimeString(), message: 'Agent spawned', type: 'info' }],
        messages: [],
      }
    ]
  })),
  killAgent: (id) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, status: 'error' } : a)
  })),
  pauseAgent: (id) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, status: 'idle' } : a)
  })),
  restartAgent: (id) => set((state) => ({
    agents: state.agents.map(a => a.id === id ? { ...a, status: 'active' } : a)
  })),
  selectAgent: (id) => set({ selectedAgentId: id }),
}));
