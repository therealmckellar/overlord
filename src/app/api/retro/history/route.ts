import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    { id: '1', dateRange: { from: '2026-06-20', to: '2026-06-26' }, markdown: 'Past retro content...' },
    { id: '2', dateRange: { from: '2026-06-13', to: '2026-06-19' }, markdown: 'Another past retro...' },
  ]);
}
