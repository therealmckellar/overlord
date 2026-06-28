import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    id: 'current-profile',
    rules: {
      colors: ['Zinc-900', 'Indigo-600'],
      layouts: ['Modular', 'Spaced'],
      tone: ['Technical'],
      patterns: ['Tailwind'],
    },
    lastAnalyzed: Date.now(),
    description: 'Current learned taste profile.',
  });
}
