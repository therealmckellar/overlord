import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, reason, user } = body;

    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    getDb().prepare(
      'INSERT INTO governance_logs (id, timestamp, action, user, status, overrideReason) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, timestamp, action, user, 'overridden', reason);

    return NextResponse.json({ success: true, id });
  } catch (e) {
    return NextResponse.json({ error: 'Override failed' }, { status: 500 });
  }
}
