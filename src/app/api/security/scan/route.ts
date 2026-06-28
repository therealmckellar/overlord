import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SCAN_RULES = [
  {
    id: 'HARDCODED_SECRET',
    category: 'Sensitive Data Exposure',
    severity: 'CRITICAL',
    cwe: 'CWE-798',
    regex: /(api[_-]?key|secret|password|token|auth[_-]?token)\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}/gi,
    description: 'Potential hardcoded secret or API key detected.',
    remediation: 'Move secrets to environment variables (.env) and use a secret manager.'
  },
  {
    id: 'SQL_INJECTION',
    category: 'Injection',
    severity: 'CRITICAL',
    cwe: 'CWE-89',
    regex: /(\`.*?\$\{.*?\}\`|".*?"\s*\+\s*.*|'.*?'\s*\+\s*.*)/g,
    description: 'Potential SQL injection via string concatenation or template literal in query.',
    remediation: 'Use parameterized queries or an ORM (like Prisma) to prevent SQL injection.'
  },
  {
    id: 'XSS_SINK',
    category: 'XSS',
    severity: 'HIGH',
    cwe: 'CWE-79',
    regex: /(innerHTML|document\.write|dangerouslySetInnerHTML)/g,
    description: 'Potentially unsafe DOM manipulation that could lead to XSS.',
    remediation: 'Use safe alternatives like textContent or sanitize HTML with a library like DOMPurify.'
  },
  {
    id: 'WEAK_CRYPTO',
    category: 'Broken Auth',
    severity: 'MEDIUM',
    cwe: 'CWE-327',
    regex: /(md5|sha1)\s*\(/gi,
    description: 'Use of weak cryptographic hash function.',
    remediation: 'Use stronger algorithms like Argon2, bcrypt, or SHA-256.'
  },
  {
    id: 'INSECURE_DEFAULT',
    category: 'Security Misconfig',
    severity: 'MEDIUM',
    cwe: 'CWE-16',
    regex: /(debug\s*:\s*true|auth\s*:\s*false)/gi,
    description: 'Insecure default configuration detected.',
    remediation: 'Ensure production environments have debugging disabled and authentication enabled.'
  },
  {
    id: 'UNVALIDATED_REDIRECT',
    category: 'Injection',
    severity: 'LOW',
    cwe: 'CWE-601',
    regex: /redirect\s*\(\s*req\.query\.|location\.replace\s*\(\s*req\.query\./gi,
    description: 'Potential unvalidated redirect.',
    remediation: 'Validate redirect URLs against an allowlist.'
  }
];

function scanFile(filePath: string) {
  const findings: any[] = [];
  const content = fs.readFileSync(filePath, 'utf8');
  
  SCAN_RULES.forEach(rule => {
    let match;
    const regex = new RegExp(rule.regex);
    while ((match = regex.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      findings.push({
        severity: rule.severity,
        cwe: rule.cwe,
        file: path.relative('/home/rmckellar/overlord', filePath),
        line: lineNum,
        description: rule.description,
        remediation: rule.remediation,
        category: rule.category
      });
    }
  });

  return findings;
}

export async function POST(req: Request) {
  try {
    const { target } = await req.json(); 
    const rootDir = target || '/home/rmckellar/overlord/src';
    
    const allFindings: any[] = [];
    
    function walkDir(dir: string) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
            walkDir(fullPath);
          }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js')) {
          allFindings.push(...scanFile(fullPath));
        }
      });
    }

    walkDir(rootDir);

    const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length;
    const highCount = allFindings.filter(f => f.severity === 'HIGH').length;
    const mediumCount = allFindings.filter(f => f.severity === 'MEDIUM').length;
    const lowCount = allFindings.filter(f => f.severity === 'LOW').length;

    const totalIssues = allFindings.length;
    const score = totalIssues === 0 ? 100 : Math.max(0, 100 - (criticalCount * 20 + highCount * 10 + mediumCount * 5 + lowCount * 2));

    return NextResponse.json({
      score,
      findings: allFindings
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
