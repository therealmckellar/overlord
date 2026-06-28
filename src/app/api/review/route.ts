import { NextRequest, NextResponse } from 'next/server';

interface Finding {
  file: string;
  line: number;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  category: 'Security' | 'Bugs' | 'Performance' | 'Readability' | 'Style';
  message: string;
  suggestion: string;
}

const PATTERNS = [
  {
    regex: /(?:api[_-]?key|secret|password|passwd|auth[_-]?token)\s*[:=]\s*["'][^"']+["']/gi,
    severity: 'CRITICAL' as const,
    category: 'Security' as const,
    message: 'Hardcoded secret detected',
    suggestion: 'Move secrets to environment variables or a secret manager.',
  },
  {
    regex: /INSERT\s+INTO\s+.*?\s*=\s*.*?\+.*?\+/gi,
    severity: 'CRITICAL' as const,
    category: 'Security' as const,
    message: 'Potential SQL Injection via string concatenation',
    suggestion: 'Use parameterized queries or an ORM to prevent SQL injection.',
  },
  {
    regex: /\.innerHTML\s*=\s*.*?\+/gi,
    severity: 'CRITICAL' as const,
    category: 'Security' as const,
    message: 'Potential XSS vulnerability via innerHTML',
    suggestion: 'Use textContent or a sanitization library to avoid XSS.',
  },
  {
    regex: /\/\/.*?(TODO|FIXME)/gi,
    severity: 'INFO' as const,
    category: 'Readability' as const,
    message: 'TODO/FIXME comment found',
    suggestion: 'Address the technical debt and remove the comment.',
  },
  {
    regex: /console\.log\(.*?\)/gi,
    severity: 'WARNING' as const,
    category: 'Style' as const,
    message: 'Production console.log detected',
    suggestion: 'Replace with a proper logger or remove in production.',
  },
  {
    regex: /catch\s*\(\s*\)\s*\{\s*\}\s*|catch\s*\([^)]*\)\s*\{\s*\}\s*/gi,
    severity: 'WARNING' as const,
    category: 'Bugs' as const,
    message: 'Empty catch block detected',
    suggestion: 'Implement proper error handling instead of silencing errors.',
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workspaceId, diffText } = body;

    let textToAnalyze = diffText || '';
    let currentFile = 'unknown';

    if (workspaceId) {
      // In a real scenario, we would fetch the diff from the DB or Git
      // For this static analysis mock, we'll assume we get some mock diff data 
      // if diffText isn't provided but workspaceId is.
      textToAnalyze = `// Mock diff for ${workspaceId}\nconst apiKey = "sk-12345";\nconsole.log("test");\ntry { } catch {}`;
    }

    if (!textToAnalyze) {
      return NextResponse.json({ error: 'No content to analyze' }, { status: 400 });
    }

    const findings: Finding[] = [];
    const lines = textToAnalyze.split('\n');

    lines.forEach((line: string, index: number) => {
      // Simple file detection in diffs (looking for +++ or ---)
      if (line.startsWith('+++ ') || line.startsWith('--- ')) {
        currentFile = line.substring(4).trim();
      }

      PATTERNS.forEach(p => {
        if (p.regex.test(line)) {
          findings.push({
            file: currentFile,
            line: index + 1,
            severity: p.severity,
            category: p.category,
            message: p.message,
            suggestion: p.suggestion,
          });
        }
      });
    });

    // Check for long functions (very basic mock)
    // We just check if the total lines for a "block" are > 50. 
    // In this simplified regex-based API, we'll just add a mock finding if text is long.
    if (textToAnalyze.length > 5000) {
      findings.push({
        file: 'global',
        line: 0,
        severity: 'WARNING',
        category: 'Performance',
        message: 'Large file/diff detected',
        suggestion: 'Consider breaking large functions or files into smaller modules.',
      });
    }

    const passed = !findings.some(f => f.severity === 'CRITICAL');

    return NextResponse.json({ passed, findings });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
