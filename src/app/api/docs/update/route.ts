import { NextResponse } from 'next/server';

export async function POST() {
  // Mock agent trigger
  return NextResponse.json({
    success: true,
    diff: '--- a/README.md\n+++ b/README.md\n- Deployment monitoring\n+ Post-deploy Canary health checks'
  });
}
