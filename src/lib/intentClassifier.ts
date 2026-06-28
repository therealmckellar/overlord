export type WorkflowMode = 'PLAN' | 'ASK' | 'EXECUTE' | 'REVIEW';

interface IntentMatch {
  mode: WorkflowMode;
  confidence: number;
}

const MODE_TRIGGERS: Record<WorkflowMode, string[]> = {
  PLAN: [
    'plan', 'design', 'architect', 'decide', 'what should', 
    'how should we approach', 'strategy', 'roadmap', 'ADR'
  ],
  ASK: [
    'what is', 'explain', 'why', 'how does', 'tell me', 
    'where is', 'what does', 'clarify'
  ],
  EXECUTE: [
    'build', 'fix', 'implement', 'create', 'add', 'write', 
    'change', 'update', 'deploy', 'refactor'
  ],
  REVIEW: [
    'review', 'audit', 'test', 'check', 'validate', 
    'is this good', 'what\'s wrong', 'security scan', 'quality'
  ],
};

export function classifyIntent(text: string): IntentMatch {
  const normalized = text.toLowerCase();
  let bestMode: WorkflowMode = 'EXECUTE'; // Default mode
  let maxMatches = 0;

  for (const [mode, triggers] of Object.entries(MODE_TRIGGERS)) {
    const matches = triggers.filter(trigger => normalized.includes(trigger)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestMode = mode as WorkflowMode;
    }
  }

  // Confidence based on matches relative to trigger set size
  const confidence = maxMatches > 0 
    ? Math.min(1, (maxMatches * 2) / (MODE_TRIGGERS[bestMode].length / 2)) 
    : 0.1;

  return { mode: bestMode, confidence };
}
