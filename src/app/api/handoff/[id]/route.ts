import { NextResponse } from 'next/server';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // Simulate accepting a handoff
  return NextResponse.json({ success: true, id, status: 'accepted' });
}
