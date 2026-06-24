import { create } from 'zustand';

export type AgentStatus = 'active' | 'idle' | 'error';
export type AgentRole = 'CEO' | 'Researcher' | 'Voice Exec' | 'TaskRunner' | 'Analyst' | 'Writer' | 'Coder';
export type AgentModel = 'Claude' | 'GPT-4' | 'Gemini' | 'Local';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: AgentStatus;
  model: AgentModel;
  lastActivity: string;
  tokensUsed: number;
  color: string;
  skills: string[];
  logs: { timestamp: string; message: string; type: 'info' | 'warn' | 'error' }[];
  messages: { role: 'user' | 'assistant'; content: string; timestamp: string }[];
}

interface AgentState {
  agents: Agent[];
  selectedAgentId: string | null;
  spawnAgent: (name: string, role: AgentRole, model: AgentModel) => void;
  killAgent: (id: string) => void;
  pauseAgent: (id: string) => void;
  restartAgent: (id: string) => void;
  selectAgent: (id: string | null) => void;
}

const MOCK_AGENTS: Agent[] = [
  {
    id: 'claude-ceo',
    name: 'Claude',
    role: 'CEO',
    status: 'active',
    model: 'Claude',
    lastActivity: 'Just now',
    tokensUsed: 12500,
    color: '#D97706',
    skills: ['Strategic Planning', 'High-Level Reasoning', 'System Architecture'],
    logs: [
      { timestamp: '10:00:01', message: 'Initializing core directives', type: 'info' },
      { timestamp: '10:00:05', message: 'Orchestrating sub-agents for research phase', type: 'info' },
    ],
    messages: [
      { role: 'assistant', content: 'Systems online. I am ready to orchestrate the current objective.', timestamp: '10:00:10' },
    ],
  },
  {
    id: 'hermes-research',
    name: 'Hermes',
    role: 'Researcher',
    status: 'active',
    model: 'Claude',
    lastActivity: '2 mins ago',
    tokensUsed: 45000,
    color: '#2563EB',
    skills: ['Web Scraping', 'Data Analysis', 'Synthesis'],
    logs: [
      { timestamp: '10:05:00', message: 'Scanning target domains', type: 'info' },
      { timestamp: '10:05:20', message: 'Found 12 relevant sources', type: 'info' },
    ],
    messages: [
      { role: 'user', content: 'Find latest news on LLM benchmarks', timestamp: '10:04:00' },
      { role: 'assistant', content: 'I have analyzed 12 sources. The current trend shows a shift towards smaller, distilled models.', timestamp: '10:05:30' },
    ],
  },
  {
    id: 'jarvis-exec',
    name: 'Jarvis',
    role: 'Voice Exec',
    status: 'idle',
    model: 'GPT-4',
    lastActivity: '1 hour ago',
    tokensUsed: 8000,
    color: '#059669',
    skills: ['API Execution', 'Voice Synthesis', 'Automation'],
    logs: [
      { timestamp: '09:00:00', message: 'Listening for wake word', type: 'info' },
    ],
    messages: [],
  },
  {
    id: 'openclaw-runner',
    name: 'OpenClaw',
    role: 'TaskRunner',
    status: 'active',
    model: 'Local',
    lastActivity: '10 secs ago',
    tokensUsed: 2100,
    color: '#7C3AED',
    skills: ['Shell Execution', 'File Management', 'Git Ops'],
    logs: [
      { timestamp: '10:10:00', message: 'Executing npm run build', type: 'info' },
      { timestamp: '10:10:15', message: 'Build completed successfully', type: 'info' },
    ],
    messages: [],
  },
];

export const useAgentStore = create<AgentState>((set) => ({
  agents: MOCK_AGENTS,
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
