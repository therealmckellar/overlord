import { diffLines, Change } from 'diff';

export type AgreementLevel = 'identical' | 'similar' | 'different';

export interface ComparisonResult {
  agreementRate: number;
  level: AgreementLevel;
  diffs: {
    line: number;
    type: 'addition' | 'deletion' | 'change';
    text: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  criticalDisagreements: string[];
  recommendation: string;
}

const CRITICAL_KEYWORDS = [
  'security', 'vulnerability', 'auth', 'architecture', 'database', 
  'schema', 'performance', 'scaling', 'data model', 'api contract', 
  'critical', 'breaking change', 'deprecated'
];

export function compareOpinions(output1: string, output2: string): ComparisonResult {
  const diff = diffLines(output1, output2);
  const criticals: string[] = [];
  let matches = 0;
  let totalLines = 0;

  const lines1 = output1.split('\n');
  const lines2 = output2.split('\n');
  totalLines = Math.max(lines1.length, lines2.length);

  const diffResults: ComparisonResult['diffs'] = [];
  let lineIdx = 1;

  diff.forEach((part: Change) => {
    const lines = part.value.split('\n').filter(l => l.trim() !== '');
    
    if (part.added) {
      lines.forEach(l => {
        const severity = CRITICAL_KEYWORDS.some(kw => l.toLowerCase().includes(kw)) ? 'high' : 'low';
        if (severity === 'high') {
          criticals.push("Model 2 suggests: " + l.substring(0, 100) + "...");
        }
        diffResults.push({ line: lineIdx, type: 'addition', text: l, severity });
        lineIdx++;
      });
    } else if (part.removed) {
      lines.forEach(l => {
        const severity = CRITICAL_KEYWORDS.some(kw => l.toLowerCase().includes(kw)) ? 'high' : 'low';
        if (severity === 'high') {
          criticals.push("Model 1 suggests: " + l.substring(0, 100) + "...");
        }
        diffResults.push({ line: lineIdx, type: 'deletion', text: l, severity });
        lineIdx++;
      });
    } else {
      matches += lines.length;
      lineIdx += lines.length;
    }
  });

  const agreementRate = totalLines === 0 ? 1 : matches / totalLines;
  let level: AgreementLevel = 'different';
  if (agreementRate > 0.95) level = 'identical';
  else if (agreementRate > 0.6) level = 'similar';

  let recommendation = 'Both models agree on the approach.';
  if (level === 'different') {
    recommendation = 'Significant differences found. Manual review required, especially for flagged critical items.';
  } else if (level === 'similar') {
    recommendation = 'Models are mostly aligned with minor variations.';
  }

  if (criticals.length > 0) {
    recommendation = "CRITICAL DISAGREEMENTS FOUND: " + criticals.length + " items. Prioritize resolving these contradictions.";
  }

  return {
    agreementRate,
    level,
    diffs: diffResults,
    criticalDisagreements: criticals,
    recommendation,
  };
}
