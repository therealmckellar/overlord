import { NextResponse } from 'next/server';
import { authorityGuard } from '@/lib/authorityGuard';

export async function POST(request: Request) {
  const { agentId, action, requiredScope } = await request.json();
  
  if (!agentId || !action || !requiredScope) {
    return NextResponse.json({ success: false, error: 'agentId, action, and requiredScope are required' }, { status: 400 });
  }

  const result = authorityGuard.check({ agentId, action, requiredScope });
  
  return NextResponse.json({ 
    success: true, 
    allowed: result.allowed, 
    reason: result.reason 
  });
}
