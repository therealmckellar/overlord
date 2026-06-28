import { NextResponse } from 'next/server';
import { useHandoffStore } from '@/stores/handoffStore';

// Note: In a real Next.js app, you wouldn't use a Zustand store directly in an API route 
// because API routes run on the server. You'd use a database. 
// For this implementation, we simulate a persistence layer.

let mockDb: any[] = [];

export async function POST(request: Request) {
  const body = await request.json();
  const handoff = {
    id: Math.random().toString(36).substring(7),
    ...body,
    timestamp: body.timestamp || new Date().toISOString(),
  };
  mockDb.push(handoff);
  return NextResponse.json(handoff);
}

export async function GET() {
  const pending = mockDb.filter((h: any) => h.status === 'pending');
  return NextResponse.json(pending);
}
