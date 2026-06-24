/**
 * Model Graph — Strict Agent Routing Layer
 * 
 * Every task in Overlord MUST go through the correct agent/model path.
 * The orchestrator (Hermes/OWL) does NOT do work directly — it delegates.
 * 
 * This module enforces the routing so no task runs on the wrong model.
 */

export type AgentRole = 
  | 'orchestrator'    // Hermes — delegates only, never does work
  | 'builder'         // Heavy coding/UI/builds
  | 'researcher'      // Research, decks, LPs, deep analysis
  | 'reviewer'        // Code review, quality gates
  | 'security'        // Security audit
  | 'perf'            // Performance audit
  | 'docs'            // Docs, copy, marketing
  | 'sdr'             // Sales/SDR outreach
  | 'e2e'             // End-to-end testing
  | 'explorer'        // Codebase exploration (read-only)
  | 'refactor'        // Refactoring
  | 'fast'            // Quick fixes
  | 'trading'         // Trading analysis
  | 'utility';        // Glue/cleanup

export type TaskCategory =
  | 'image-generation'
  | 'video-creation'
  | 'design-graphics'
  | 'canvas-drawing'
  | 'report-generation'
  | 'mindmap'
  | 'flashcards'
  | 'kanban-task'
  | 'deep-research'
  | 'pitch-deck'
  | 'landing-page'
  | 'code-build'
  | 'code-review'
  | 'security-audit'
  | 'performance-audit'
  | 'docs-copy'
  | 'sdr-outreach'
  | 'e2e-test'
  | 'codebase-explore'
  | 'refactor'
  | 'data-analysis'
  | 'general';

export interface AgentConfig {
  role: AgentRole;
  model: string;
  provider: string;
  agentFlag: string;       // opencode --agent <flag>
  maxTokens: number;
  allowedTasks: TaskCategory[];
}

// ─── THE MODEL GRAPH ──────────────────────────────────────────────
// This is the single source of truth for which model handles what.

export const MODEL_GRAPH: Record<AgentRole, AgentConfig> = {
  orchestrator: {
    role: 'orchestrator',
    model: 'openrouter/owl-alpha',
    provider: 'openrouter',
    agentFlag: 'hermes',
    maxTokens: 4096,
    allowedTasks: [], // Orchestrator does NO work — only delegates
  },

  builder: {
    role: 'builder',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'builder',
    maxTokens: 16384,
    allowedTasks: [
      'image-generation',
      'video-creation',
      'design-graphics',
      'canvas-drawing',
      'landing-page',
      'code-build',
      'kanban-task',
    ],
  },

  researcher: {
    role: 'researcher',
    model: 'moonshotai/kimi-k2.6:free',
    provider: 'openrouter',
    agentFlag: 'researcher',
    maxTokens: 16384,
    allowedTasks: [
      'deep-research',
      'report-generation',
      'pitch-deck',
      'mindmap',
      'flashcards',
      'data-analysis',
    ],
  },

  reviewer: {
    role: 'reviewer',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'reviewer',
    maxTokens: 8192,
    allowedTasks: ['code-review'],
  },

  security: {
    role: 'security',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'security',
    maxTokens: 8192,
    allowedTasks: ['security-audit'],
  },

  perf: {
    role: 'perf',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'perf',
    maxTokens: 8192,
    allowedTasks: ['performance-audit'],
  },

  docs: {
    role: 'docs',
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'docs',
    maxTokens: 8192,
    allowedTasks: [
      'docs-copy',
      'report-generation',
    ],
  },

  sdr: {
    role: 'sdr',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'builder',
    maxTokens: 8192,
    allowedTasks: ['sdr-outreach'],
  },

  e2e: {
    role: 'e2e',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'e2e',
    maxTokens: 8192,
    allowedTasks: ['e2e-test'],
  },

  explorer: {
    role: 'explorer',
    model: 'nex-agi/nex-n2-pro:free',
    provider: 'openrouter',
    agentFlag: 'explorer',
    maxTokens: 8192,
    allowedTasks: ['codebase-explore'],
  },

  refactor: {
    role: 'refactor',
    model: 'openai/gpt-oss-20b:free',
    provider: 'openrouter',
    agentFlag: 'refactor',
    maxTokens: 8192,
    allowedTasks: ['refactor'],
  },

  fast: {
    role: 'fast',
    model: 'nex-agi/nex-n2-pro:free',
    provider: 'openrouter',
    agentFlag: 'fast',
    maxTokens: 4096,
    allowedTasks: [
      'code-build',
      'refactor',
      'docs-copy',
    ],
  },

  trading: {
    role: 'trading',
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
    provider: 'openrouter',
    agentFlag: 'trading-worker',
    maxTokens: 8192,
    allowedTasks: ['data-analysis'],
  },

  utility: {
    role: 'utility',
    model: 'meta-llama/llama-3.2-3b-instruct:free',
    provider: 'openrouter',
    agentFlag: 'utility',
    maxTokens: 4096,
    allowedTasks: [
      'kanban-task',
      'general',
    ],
  },
};

// ─── TASK ROUTING MAP ─────────────────────────────────────────────
// Maps task category → which agent handles it

export const TASK_ROUTING: Record<TaskCategory, AgentRole> = {
  'image-generation':    'builder',
  'video-creation':      'builder',
  'design-graphics':     'builder',
  'canvas-drawing':      'builder',
  'landing-page':        'builder',
  'code-build':          'builder',
  'kanban-task':         'utility',
  'deep-research':       'researcher',
  'report-generation':   'researcher',
  'pitch-deck':          'researcher',
  'mindmap':             'researcher',
  'flashcards':          'researcher',
  'data-analysis':       'trading',
  'code-review':         'reviewer',
  'security-audit':      'security',
  'performance-audit':   'perf',
  'docs-copy':           'docs',
  'sdr-outreach':        'sdr',
  'e2e-test':            'e2e',
  'codebase-explore':    'explorer',
  'refactor':            'refactor',
  'general':             'fast',
};

// ─── PERSONA → AGENT MAPPING ──────────────────────────────────────
// Which agent persona tasks should route through

export const PERSONA_AGENT_MAP: Record<string, AgentRole> = {
  hermes: 'orchestrator',
  david: 'sdr',          // Promo/merch → SDR outreach
  josh: 'researcher',   // Funding → researcher (pitch decks, reports)
  steve: 'researcher',   // Consulting → researcher (strategy, analysis)
  fathom: 'researcher',  // Real estate → researcher (market analysis)
};

// ─── ROUTING FUNCTIONS ────────────────────────────────────────────

/**
 * Get the agent config for a given task
 */
export function getAgentForTask(task: TaskCategory): AgentConfig {
  const role = TASK_ROUTING[task];
  return MODEL_GRAPH[role];
}

/**
 * Get the agent config for a given persona
 */
export function getAgentForPersona(persona: string): AgentConfig {
  const role = PERSONA_AGENT_MAP[persona] || 'orchestrator';
  return MODEL_GRAPH[role];
}

/**
 * Check if a task is allowed for a given agent role
 */
export function isTaskAllowed(task: TaskCategory, role: AgentRole): boolean {
  const config = MODEL_GRAPH[role];
  return config.allowedTasks.includes(task);
}

/**
 * Build the opencode command for a task
 */
export function buildAgentCommand(task: TaskCategory, prompt: string): string {
  const config = getAgentForTask(task);
  return `opencode run --agent ${config.agentFlag} --model "${config.model}" ${escapePrompt(prompt)}`;
}

/**
 * Build the opencode command for a specific agent role
 */
export function buildAgentCommandForRole(role: AgentRole, prompt: string): string {
  const config = MODEL_GRAPH[role];
  return `opencode run --agent ${config.agentFlag} --model "${config.model}" ${escapePrompt(prompt)}`;
}

function escapePrompt(prompt: string): string {
  return `"${prompt.replace(/"/g, '\\"').replace(/\n/g, ' ')}"`;
}

/**
 * Get all available agent roles (for UI display)
 */
export function getAllAgents(): AgentConfig[] {
  return Object.values(MODEL_GRAPH).filter((a) => a.role !== 'orchestrator');
}

/**
 * Validate that a task is being routed to the correct agent.
 * Throws if orchestrator tries to do work directly.
 */
export function enforceRouting(task: TaskCategory, attemptedRole: AgentRole): void {
  if (attemptedRole === 'orchestrator') {
    const correctAgent = TASK_ROUTING[task];
    throw new Error(
      `ORCHESTRATOR BLOCKED: Task "${task}" must be routed to ${MODEL_GRAPH[correctAgent].agentFlag} (${MODEL_GRAPH[correctAgent].model}), not executed by orchestrator. Use: opencode run --agent ${MODEL_GRAPH[correctAgent].agentFlag}`
    );
  }
  if (!isTaskAllowed(task, attemptedRole)) {
    const correctAgent = TASK_ROUTING[task];
    throw new Error(
      `ROUTING VIOLATION: Agent "${attemptedRole}" is not allowed to handle "${task}". Correct agent: ${MODEL_GRAPH[correctAgent].agentFlag}`
    );
  }
}
