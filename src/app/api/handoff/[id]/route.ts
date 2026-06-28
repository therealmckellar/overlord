import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // Simulate accepting a handoff
  return NextResponse.json({ success: true, id, status: 'accepted' });
}
