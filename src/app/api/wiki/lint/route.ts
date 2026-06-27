/**
 * Wiki Lint API — Health check and linting for the Obsidian wiki vault.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const WIKI_LINT = path.join(os.homedir(), 'wiki-tools', 'wiki-lint');
const WIKI_DIR = path.join(os.homedir(), 'wiki');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const checks = body.checks || 'orphans,broken-links,missing-frontmatter,incomplete-frontmatter,oversized,stale,duplicates,missing-index,invalid-tags';

    const args = [
      'python3', WIKI_LINT,
      '--format', 'json',
      '--checks', checks,
      '--dir', WIKI_DIR,
    ];

    const { stdout } = await execAsync(args.join(' '), {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);

    // Summarize for frontend
    const summary = {
      timestamp: result.timestamp,
      totalFiles: result.total_files,
      totalIssues: result.total_issues,
      errors: result.severity_counts?.error || 0,
      warnings: result.severity_counts?.warning || 0,
      info: result.severity_counts?.info || 0,
      reportFile: result.report_file,
      byCheck: {} as Record<string, number>,
    };

    // Group by check
    for (const issue of result.issues || []) {
      summary.byCheck[issue.check] = (summary.byCheck[issue.check] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      summary,
      issues: result.issues?.slice(0, 100), // Cap at 100 for frontend
      reportFile: result.report_file,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Return the latest health report if it exists
  try {
    const fs = await import('fs/promises');
    const reportsDir = path.join(WIKI_DIR, 'health-reports');
    const files = await fs.readdir(reportsDir);
    const reports = files.filter(f => f.endsWith('.md') && !f.startsWith('compact-')).sort().reverse();

    if (reports.length === 0) {
      return NextResponse.json({ success: true, reports: [], latest: null });
    }

    const latestReport = reports[0];
    const content = await fs.readFile(path.join(reportsDir, latestReport), 'utf-8');

    return NextResponse.json({
      success: true,
      reports: reports,
      latest: {
        filename: latestReport,
        content: content.slice(0, 5000), // Cap content
      },
    });
  } catch {
    return NextResponse.json({ success: true, reports: [], latest: null });
  }
}
