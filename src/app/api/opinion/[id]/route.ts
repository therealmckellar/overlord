import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Simulate fetching specific comparison
    return NextResponse.json({ 
      id, 
      message: 'Comparison data for ' + id + ' is simulated' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
