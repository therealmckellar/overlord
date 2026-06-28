import { NextRequest, NextResponse } from 'next/server';
import { qaDb } from '@/lib/qaDb';

export async function POST(req: NextRequest) {
  try {
    const { sessionId, scenarioId, status, screenshot, error } = await req.json();

    qaDb.updateScenario(sessionId, scenarioId, { status, screenshot, error });

    const session = qaDb.getSession(sessionId);
    if (session) {
      const allScenarios = session.scenarios;
      const passed = allScenarios.filter((s: any) => s.status === 'pass').length;
      const failed = allScenarios.filter((s: any) => s.status === 'fail').length;

      qaDb.updateSession(sessionId, {
        summary: { total: allScenarios.length, passed, failed },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('QA Update Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
