import { NextResponse } from 'next/server';

const mockReports = [
  { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), score: 85, target: '/src' },
  { id: '2', timestamp: new Date(Date.now() - 172800000).toISOString(), score: 70, target: '/src' },
];

export async function GET() {
  return NextResponse.json(mockReports);
}
