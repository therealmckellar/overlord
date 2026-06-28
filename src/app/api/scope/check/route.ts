import { NextResponse } from 'next/server';
import { analyzeScopeDrift } from '@/lib/scopeTracker';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { taskId, originalScope, actualOutput, modifiedFiles, declaredFiles, estimatedTime, actualTime } = body;

    const analysis = analyzeScopeDrift(
      originalScope, 
      actualOutput, 
      modifiedFiles, 
      declaredFiles, 
      estimatedTime, 
      actualTime
    );

    return NextResponse.json({ analysis });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
