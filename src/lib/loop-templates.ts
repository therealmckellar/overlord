/**
 * Loop Templates — Reusable multi-step agent loop patterns
 */

export interface LoopStep {
  id: string;
  name: string;
  description: string;
  model: string;
  prompt: string;
  outputVar: string;
  tools?: string[];
}

export interface LoopTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: LoopStep[];
  tags: string[];
}

export const LOOP_TEMPLATES: LoopTemplate[] = [
  {
    id: 'iterate_refine',
    name: 'Iterate & Refine',
    description: 'Generate a draft, then iteratively refine it based on criteria',
    icon: '🔄',
    tags: ['writing', 'coding', 'research'],
    steps: [
      { id: 's1', name: 'Generate Draft', description: 'Create initial output', model: 'openai/gpt-oss-120b:free', prompt: 'Generate {{output_type}} based on: {{input}}', outputVar: 'draft' },
      { id: 's2', name: 'Critique', description: 'Evaluate against criteria', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', prompt: 'Critique this {{output_type}} against these criteria: {{criteria}}. Output specific improvements.', outputVar: 'critique' },
      { id: 's3', name: 'Refine', description: 'Apply improvements', model: 'openai/gpt-oss-120b:free', prompt: 'Apply these improvements to the original: {{draft}}. Improvements: {{critique}}', outputVar: 'final' },
    ],
  },
  {
    id: 'ab_test',
    name: 'A/B Test Copy',
    description: 'Generate two variants, evaluate, pick winner',
    icon: '🧪',
    tags: ['sales', 'writing', 'marketing'],
    steps: [
      { id: 's1', name: 'Variant A', description: 'Generate first variant', model: 'openai/gpt-oss-120b:free', prompt: 'Write {{output_type}} variant A: {{input}}', outputVar: 'variant_a' },
      { id: 's2', name: 'Variant B', description: 'Generate second variant with different approach', model: 'moonshotai/kimi-k2.6:free', prompt: 'Write {{output_type}} variant B with a completely different approach: {{input}}', outputVar: 'variant_b' },
      { id: 's3', name: 'Judge', description: 'Evaluate both variants', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', prompt: 'Judge which variant is better and why:\nA: {{variant_a}}\nB: {{variant_b}}\nCriteria: {{criteria}}', outputVar: 'winner' },
    ],
  },
  {
    id: 'scrape_enrich',
    name: 'Scrape & Enrich',
    description: 'Extract data from URLs, then enrich with additional research',
    icon: '🔍',
    tags: ['sales', 'research', 'enrichment'],
    steps: [
      { id: 's1', name: 'Scrape', description: 'Extract data from target', model: 'nex-agi/nex-n2-pro:free', prompt: 'Scrape and extract key data from: {{url}}', outputVar: 'raw_data', tools: ['web_search', 'browser'] },
      { id: 's2', name: 'Enrich', description: 'Add missing context', model: 'openai/gpt-oss-120b:free', prompt: 'Enrich this data with additional context: {{raw_data}}. Find: company size, tech stack, key contacts, recent news.', outputVar: 'enriched', tools: ['web_search'] },
      { id: 's3', name: 'Format', description: 'Format for output', model: 'google/gemma-4-31b-it:free', prompt: 'Format this enriched data as a structured summary: {{enriched}}', outputVar: 'output' },
    ],
  },
  {
    id: 'write_review',
    name: 'Write & Review',
    description: 'Write content, review for quality, fix issues',
    icon: '✍️',
    tags: ['writing', 'content', 'quality'],
    steps: [
      { id: 's1', name: 'Write', description: 'Create content', model: 'openai/gpt-oss-120b:free', prompt: 'Write {{content_type}}: {{brief}}', outputVar: 'draft' },
      { id: 's2', name: 'Review', description: 'Quality check', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', prompt: 'Review this {{content_type}} for: accuracy, clarity, tone, grammar, completeness. List specific fixes needed:\n{{draft}}', outputVar: 'review' },
      { id: 's3', name: 'Fix', description: 'Apply fixes', model: 'openai/gpt-oss-120b:free', prompt: 'Apply these fixes to the draft:\nDraft: {{draft}}\nFixes: {{review}}', outputVar: 'final' },
    ],
  },
  {
    id: 'deep_research',
    name: 'Deep Research',
    description: 'Multi-source research with synthesis',
    icon: '🔬',
    tags: ['research', 'analysis'],
    steps: [
      { id: 's1', name: 'Initial Search', description: 'Broad research scan', model: 'nex-agi/nex-n2-pro:free', prompt: 'Research this topic thoroughly: {{topic}}. Find key facts, statistics, and sources.', outputVar: 'initial_findings', tools: ['web_search'] },
      { id: 's2', name: 'Deep Dive', description: 'Go deeper on key areas', model: 'openai/gpt-oss-120b:free', prompt: 'Based on these initial findings, identify gaps and research deeper: {{initial_findings}}', outputVar: 'deep_findings', tools: ['web_search'] },
      { id: 's3', name: 'Synthesize', description: 'Combine findings', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', prompt: 'Synthesize into a comprehensive report with executive summary, key findings, and recommendations:\nInitial: {{initial_findings}}\nDeep: {{deep_findings}}', outputVar: 'report' },
    ],
  },
  {
    id: 'code_build_test',
    name: 'Build → Test → Fix',
    description: 'Build code, test it, fix failures',
    icon: '💻',
    tags: ['coding', 'development'],
    steps: [
      { id: 's1', name: 'Build', description: 'Implement the feature', model: 'openai/gpt-oss-120b:free', prompt: 'Implement: {{spec}}', outputVar: 'code', tools: ['terminal', 'file_read', 'file_write'] },
      { id: 's2', name: 'Test', description: 'Run tests', model: 'poolside/laguna-m.1:free', prompt: 'Run tests for the implementation. Report any failures: {{code}}', outputVar: 'test_results', tools: ['terminal'] },
      { id: 's3', name: 'Fix', description: 'Fix test failures', model: 'openai/gpt-oss-120b:free', prompt: 'Fix these test failures:\nCode: {{code}}\nTest results: {{test_results}}', outputVar: 'fixed_code', tools: ['terminal', 'file_read', 'file_write'] },
    ],
  },
  {
    id: 'sdr_outreach',
    name: 'SDR Outreach Loop',
    description: 'Research prospect, write outreach, optimize',
    icon: '💰',
    tags: ['sales', 'sdr', 'outreach'],
    steps: [
      { id: 's1', name: 'Research Prospect', description: 'Gather intel on target', model: 'nex-agi/nex-n2-pro:free', prompt: 'Research this prospect for personalized outreach: {{prospect_info}}', outputVar: 'prospect_intel', tools: ['web_search'] },
      { id: 's2', name: 'Write Outreach', description: 'Craft personalized message', model: 'openai/gpt-oss-120b:free', prompt: 'Write a personalized cold email based on this intel: {{prospect_intel}}\nProduct: {{product}}\nTone: professional but conversational', outputVar: 'email_draft' },
      { id: 's3', name: 'Optimize', description: 'Polish for maximum response', model: 'nvidia/nemotron-3-ultra-550b-a55b:free', prompt: 'Optimize this email for maximum response rate. Make it shorter, more specific, add a clear CTA:\n{{email_draft}}', outputVar: 'final_email' },
    ],
  },
  {
    id: 'transform_chain',
    name: 'Transform Chain',
    description: 'Sequential data transformation pipeline',
    icon: '⛓️',
    tags: ['operations', 'data', 'pipeline'],
    steps: [
      { id: 's1', name: 'Extract', description: 'Extract raw data', model: 'nex-agi/nex-n2-pro:free', prompt: 'Extract structured data from: {{raw_input}}', outputVar: 'extracted' },
      { id: 's2', name: 'Transform', description: 'Transform to target format', model: 'openai/gpt-oss-120b:free', prompt: 'Transform this data into {{target_format}}: {{extracted}}', outputVar: 'transformed' },
      { id: 's3', name: 'Validate', description: 'Validate output', model: 'cohere/north-mini-code:free', prompt: 'Validate this output meets the schema requirements: {{transformed}}. Fix any issues.', outputVar: 'validated' },
    ],
  },
];
