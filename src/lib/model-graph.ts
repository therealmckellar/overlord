/**
 * Model Graph — Strict Agent Routing Layer
 *
 * Every task in Overlord MUST go through the correct agent/model path.
 * The orchestrator (Hermes/OWL) does NOT do work directly — it delegates.
 *
 * This module enforces the routing so no task runs on the wrong model.
 *
 * ─── DESIGN PRINCIPLES (applied from the "Agent Stack That Ships" thesis) ───
 * 1. LAYERED FRONTIER TIERS — the hardest sub-problems get the strongest
 *    available model (our free-tier analog of Fable 5 / GPT-5.6 frontier
 *    pairing). We cannot use Anthropic/paid OpenAI per policy, so the
 *    frontier tier is the biggest OpenRouter free models (Nemotron 3 Ultra,
 *    gpt-oss-120b reasoning, Hermes 3 405B).
 * 2. AUTONOMOUS PIPELINE — a self-driving role ("ships while you sleep")
 *    that orchestrates build→checkpoint→ship without a human in the loop.
 * 3. CHECKPOINTS — every build/worker role that can SHIP sets `checkpoint`,
 *    meaning it must pass a review gate (reviewer / security) before ship.
 *    `requiresCheckpoint(role)` encodes "checkpoint after every piece."
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
  | 'content-editor'  // Content review (MCF)
  | 'reasoning'       // Frontier reasoning tier — hardest sub-problems (free analog of Fable 5 / GPT-5.6)
  | 'pipeline';       // Autonomous end-to-end orchestration ("ships while you sleep")

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
  | 'content-review'     // Explicit content (non-code) review — separated from code-review
  | 'security-audit'
  | 'performance-audit'
  | 'docs-copy'
  | 'sdr-outreach'
  | 'e2e-test'
  | 'codebase-explore'
  | 'refactor'
  | 'data-analysis'
  | 'deep-reasoning'     // Hardest reasoning sub-problems → frontier tier
  | 'autonomous-pipeline' // Self-driving build→checkpoint→ship
  | 'general';

export interface AgentConfig {
  role: AgentRole;
  model: string;
  provider: string;
  agentFlag: string;       // opencode --agent <flag>
  maxTokens: number;
  allowedTasks: TaskCategory[];
  /**
   * If true, this role can SHIP and must pass a review checkpoint
   * (reviewer / security / content-editor) before going live.
   * Encodes the "checkpoint after every piece" principle.
   */
  checkpoint?: boolean;
}

// ─── THE MODEL GRAPH ──────────────────────────────────────────────
// This is the single source of truth for which model handles what.

export const MODEL_GRAPH: Record<AgentRole, AgentConfig> = {
  orchestrator: {
    role: 'orchestrator',
    model: 'tencent/hy3:free',
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
    model: 'poolside/laguna-m.1:free', // best free codegen, 262K ctx
    provider: 'openrouter',
    agentFlag: 'builder',
    maxTokens: 65536, // raised for autonomous/long builds (1M ctx headroom)
    checkpoint: true, // must pass review before ship
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
    model: 'nvidia/nemotron-3-super-120b-a12b:free', // fast (93 t/s), 1M ctx
    provider: 'openrouter',
    agentFlag: 'build-fixer',
    maxTokens: 32768,
    allowedTasks: [
      'code-build',
      'code-review',
      'e2e-test',
    ],
  },

  researcher: {
    role: 'researcher',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
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
    model: 'poolside/laguna-m.1:free',
    provider: 'openrouter',
    agentFlag: 'reviewer',
    maxTokens: 8192,
    allowedTasks: ['code-review'],
  },

  security: {
    role: 'security',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    agentFlag: 'security',
    maxTokens: 8192,
    allowedTasks: ['security-audit'],
  },

  perf: {
    role: 'perf',
    model: 'poolside/laguna-m.1:free',
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
    model: 'poolside/laguna-m.1:free',
    provider: 'openrouter',
    agentFlag: 'e2e',
    maxTokens: 8192,
    allowedTasks: ['e2e-test'],
  },

  explorer: {
    role: 'explorer',
    model: 'google/gemma-4-31b-it:free',
    provider: 'openrouter',
    agentFlag: 'explorer',
    maxTokens: 8192,
    allowedTasks: ['codebase-explore'],
  },

  refactor: {
    role: 'refactor',
    model: 'poolside/laguna-m.1:free', // 262K ctx, solid code model
    provider: 'openrouter',
    agentFlag: 'refactor',
    maxTokens: 16384,
    allowedTasks: ['refactor'],
  },

  fast: {
    role: 'fast',
    model: 'poolside/laguna-xs-2.1:free', // fastest free coder (109 t/s) for narrow fixes
    provider: 'openrouter',
    agentFlag: 'fast',
    maxTokens: 8192,
    allowedTasks: [
      'code-build',
      'refactor',
      'docs-copy',
    ],
  },

  trading: {
    role: 'trading',
    model: 'poolside/laguna-m.1:free',
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
    model: 'nvidia/nemotron-3-super-120b-a12b:free', // 1M ctx, 93 t/s — fast dispatch
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
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free', // 1M ctx, frontier reasoning for long builds
    provider: 'openrouter',
    agentFlag: 'kanban-worker',
    maxTokens: 32768, // raised for autonomous/long builds
    checkpoint: true, // must pass review before ship
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
      'content-review', // content (non-code) review only — code-review routes to `reviewer`
      'docs-copy',
    ],
  },

  // ─── FRONTIER REASONING TIER ───────────────────────────────────
  // Free-tier analog of the article's "biggest model on the hardest build."
  // Nemotron 3 Ultra 550B is the largest free model (1M ctx) — used for the
  // hardest sub-problems that the 405B planner can't crack in one pass.
  reasoning: {
    role: 'reasoning',
    model: 'nvidia/nemotron-3-ultra-550b-a55b:free',
    provider: 'openrouter',
    agentFlag: 'reasoning',
    maxTokens: 16384,
    allowedTasks: [
      'deep-reasoning',
      'deep-research',
      'data-analysis',
    ],
  },

  // ─── AUTONOMOUS PIPELINE ───────────────────────────────────────
  // "Ships while you sleep." Self-driving orchestration: takes a goal,
  // decomposes, dispatches builders, enforces a checkpoint, and ships.
  // Uses the biggest free model (Nemotron 3 Ultra 550B) for the
  // autonomous planning/dispatch loop.
  pipeline: {
    role: 'pipeline',
    model: 'nvidia/nemotron-3-super-120b-a12b:free', // 1M ctx, 93 t/s — completes long autonomous runs
    provider: 'openrouter',
    agentFlag: 'pipeline',
    maxTokens: 16384,
    checkpoint: true, // autonomous runs MUST checkpoint before ship
    allowedTasks: ['autonomous-pipeline'],
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
  'code-review':         'reviewer',          // FIX: was content-editor — code review is a code role
  'content-review':      'content-editor',    // NEW: explicit non-code review lane
  'security-audit':      'security',
  'performance-audit':   'perf',
  'docs-copy':           'marketing',
  'sdr-outreach':        'sdr',
  'e2e-test':            'e2e',
  'codebase-explore':    'explorer',
  'refactor':            'refactor',
  'deep-reasoning':      'reasoning',         // NEW: frontier tier for hardest sub-problems
  'autonomous-pipeline': 'pipeline',          // NEW: self-driving build→checkpoint→ship
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
 * Returns true if the role can SHIP and therefore must pass a review
 * checkpoint before going live. Encodes "checkpoint after every piece."
 */
export function requiresCheckpoint(role: AgentRole): boolean {
  return MODEL_GRAPH[role].checkpoint === true;
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

export interface AllowedModel {
  value: string;
  label: string;
  speechEnabled?: boolean;
}

export const ALLOWED_MODELS: AllowedModel[] = [
  // ─── Speech-enabled models (MiMo direct API) ───
  { value: 'mimo-v2.5', label: 'MiMo v2.5', speechEnabled: true },
  { value: 'mimo-v2.5-pro', label: 'MiMo v2.5 Pro', speechEnabled: true },
  { value: 'mimo-v2.5-asr', label: 'MiMo v2.5 ASR', speechEnabled: true },
  { value: 'mimo-v2.5-tts', label: 'MiMo v2.5 TTS', speechEnabled: true },
  { value: 'mimo-v2.5-tts-voiceclone', label: 'MiMo v2.5 Voice Clone', speechEnabled: true },
  { value: 'mimo-v2.5-tts-voicedesign', label: 'MiMo v2.5 Voice Design', speechEnabled: true },
  // ─── Text-only models ───
  { value: 'tencent/hy3:free', label: 'Tencent Hy3 (free)' },
  { value: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron 3 Ultra (free)' },
  { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron 3 Super (free)' },
  { value: 'poolside/laguna-m.1:free', label: 'Laguna M.1 (free)' },
  { value: 'poolside/laguna-xs-2.1:free', label: 'Laguna XS 2.1 (free)' },
  { value: 'cohere/north-mini-code:free', label: 'North Mini Code (free)' },
  { value: 'nvidia/nemotron-3-nano-30b-a3b:free', label: 'Nemotron 3 Nano 30B A3B (free)' },
  { value: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Omni (free)' },
  { value: 'nvidia/nemotron-nano-12b-v2-vl:free', label: 'Nemotron Nano 12B 2 VL (free)' },
  { value: 'nvidia/nemotron-nano-9b-v2:free', label: 'Nemotron Nano 9B V2 (free)' },
  { value: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B (free)' },
  { value: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B A4B (free)' },
  { value: 'openai/gpt-oss-20b:free', label: 'gpt-oss-20b (free)' },
  { value: 'nvidia/nemotron-3.5-content-safety:free', label: 'Nemotron 3.5 Content Safety (free)' },
  { value: 'openai/gpt-4o-mini', label: 'GPT-4o-mini (paid)' },
];

/**
 * Unique models for the ModelSelector dropdown.
 * Deduplicates by model name and aggregates agent roles.
 */
export const UNIQUE_MODELS: Array<{
  value: string;
  label: string;
  agents: AgentRole[];
}> = ALLOWED_MODELS.map((item) => {
  const agents: AgentRole[] = [];
  for (const cfg of Object.values(MODEL_GRAPH)) {
    if (cfg.role === 'orchestrator') continue;
    if (cfg.model === item.value) {
      agents.push(cfg.role);
    }
  }
  return {
    value: item.value,
    label: item.label,
    agents,
  };
});

/**
 * Speech-enabled models only — used by Jarvis voice panel
 * to filter the model selector to models that support TTS/ASR.
 */
export const SPEECH_MODELS = UNIQUE_MODELS.filter(
  (m) => ALLOWED_MODELS.find((a) => a.value === m.value)?.speechEnabled === true
);

/**
 * TTS-only models — used by Jarvis voice panel for text-to-speech selection.
 */
export const TTS_MODELS = UNIQUE_MODELS.filter(
  (m) => {
    const allowed = ALLOWED_MODELS.find((a) => a.value === m.value);
    return allowed?.speechEnabled === true && 
           (m.value.includes('-tts') || 
            m.value === 'mimo-v2.5' ||  // base mimo can do TTS via audio modality
            m.value === 'mimo-v2.5-pro');
  }
);

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
