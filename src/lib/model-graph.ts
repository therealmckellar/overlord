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
  | 'planner'         // Task planning & decomposition
  | 'architect'       // System architecture & design
  | 'builder'         // Heavy coding/UI/builds
  | 'build-fixer'     // Build/test failure fixes
  | 'researcher'      // Research, decks, LPs, deep analysis
  | 'reviewer'        // Code review, quality gates
  | 'security'        // Security audit
  | 'perf'            // Performance audit
  | 'silent-failure'  // Silent failure detection & debugging
  | 'docs'            // Docs, copy, marketing
  | 'sdr'             // Sales/SDR outreach
  | 'e2e'             // End-to-end testing
  | 'explorer'        // Codebase exploration (read-only)
  | 'refactor'        // Refactoring
  | 'fast'            // Quick fixes
  | 'trading'         // Trading analysis
  | 'utility'         // Glue/cleanup
  | 'kanban-orchestrator' // Kanban multi-agent dispatch
  | 'kanban-worker'   // Kanban ticket executor
  | 'marketing'       // Marketing campaigns
  | 'content-creator'  // Content creation (MCF)
  | 'content-editor';  // Content review (MCF)

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
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'hermes',
    maxTokens: 4096,
    allowedTasks: [], // Orchestrator does NO work — only delegates
  },

  planner: {
    role: 'planner',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    agentFlag: 'planner',
    maxTokens: 16384,
    allowedTasks: [
      'deep-research',
      'report-generation',
      'data-analysis',
    ],
  },

  architect: {
    role: 'architect',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    agentFlag: 'architect',
    maxTokens: 16384,
    allowedTasks: [
      'code-build',
      'refactor',
    ],
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

  'build-fixer': {
    role: 'build-fixer',
    model: 'poolside/laguna-m.1:free',
    provider: 'openrouter',
    agentFlag: 'build-fixer',
    maxTokens: 16384,
    allowedTasks: [
      'code-build',
      'code-review',
      'e2e-test',
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
    model: 'nvidia/nemotron-3-super-120b-a12b:free',
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

  'silent-failure': {
    role: 'silent-failure',
    model: 'cohere/north-mini-code:free',
    provider: 'openrouter',
    agentFlag: 'silent-failure',
    maxTokens: 8192,
    allowedTasks: [
      'code-review',
      'codebase-explore',
      'e2e-test',
    ],
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
    model: 'google/gemma-4-26b-a4b-it:free',
    provider: 'openrouter',
    agentFlag: 'sdr',
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
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'utility',
    maxTokens: 4096,
    allowedTasks: [
      'kanban-task',
      'general',
    ],
  },
  'kanban-orchestrator': {
    role: 'kanban-orchestrator',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    agentFlag: 'kanban-orchestrator',
    maxTokens: 16384,
    allowedTasks: [
      'deep-research',
      'report-generation',
      'data-analysis',
    ],
  },
  'kanban-worker': {
    role: 'kanban-worker',
    model: 'openai/gpt-oss-120b:free',
    provider: 'openrouter',
    agentFlag: 'kanban-worker',
    maxTokens: 16384,
    allowedTasks: [
      'code-build',
      'refactor',
      'docs-copy',
    ],
  },
  marketing: {
    role: 'marketing',
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'marketing-agent',
    maxTokens: 8192,
    allowedTasks: [
      'docs-copy',
      'report-generation',
    ],
  },
  'content-creator': {
    role: 'content-creator',
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'content-creator-mcf',
    maxTokens: 8192,
    allowedTasks: [
      'docs-copy',
      'report-generation',
    ],
  },
  'content-editor': {
    role: 'content-editor',
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'content-editor',
    maxTokens: 8192,
    allowedTasks: [
      'docs-copy',
      'code-review',
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
  'code-build':          'kanban-worker',
  'kanban-task':         'kanban-orchestrator',
  'deep-research':       'researcher',
  'report-generation':   'content-creator',
  'pitch-deck':          'researcher',
  'mindmap':             'researcher',
  'flashcards':          'researcher',
  'data-analysis':       'trading',
  'code-review':         'content-editor',
  'security-audit':      'security',
  'performance-audit':   'perf',
  'docs-copy':           'marketing',
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
  josh: 'content-creator',   // Funding → content creator (pitch decks, reports)
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
 * Unique models for the ModelSelector dropdown.
 * Deduplicates by model name and aggregates agent roles.
 */
export const UNIQUE_MODELS: Array<{
  value: string;
  label: string;
  agents: AgentRole[];
}> = (() => {
  const byModel = new Map<string, AgentRole[]>();
  for (const cfg of Object.values(MODEL_GRAPH)) {
    if (cfg.role === 'orchestrator') continue;
    const existing = byModel.get(cfg.model);
    if (existing) {
      existing.push(cfg.role);
    } else {
      byModel.set(cfg.model, [cfg.role]);
    }
  }
  return Array.from(byModel.entries()).map(([model, agents]) => ({
    value: model,
    label: model, // Full slug: "nvidia/nemotron-3-ultra-550b-a55b:free"
    agents,
  }));
})();

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
