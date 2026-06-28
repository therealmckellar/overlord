import { NextRequest, NextResponse } from 'next/server';
import { AssertionRule } from '@/lib/qualityEngine';

// Mock database for rule sets
let ruleSets: Record<string, AssertionRule[]> = {
  'Default-Agent': [
    { id: 'len-1', type: 'LENGTH', params: { min: 10, max: 1000 }, description: 'Reasonable length', weight: 1 },
    { id: 'slop-1', type: 'NO_BANNED', params: { banned: ['delve', 'tapestry', 'in conclusion', 'multifaceted'] }, description: 'No AI slop', weight: 2 },
  ],
};

export async function GET() {
  return NextResponse.json(ruleSets);
}

export async function POST(req: NextRequest) {
  try {
    const { name, rules } = await req.json();
    if (!name || !rules) {
      return NextResponse.json({ error: 'Missing name or rules' }, { status: 400 });
    }
    ruleSets[name] = rules;
    return NextResponse.json({ success: true, name });
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 500 });
  }
}
