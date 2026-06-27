/**
 * Wiki Auto-File API — Auto-file content from queries/ into the wiki vault.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const WIKI_AUTO_FILE = path.join(os.homedir(), 'wiki-tools', 'wiki-auto-file');
const WIKI_DIR = path.join(os.homedir(), 'wiki');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    const args = [
      'python3', WIKI_AUTO_FILE,
      '--format', 'json',
      '--dir', WIKI_DIR,
    ];
    if (dryRun) args.push('--dry-run');

    const { stdout } = await execAsync(args.join(' '), {
      timeout: 120000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);

    return NextResponse.json({
      success: true,
      dryRun: result.dry_run,
      processed: result.processed || 0,
      filed: result.filed || 0,
      errors: result.errors || 0,
      details: result.details || [],
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function GET() {
  // Return auto-file status / last run info
  try {
    const fs = await import('fs/promises');
    const logPath = path.join(WIKI_DIR, 'auto-filed.log');

    let lastRun = 'never';
    let totalFiled = 0;

    try {
      const content = await fs.readFile(logPath, 'utf-8');
      const lines = content.trim().split('\n');
      const lastLine = lines[lines.length - 1];
      if (lastLine) {
        // Parse last run info
        const match = lastLine.match(/(\d{4}-\d{2}-\d{2}T[\d:]+)/);
        if (match) lastRun = match[1];
        totalFiled = lines.filter(l => l.includes('FILED:')).length;
      }
    } catch {
      // Log doesn't exist yet
    }

    // Check queries dir for unfiled count
    const queriesDir = path.join(WIKI_DIR, 'queries');
    let pendingCount = 0;
    try {
      const files = await fs.readdir(queriesDir);
      pendingCount = files.filter(f => f.endsWith('.md')).length;
    } catch {
      // No queries dir
    }

    return NextResponse.json({
      success: true,
      lastRun,
      totalFiled,
      pendingCount,
    });
  } catch {
    return NextResponse.json({ success: true, lastRun: 'unknown', pendingCount: 0 });
  }
}
