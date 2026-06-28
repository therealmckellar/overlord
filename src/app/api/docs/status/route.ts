import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    overallStatus: 'outdated',
    outdatedFiles: ['README.md', 'API_DOCS.md']
  });
}
