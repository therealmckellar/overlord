import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return NextResponse.json({ id, status: 'ok' });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { phaseUpdate } = await req.json();
    return NextResponse.json({ success: true, phaseUpdate });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
