import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const logs = getDb().prepare('SELECT * FROM governance_logs ORDER BY timestamp DESC').all();
    return NextResponse.json(logs);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
  }
}
