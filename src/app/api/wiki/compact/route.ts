/**
 * Wiki Compact API — Incremental compaction for the Obsidian wiki vault.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const WIKI_COMPACT = path.join(os.homedir(), 'wiki-tools', 'wiki-compact');
const WIKI_DIR = path.join(os.homedir(), 'wiki');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const apply = body.apply === true;
    const rebuildIndex = body.rebuildIndex === true;
    const pruneOrphans = body.pruneOrphans === true;

    const args = [
      'python3', WIKI_COMPACT,
      '--format', 'json',
      '--dir', WIKI_DIR,
    ];

    if (apply) args.push('--apply');
    if (rebuildIndex) args.push('--rebuild-index');
    if (pruneOrphans) args.push('--prune-orphans');

    const { stdout } = await execAsync(args.join(' '), {
      timeout: 60000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);

    return NextResponse.json({
      success: true,
      timestamp: result.timestamp,
      totalFiles: result.total_files,
      totalActions: result.total_actions,
      actionTypes: result.action_types,
      applied: result.apply,
      actions: result.actions?.slice(0, 50), // Cap for frontend
      reportFile: result.report_file,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Return latest compaction report
  try {
    const fs = await import('fs/promises');
    const reportsDir = path.join(WIKI_DIR, 'health-reports');
    const files = await fs.readdir(reportsDir);
    const reports = files.filter(f => f.startsWith('compact-')).sort().reverse();

    if (reports.length === 0) {
      return NextResponse.json({ success: true, reports: [], latest: null });
    }

    const latestReport = reports[0];
    const content = await fs.readFile(path.join(reportsDir, latestReport), 'utf-8');

    return NextResponse.json({
      success: true,
      reports,
      latest: {
        filename: latestReport,
        content: content.slice(0, 5000),
      },
    });
  } catch {
    return NextResponse.json({ success: true, reports: [], latest: null });
  }
}
