import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { bugDescription, workspaceId } = await req.json();
    const id = "debug-" + Date.now();
    const session = {
      id,
      workspaceId,
      bugDescription,
      currentPhase: 'REPRODUCE',
      phases: {
        REPRODUCE: { status: 'active', input: '', output: '', conversation: [] },
        ISOLATE: { status: 'pending', input: '', output: '', conversation: [] },
        FIX: { status: 'pending', input: '', output: '', conversation: [] },
        PREVENT: { status: 'pending', input: '', output: '', conversation: [] },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return NextResponse.json(session);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json([]); // Mock history
}
