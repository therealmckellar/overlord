import { NextResponse } from 'next/server';
import { useCanaryStore } from '@/stores/canaryStore';

export async function POST(req: Request) {
  const { deployId, url, baselineMetrics } = await req.json();
  const id = Math.random().toString(36).substr(2, 9);
  
  const newCanary = {
    id,
    deployId,
    url,
    status: 'running' as const,
    metrics: [],
    baselineMetrics,
    consecutiveFailures: 0,
    startTime: Date.now(),
  };

  useCanaryStore.getState().startCanary(newCanary);
  return NextResponse.json({ id });
}
