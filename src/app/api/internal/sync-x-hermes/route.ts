import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

// ─── /api/internal/sync-x-hermes ──────────────────────────────────
// Internal-only: mirrors Overlord's live X token into Hermes (xurl) config.
// Called by the X OAuth callback and the sync cron. Not for public use.

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'sync_x_to_hermes.py');
    const { stdout, stderr } = await execFileAsync('python3', [scriptPath], {
      timeout: 20000,
    });

    return NextResponse.json({
      ok: true,
      output: stdout.trim(),
      ...(stderr ? { warn: stderr.trim() } : {}),
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || String(err) },
      { status: 500 }
    );
  }
}
