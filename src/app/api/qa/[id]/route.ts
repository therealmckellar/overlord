import { NextRequest, NextResponse } from 'next/server';
import { qaDb } from '@/lib/qaDb';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const session = qaDb.getSession(id);

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...session,
      scenarios: session.scenarios.map((s: any) => ({
        id: s.scenarioId,
        label: s.scenarioId,
        status: s.status,
        screenshot: s.screenshot,
        error: s.error,
      })),
    });
  } catch (error: any) {
    console.error('QA Session Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
