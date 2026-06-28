import { NextResponse } from 'next/server';
import { useCanaryStore } from '@/stores/canaryStore';

export async function GET() {
  const history = useCanaryStore.getState().history;
  return NextResponse.json(history);
}
