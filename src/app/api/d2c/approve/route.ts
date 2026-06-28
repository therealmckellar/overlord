import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { spec } = await req.json();
    // In real impl, this would create a new workspace and inject the code
    return NextResponse.json({ success: true, workspaceId: 'ws-d2c-123' });
  } catch (e) {
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 });
  }
}
