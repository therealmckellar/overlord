import { NextResponse } from 'next/server';
import { useIdentityStore } from '@/stores/identityStore';

export async function GET() {
  const { identities } = useIdentityStore.getState();
  return NextResponse.json({ success: true, identities });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { name, scope, capabilities, description } = body;

  if (!name || !scope) {
    return NextResponse.json({ success: false, error: 'Name and scope are required' }, { status: 400 });
  }

  const identity = useIdentityStore.getState().createIdentity({
    name,
    description: description || '',
    scope,
    capabilities: capabilities || [],
  });

  return NextResponse.json({ success: true, identity });
}
