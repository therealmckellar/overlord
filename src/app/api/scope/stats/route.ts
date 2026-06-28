import { NextResponse } from 'next/server';

export async function GET() {
  // In a real app, fetch from DB
  return NextResponse.json({ stats: {} });
}
