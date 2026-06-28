import { NextResponse } from 'next/server';

export async function GET() {
  try {
    return NextResponse.json({
      totalFiles: 142,
      totalFunctions: 856,
      avgComplexity: 4.2,
      hotPaths: 12
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
