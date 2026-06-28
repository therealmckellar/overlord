import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { alertId, status } = body;

    if (!alertId || !['approved', 'rejected', 'deferred'].includes(status)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // In a real app, this would persist to a DB
    return NextResponse.json({ success: true, message: "Alert " + alertId + " resolved as " + status });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
