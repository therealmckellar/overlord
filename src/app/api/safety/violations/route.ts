import { NextRequest, NextResponse } from 'next/server';
import { SafetyViolation } from '@/stores/safetyStore';

export async function GET() {
  try {
    const violations: SafetyViolation[] = []; 
    return NextResponse.json(violations);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
