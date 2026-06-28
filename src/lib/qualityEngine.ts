export type AssertionType = 
  | 'STRUCTURE' 
  | 'LENGTH' 
  | 'FORMAT' 
  | 'FACTUALITY' 
  | 'COMPLETENESS' 
  | 'NO_BANNED' 
  | 'CONDITIONAL';

export interface AssertionRule {
  id: string;
  type: AssertionType;
  params: any;
  weight?: number;
  description: string;
}

export interface ValidationResult {
  ruleId: string;
  passed: boolean;
  reason: string;
  weight: number;
}

export interface QualityReport {
  score: number;
  results: ValidationResult[];
  timestamp: string;
}

export function validateOutput(output: string, rules: AssertionRule[]): QualityReport {
  const results: ValidationResult[] = [];
  let totalWeight = 0;
  let passingWeight = 0;

  for (const rule of rules) {
    const weight = rule.weight ?? 1;
    totalWeight += weight;
    
    let passed = false;
    let reason = '';

    switch (rule.type) {
      case 'STRUCTURE':
        const required = rule.params.required || [];
        const missing = required.filter((s: string) => !output.includes(s));
        passed = missing.length === 0;
        reason = passed ? 'All required sections present' : `Missing: ${missing.join(', ')}`;
        break;

      case 'LENGTH':
        const { min, max } = rule.params;
        const words = output.trim().split(/\s+/).length;
        passed = words >= (min ?? 0) && words <= (max ?? Infinity);
        reason = `Word count: ${words} (Range: ${min ?? 0}-${max ?? '∞'})`;
        break;

      case 'FORMAT':
        const { regex, json, markdown } = rule.params;
        if (json) {
          try { JSON.parse(output); passed = true; reason = 'Valid JSON'; } 
          catch (e) { passed = false; reason = 'Invalid JSON'; }
        } else if (regex) {
          passed = new RegExp(regex).test(output);
          reason = passed ? 'Matches regex' : 'Does not match regex';
        } else if (markdown) {
          passed = output.includes('#') || output.includes('**') || output.includes('`');
          reason = passed ? 'Valid markdown structure' : 'No markdown formatting detected';
        }
        break;

      case 'FACTUALITY':
        const facts = rule.params.facts || [];
        const missingFacts = facts.filter((f: string) => !output.toLowerCase().includes(f.toLowerCase()));
        passed = missingFacts.length === 0;
        reason = passed ? 'All facts present' : `Missing facts: ${missingFacts.join(', ')}`;
        break;

      case 'COMPLETENESS':
        const topics = rule.params.topics || [];
        const uncovered = topics.filter((t: string) => !output.toLowerCase().includes(t.toLowerCase()));
        passed = uncovered.length === 0;
        reason = passed ? 'All topics covered' : `Uncovered topics: ${uncovered.join(', ')}`;
        break;

      case 'NO_BANNED':
        const banned = rule.params.banned || [];
        const foundBanned = banned.filter((b: string) => output.toLowerCase().includes(b.toLowerCase()));
        passed = foundBanned.length === 0;
        reason = passed ? 'No banned phrases' : `Found: ${foundBanned.join(', ')}`;
        break;

      case 'CONDITIONAL':
        const { ifContains, thenMustContain } = rule.params;
        if (output.includes(ifContains)) {
          passed = output.includes(thenMustContain);
          reason = passed ? 'Condition met' : `Contains "${ifContains}" but missing "${thenMustContain}"`;
        } else {
          passed = true;
          reason = 'Condition not triggered';
        }
        break;
    }

    if (passed) passingWeight += weight;
    results.push({ ruleId: rule.id, passed, reason, weight });
  }

  return {
    score: totalWeight === 0 ? 100 : Math.round((passingWeight / totalWeight) * 100),
    results,
    timestamp: new Date().toISOString()
  };
}
