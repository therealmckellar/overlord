import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    // Simulate fetching specific comparison
    return NextResponse.json({ 
      id, 
      message: 'Comparison data for ' + id + ' is simulated' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
