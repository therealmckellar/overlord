/**
 * Zustand Store — Prompt Library
 * CRUD for reusable prompt templates with categories and variables
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: PromptCategory;
  content: string;
  variables: string[];       // e.g. ['role', 'task', 'context']
  isBuiltIn: boolean;
  createdAt: number;
  updatedAt: number;
}

export type PromptCategory =
  | 'research'
  | 'writing'
  | 'coding'
  | 'sales'
  | 'analysis'
  | 'operations'
  | 'creative';

export const CATEGORY_LABELS: Record<PromptCategory, string> = {
  research: '🔬 Research',
  writing: '✍️ Writing',
  coding: '💻 Coding',
  sales: '💰 Sales',
  analysis: '📊 Analysis',
  operations: '⚙️ Operations',
  creative: '🎨 Creative',
};

export const CATEGORY_COLORS: Record<PromptCategory, string> = {
  research: '#3b82f6',
  writing: '#8b5cf6',
  coding: '#10b981',
  sales: '#f59e0b',
  analysis: '#06b6d4',
  operations: '#6b7280',
  creative: '#ec4899',
};

// Extract {{variable}} placeholders from content
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{(\w+)\}\}/g) || [];
  return [...new Set(matches.map((m) => m.slice(2, -2)))];
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

// ── Built-in starter templates ──────────────────────────────────────────
const BUILT_IN_TEMPLATES: Omit<PromptTemplate, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'builtin_research_deep',
    name: 'Deep Research',
    description: 'Thorough multi-source research on any topic',
    category: 'research',
    content: 'You are a research analyst specializing in {{domain}}. Conduct deep research on: {{topic}}. Provide: (1) Executive summary, (2) Key findings with sources, (3) Market/competitive landscape, (4) Risks and opportunities, (5) Actionable recommendations. Use only verified facts. Cite sources.',
    variables: ['domain', 'topic'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_research_competitor',
    name: 'Competitor Analysis',
    description: 'Analyze competitors in a specific market',
    category: 'research',
    content: 'Analyze the competitive landscape for {{company_type}} in {{market}}. For each major competitor: (1) Company overview and positioning, (2) Product/service offering, (3) Pricing model, (4) Strengths and weaknesses, (5) Market share estimate. Conclude with strategic recommendations.',
    variables: ['company_type', 'market'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_writing_cold_email',
    name: 'Cold Email Sequence',
    description: 'B2B cold outreach email sequence',
    category: 'sales',
    content: 'Write a 4-email cold outreach sequence for {{product}} targeting {{persona}} at {{company_type}}. Each email should: (1) Be under 120 words, (2) Lead with a pain point, (3) Include one specific proof point, (4) End with a soft CTA. Space emails 3 days apart. Tone: professional but conversational. No buzzwords.',
    variables: ['product', 'persona', 'company_type'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_writing_blog_post',
    name: 'Blog Post',
    description: 'SEO-optimized long-form blog post',
    category: 'writing',
    content: 'Write a {{length}} blog post about {{topic}} targeting {{audience}}. Requirements: (1) Compelling headline with target keyword, (2) Meta description under 155 chars, (3) H2/H3 structure, (4) Include statistics or data points, (5) Actionable takeaways, (6) Internal linking suggestions. Tone: authoritative but accessible.',
    variables: ['length', 'topic', 'audience'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_coding_code_review',
    name: 'Code Review',
    description: 'Thorough code review with security focus',
    category: 'coding',
    content: 'Review the following {{language}} code for: (1) Correctness — does it do what it claims?, (2) Security — SQL injection, XSS, hardcoded secrets, unvalidated input, (3) Performance — N+1 queries, unnecessary allocations, missing indexes, (4) Readability — naming, function length, nesting, (5) Architecture — separation of concerns, tight coupling, (6) Test coverage gaps. Rate severity: 🔴 Critical, 🟡 Warning, 🟢 Suggestion.',
    variables: ['language'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_coding_debug',
    name: 'Debug Assistant',
    description: 'Systematic debugging from error to root cause',
    category: 'coding',
    content: 'You are a debugging specialist. Analyze this {{language}} error: {{error}} in this code: {{code}}. Follow this process: (1) Identify the exact error type and location, (2) Trace the call stack to find the root cause, (3) Explain WHY it happened (not just WHAT), (4) Provide the minimal fix, (5) Suggest how to prevent this class of bug. Do not guess — reason from the code.',
    variables: ['language', 'error', 'code'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_sales_pitch',
    name: 'Sales Pitch',
    description: 'One-page sales pitch or one-pager',
    category: 'sales',
    content: 'Create a compelling one-page sales pitch for {{product}} targeting {{buyer}} in the {{industry}} industry. Structure: (1) Hook — the #1 pain point, (2) Solution — how {{product}} solves it, (3) Proof — 3 specific results/outcomes, (4) How it works — 3-step process, (5) Pricing — transparent tiers, (6) Call to action — next step with urgency. Keep each section under 40 words.',
    variables: ['product', 'buyer', 'industry'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_sales_objection',
    name: 'Objection Handler',
    description: 'Generate responses to common sales objections',
    category: 'sales',
    content: 'For {{product}} sold to {{buyer}}, generate responses to these 5 common objections: (1) "Too expensive", (2) "We already use {{competitor}}", (3) "Not a priority right now", (4) "Need to talk to my team", (5) "Can you prove ROI?". For each: acknowledge → reframe → provide proof → ask a closing question. Tone: consultative, never pushy.',
    variables: ['product', 'buyer', 'competitor'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_analysis_swot',
    name: 'SWOT Analysis',
    description: 'Structured SWOT analysis for any business or project',
    category: 'analysis',
    content: 'Conduct a SWOT analysis for {{subject}} in the context of {{context}}. For each quadrant, provide: (1) 5-7 specific items, (2) Each item must be actionable, not vague, (3) Rank by impact (high→low). Then provide: (1) Top 3 strategic priorities from this SWOT, (2) Key risks to monitor, (3) Quick wins to execute this week.',
    variables: ['subject', 'context'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_analysis_data',
    name: 'Data Analysis',
    description: 'Analyze data and extract insights',
    category: 'analysis',
    content: 'Analyze the following {{data_type}} data: {{data}}. Provide: (1) Key statistics (mean, median, range, outliers), (2) Top 3 patterns or trends, (3) Anomalies that need investigation, (4) Actionable insights ranked by business impact, (5) Recommended next steps. If data is insufficient, say so and specify what additional data is needed.',
    variables: ['data_type', 'data'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_ops_sop',
    name: 'SOP Writer',
    description: 'Write standard operating procedures',
    category: 'operations',
    content: 'Write an SOP for {{process_name}} in a {{business_type}}. Include: (1) Purpose and scope, (2) Prerequisites and tools, (3) Step-by-step procedure (numbered, imperative mood, each step starts with a verb), (4) Quality checkpoints, (5) Common errors and how to avoid them, (6) Estimated time per step, (7) Escalation path for exceptions. Format for someone with no prior experience.',
    variables: ['process_name', 'business_type'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_ops_checklist',
    name: 'Launch Checklist',
    description: 'Pre-launch checklist for any product or campaign',
    category: 'operations',
    content: 'Create a launch checklist for {{launch_type}} going live on {{date}}. Categories: (1) Technical readiness, (2) Content and assets, (3) Legal/compliance, (4) Marketing and comms, (5) Support and monitoring, (6) Rollback plan. For each item: task name, owner role, estimated time, blocking/non-blocking. Mark critical-path items with 🔴.',
    variables: ['launch_type', 'date'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_creative_brainstorm',
    name: 'Idea Brainstorm',
    description: 'Generate creative ideas within constraints',
    category: 'creative',
    content: 'Brainstorm {{count}} creative ideas for {{challenge}} with these constraints: {{constraints}}. For each idea: (1) One-line name, (2) How it works (2-3 sentences), (3) Why it could work (mechanism), (4) Biggest risk, (5) Quick test to validate. Think laterally. No safe/boring ideas. Mix short-term and long-term.',
    variables: ['count', 'challenge', 'constraints'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_creative_naming',
    name: 'Product Naming',
    description: 'Generate product or feature names',
    category: 'creative',
    content: 'Generate {{count}} name options for {{product_description}}. For each name provide: (1) The name, (2) Rationale — why it works, (3) Domain availability guess, (4) Vibe/category (descriptive, suggestive, abstract, acronym). Mix styles. Avoid: (1) Names already used by major companies, (2) Overused startup suffixes (-ify, -ly, -io), (3) Hard-to-spell or hard-to-pronounce words.',
    variables: ['count', 'product_description'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_research_market_sizing',
    name: 'Market Sizing',
    description: 'TAM/SAM/SOM market sizing analysis',
    category: 'research',
    content: 'Conduct a market sizing analysis for {{product}} in the {{geography}} market. Use: (1) Top-down approach (industry reports, census data), (2) Bottom-up approach (customer count × price), (3) Value chain analysis. Calculate TAM, SAM, and SOM. Show your math. State all assumptions. Provide confidence levels (high/medium/low) for each estimate.',
    variables: ['product', 'geography'],
    isBuiltIn: true,
  },
  {
    id: 'builtin_writing_social',
    name: 'Social Media Thread',
    description: 'Twitter/LinkedIn thread from long-form content',
    category: 'writing',
    content: 'Convert this content into a {{platform}} thread ({{count}} posts): {{source_content}}. Rules: (1) Hook post must stop the scroll — bold claim or counterintuitive insight, (2) Each post under 280 chars, (3) One idea per post, (4) Number posts (1/{{count}}, 2/{{count}}, etc.), (5) End with a CTA, (6) No hashtags in the middle — max 3 at the end. Preserve the original insight but make it punchy.',
    variables: ['platform', 'count', 'source_content'],
    isBuiltIn: true,
  },
];

// ── Prompt Studio types ──────────────────────────────────────────

export interface GeneratedPrompt {
  id: string;
  prompt: string;
  variables: string[];
  model: string;
  intent: string;
  category: PromptCategory;
  createdAt: number;
}

export interface ArenaModelResult {
  model: string;
  response: string;
  tokensUsed: number;
  latencyMs: number;
  error?: string;
}

export interface ArenaRun {
  id: string;
  prompt: string;
  models: string[];
  aggregatorModel: string;
  results: ArenaModelResult[];
  aggregation: { response: string; model: string; tokensUsed: number } | null;
  totalTokens: number;
  createdAt: number;
}

export type StudioTab = 'library' | 'generator' | 'arena';

// ── Available models for selection ────────────────────────────────

export const ARENA_MODELS = [
  { value: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B', category: 'flagship' },
  { value: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron Ultra 550B', category: 'heavy' },
  { value: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B', category: 'heavy' },
  { value: 'cognitivecomputations/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B', category: 'research' },
  { value: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B', category: 'balanced' },
  { value: 'google/gemma-4-26b-a4b-it:free', label: 'Gemma 4 26B', category: 'balanced' },
  { value: 'nvidia/nemotron-3-super-120b-a12b:free', label: 'Nemotron Super 120B', category: 'heavy' },
  { value: 'poolside/laguna-xs-2.1:free', label: 'Laguna XS 2.1', category: 'fast' },
  { value: 'poolside/laguna-m.1:free', label: 'Laguna M.1', category: 'fixer' },
  { value: 'cohere/north-mini-code:free', label: 'North Mini Code', category: 'fast' },
  { value: 'openai/gpt-oss-20b:free', label: 'GPT-OSS 20B', category: 'light' },
  { value: 'meta-llama/llama-3.2-3b-instruct:free', label: 'Llama 3.2 3B', category: 'light' },
] as const;

export const GENERATOR_MODELS = [
  { value: 'google/gemma-4-31b-it:free', label: 'Gemma 4 31B' },
  { value: 'openai/gpt-oss-120b:free', label: 'GPT-OSS 120B' },
  { value: 'nvidia/nemotron-3-ultra-550b-a55b:free', label: 'Nemotron Ultra 550B' },
  { value: 'cognitivecomputations/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B' },
] as const;

interface PromptState {
  templates: PromptTemplate[];
  searchQuery: string;
  selectedCategory: PromptCategory | 'all';

  // Studio state
  studioTab: StudioTab;
  generatedPrompts: GeneratedPrompt[];
  arenaRuns: ArenaRun[];
  isGenerating: boolean;
  isRunningArena: boolean;

  // Actions
  addTemplate: (template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'isBuiltIn' | 'variables'>) => PromptTemplate;
  updateTemplate: (id: string, updates: Partial<PromptTemplate>) => void;
  deleteTemplate: (id: string) => void;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (category: PromptCategory | 'all') => void;
  getFilteredTemplates: () => PromptTemplate[];
  setStudioTab: (tab: StudioTab) => void;
  setGenerating: (v: boolean) => void;
  setRunningArena: (v: boolean) => void;
  addGeneratedPrompt: (gp: Omit<GeneratedPrompt, 'id' | 'createdAt'>) => GeneratedPrompt;
  addArenaRun: (run: Omit<ArenaRun, 'id' | 'createdAt'>) => ArenaRun;
  deleteArenaRun: (id: string) => void;
  deleteGeneratedPrompt: (id: string) => void;
}

export const usePromptStore = create<PromptState>()(
  persist(
    (set, get) => ({
      templates: BUILT_IN_TEMPLATES.map((t) => ({
        ...t,
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now() - 86400000,
      })),
      searchQuery: '',
      selectedCategory: 'all',
      studioTab: 'library',
      generatedPrompts: [],
      arenaRuns: [],
      isGenerating: false,
      isRunningArena: false,

      setStudioTab: (tab) => set({ studioTab: tab }),
      setGenerating: (v) => set({ isGenerating: v }),
      setRunningArena: (v) => set({ isRunningArena: v }),

      addGeneratedPrompt: (gp) => {
        const newGp: GeneratedPrompt = { ...gp, id: generateId(), createdAt: Date.now() };
        set((state) => ({ generatedPrompts: [newGp, ...state.generatedPrompts] }));
        return newGp;
      },

      addArenaRun: (run) => {
        const newRun: ArenaRun = { ...run, id: generateId(), createdAt: Date.now() };
        set((state) => ({ arenaRuns: [newRun, ...state.arenaRuns] }));
        return newRun;
      },

      deleteArenaRun: (id) => set((state) => ({ arenaRuns: state.arenaRuns.filter((r) => r.id !== id) })),
      deleteGeneratedPrompt: (id) => set((state) => ({ generatedPrompts: state.generatedPrompts.filter((g) => g.id !== id) })),

      addTemplate: (template) => {
        const content = template.content;
        const variables = extractVariables(content);
        const newTemplate: PromptTemplate = {
          ...template,
          id: generateId(),
          variables,
          isBuiltIn: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ templates: [...state.templates, newTemplate] }));
        return newTemplate;
      },

      updateTemplate: (id, updates) =>
        set((state) => ({
          templates: state.templates.map((t) =>
            t.id === id
              ? {
                  ...t,
                  ...updates,
                  variables: updates.content ? extractVariables(updates.content) : t.variables,
                  updatedAt: Date.now(),
                }
              : t
          ),
        })),

      deleteTemplate: (id) =>
        set((state) => ({
          templates: state.templates.filter((t) => t.id !== id),
        })),

      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),

      getFilteredTemplates: () => {
        const { templates, searchQuery, selectedCategory } = get();
        let filtered = templates;
        if (selectedCategory !== 'all') {
          filtered = filtered.filter((t) => t.category === selectedCategory);
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.name.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.content.toLowerCase().includes(q)
          );
        }
        return filtered;
      },
    }),
    {
      name: 'overlord-prompt-store',
      partialize: (state) => ({ templates: state.templates.slice(0, 50) }),
    }
  )
);
