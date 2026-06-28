import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { qaDb } from '@/lib/qaDb';

export async function POST(req: NextRequest) {
  try {
    const { url, testType, scenarios } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const sessionId = uuidv4();
    
    qaDb.createSession({
      id: sessionId,
      url,
      testType,
      status: 'running',
      summary: { total: scenarios.length, passed: 0, failed: 0 },
    });

    scenarios.forEach((id: string) => {
      qaDb.createScenario({ sessionId, scenarioId: id, status: 'pending' });
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9125';
    const spawnResponse = await fetch(appUrl + '/api/agents/spawn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: 'hermes-browser-qa',
        prompt: 'Execute Browser QA Test. ' + 
               'URL: ' + url + '. ' + 
               'Test Type: ' + testType + '. ' + 
               'Scenarios: ' + scenarios.join(', ') + '. ' + 
               'Instructions: Navigate, Verify, Screenshot, and Update results via /api/qa/update_scenario.'
      }),
    });

    if (!spawnResponse.ok) {
      console.error('Failed to spawn QA agent');
    }

    return NextResponse.json({ id: sessionId });
  } catch (error: any) {
    console.error('QA Start Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
