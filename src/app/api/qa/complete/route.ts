import { NextRequest, NextResponse } from 'next/server';
import { qaDb } from '@/lib/qaDb';

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();
    
    qaDb.updateSession(sessionId, { status: 'completed' });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('QA Complete Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
