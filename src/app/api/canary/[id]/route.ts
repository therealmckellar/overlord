import { NextResponse } from 'next/server';
import { useCanaryStore } from '@/stores/canaryStore';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const canary = useCanaryStore.getState().activeCanaries[id];
  if (!canary) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(canary);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // STOP monitoring
  const { id } = await params;
  const canary = useCanaryStore.getState().activeCanaries[id];
  if (!canary) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  
  const finalStatus = canary.status === 'failed' ? 'failed' : 'passed';
  useCanaryStore.getState().stopCanary(id, finalStatus);
  
  return NextResponse.json({ success: true });
}
