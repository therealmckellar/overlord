import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In a real app, fetch from DB
    return NextResponse.json({ 
      history: [], 
      message: 'History is currently simulated' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
