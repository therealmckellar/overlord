import { NextResponse } from 'next/server';

export async function GET() {
  // Client-side state is primary. Server endpoint provided for API consistency.
  return NextResponse.json({ mode: 'EXECUTE' });
}
