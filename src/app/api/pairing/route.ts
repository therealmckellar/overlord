import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const PAIRING_DIR = path.join(os.homedir(), '.hermes', 'pairing');

async function readPairingData() {
  try {
    const files = await fs.readdir(PAIRING_DIR);
    const requests = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        try {
          const data = await fs.readFile(path.join(PAIRING_DIR, file), 'utf8');
          requests.push(JSON.parse(data));
        } catch { /* skip bad files */ }
      }
    }
    return requests;
  } catch {
    return [];
  }
}

export async function GET() {
  const requests = await readPairingData();
  return NextResponse.json({
    requests,
    config: {
      enabled: true,
      code_length: 8,
      expiry_minutes: 60,
      max_pending_per_platform: 3,
      rate_limit_minutes: 10,
      lockout_after_failures: 5,
      lockout_duration_minutes: 60,
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, code } = body;

    if (!action || !code) {
      return NextResponse.json({ error: 'Action and code are required' }, { status: 400 });
    }

    const requests = await readPairingData();
    const target = requests.find(r => r.code === code);

    if (!target) {
      return NextResponse.json({ error: 'Pairing code not found' }, { status: 404 });
    }

    // Update the pairing request status
    target.status = action === 'approve' ? 'approved' : 'denied';
    if (action === 'approve') {
      target.approved_at = new Date().toISOString();
    }

    // Write back
    const filePath = path.join(PAIRING_DIR, `${code}.json`);
    await fs.writeFile(filePath, JSON.stringify(target, null, 2));

    return NextResponse.json({ ok: true, status: target.status });
  } catch {
    return NextResponse.json({ error: 'Failed to process pairing action' }, { status: 500 });
  }
}
