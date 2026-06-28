import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const ACHIEVEMENTS_PATH = path.join(os.homedir(), '.hermes', 'achievements', 'progress.json');

const DEFAULT_PROGRESS = [
  { achievementId: 'tool_calls', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'sessions', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'errors_fixed', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'files_written', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'deploys', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'streak', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'skills_used', current: 0, unlockedTier: -1, unlockedAt: null },
  { achievementId: 'security_audits', current: 0, unlockedTier: -1, unlockedAt: null },
];

export async function GET() {
  try {
    const data = await fs.readFile(ACHIEVEMENTS_PATH, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch {
    // Return default empty progress
    return NextResponse.json({ progress: DEFAULT_PROGRESS });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const progress = body.progress || DEFAULT_PROGRESS;
    await fs.mkdir(path.dirname(ACHIEVEMENTS_PATH), { recursive: true });
    await fs.writeFile(ACHIEVEMENTS_PATH, JSON.stringify(progress, null, 2));
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 });
  }
}
