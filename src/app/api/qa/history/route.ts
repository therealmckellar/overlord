import { NextRequest, NextResponse } from 'next/server';
import { qaDb } from '@/lib/qaDb';

export async function GET() {
  try {
    const sessions = qaDb.getHistory();
    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error('QA History Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
