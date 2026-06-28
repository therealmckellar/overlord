export type DriftType = 'out-of-bounds' | 'extra-feature' | 'unrequested-refactor';

export interface ScopeAnalysis {
  hasDrift: boolean;
  driftType?: DriftType;
  proposedChange?: string;
  reason?: string;
  confidence: number;
}

const DRIFT_PHRASES = [
  "I'll also",
  "while I'm at it",
  "might as well",
  "additionally",
  "as a bonus",
  "you might also want",
  "I noticed a small bug",
  "I've taken the liberty of",
  "I decided to improve"
];

export function analyzeScopeDrift(
  originalScope: string,
  actualOutput: string,
  modifiedFiles: string[] = [],
  declaredFiles: string[] = [],
  estimatedTime: number = 0,
  actualTime: number = 0
): ScopeAnalysis {
  // 1. Pattern detection for drift phrases
  const lowerOutput = actualOutput.toLowerCase();
  for (const phrase of DRIFT_PHRASES) {
    if (lowerOutput.includes(phrase.toLowerCase())) {
      return {
        hasDrift: true,
        driftType: 'extra-feature',
        proposedChange: phrase,
        reason: `Detected drift phrase: "${phrase}"`,
        confidence: 0.9
      };
    }
  }

  // 2. Structural drift (files outside declared scope)
  const undeclaredFiles = modifiedFiles.filter(file => !declaredFiles.includes(file));
  if (undeclaredFiles.length > 0) {
    return {
      hasDrift: true,
      driftType: 'out-of-bounds',
      proposedChange: `Modified undeclared files: ${undeclaredFiles.join(', ')}`,
      reason: 'Agent modified files outside of the explicitly declared scope.',
      confidence: 0.8
    };
  }

  // 3. Time drift
  if (estimatedTime > 0 && actualTime > estimatedTime * 1.5) {
    return {
      hasDrift: true,
      driftType: 'unrequested-refactor',
      proposedChange: `Time spent: ${actualTime}ms (Estimated: ${estimatedTime}ms)`,
      reason: 'Significant time deviation suggests unrequested refactoring or complexity drift.',
      confidence: 0.6
    };
  }

  return {
    hasDrift: false,
    confidence: 1.0
  };
}
