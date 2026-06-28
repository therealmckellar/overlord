import { NextRequest, NextResponse } from 'next/server';
import { checkSafety, DEFAULT_SAFETY_RULES } from '@/lib/safetyRules';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { command } = body as { command: string };

    if (!command || typeof command !== 'string') {
      return NextResponse.json({ error: 'Command is required' }, { status: 400 });
    }

    const result = checkSafety(command, DEFAULT_SAFETY_RULES);

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
