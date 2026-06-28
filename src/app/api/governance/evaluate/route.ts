import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, params } = body;
    const command = params?.command || action;

    const destructivePatterns = [
      /rm\s+-rf/,
      /DROP\s+TABLE/i,
      /TRUNCATE\s+TABLE/i,
      /DELETE\s+FROM/i,
      /force\s+push/i,
      /deploy\s+to\s+production/i,
    ];

    const requiresGate = destructivePatterns.some(pattern => pattern.test(command));

    if (requiresGate) {
      return NextResponse.json({ 
        requiresGate: true, 
        reason: 'This action is flagged as destructive and requires governance approval.' 
      });
    }

    return NextResponse.json({ requiresGate: false, reason: 'Action is safe.' });
  } catch (e) {
    return NextResponse.json({ error: 'Evaluation failed' }, { status: 500 });
  }
}
