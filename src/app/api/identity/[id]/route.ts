import { NextResponse } from 'next/server';
import { useIdentityStore } from '@/stores/identityStore';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();
  
  const identity = useIdentityStore.getState().identities.find(i => i.id === id);
  if (!identity) {
    return NextResponse.json({ success: false, error: 'Identity not found' }, { status: 404 });
  }

  useIdentityStore.getState().updateIdentity(id, body);
  
  if (body.rotateToken) {
    useIdentityStore.getState().rotateToken(id);
  }

  return NextResponse.json({ success: true });
}
