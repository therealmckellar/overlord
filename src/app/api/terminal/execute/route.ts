import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command } = body as { command: string };

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    // Security: block dangerous commands
    const blockedPatterns = [
      /\brm\s+-rf\b/,
      /\bsudo\b/,
      /\bchmod\b/,
      /\bchown\b/,
      /\bmkfs\b/,
      /\bdd\s+if=/,
      /\b>:?\s*\/dev\//,
      /\bcurl\b.*\|.*\bbash\b/,
      /\bwget\b.*\|.*\bbash\b/,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        return NextResponse.json({ error: 'Command blocked for security' }, { status: 403 });
      }
    }

    // Limit command length
    if (command.length > 500) {
      return NextResponse.json({ error: 'Command too long (max 500 chars)' }, { status: 400 });
    }

    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 30000,
      maxBuffer: 1024 * 1024, // 1MB output limit
      env: {
        ...process.env,
        PATH: '/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin',
      },
    });

    return NextResponse.json({
      output: stdout.trim(),
      error: stderr.trim() || undefined,
      exitCode: 0,
    });
  } catch (error: unknown) {
    const err = error as Error & { stderr?: string; exitCode?: number; killed?: boolean };

    if (err.killed) {
      return NextResponse.json({
        output: '',
        error: 'Command timed out (30s limit)',
        exitCode: 124,
      });
    }

    return NextResponse.json({
      output: '',
      error: err.stderr?.trim() || err.message,
      exitCode: err.exitCode || 1,
    });
  }
}
