import { NextResponse } from 'next/server';

export async function GET() {
  // Simple stats — in production these would come from SQLite
  const stats = {
    activeSessions: 1,
    totalTokens: 0,
    costToday: 0,
    activeAgents: 1,
    uptime: Date.now() - (typeof serverStart !== 'undefined' ? serverStart : Date.now()),
    errorsLast24h: 0,
    messagesToday: 0,
  };
  return NextResponse.json(stats);
}

const serverStart = Date.now();
