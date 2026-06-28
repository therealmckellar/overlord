import { NextRequest, NextResponse } from 'next/server';
import { validateOutput, AssertionRule } from '@/lib/qualityEngine';

export async function POST(req: NextRequest) {
  try {
    const { output, rules } = await req.json();
    if (!output || !rules) {
      return NextResponse.json({ error: 'Missing output or rules' }, { status: 400 });
    }
    const report = validateOutput(output, rules);
    return NextResponse.json(report);
  } catch (e) {
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}
