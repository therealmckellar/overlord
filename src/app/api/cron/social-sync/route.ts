import { NextResponse } from 'next/server';

// ─── Cron: Social Sync ──────────────────────────────────────────────
// Called by Overlord cron system. Orchestrates all social data syncing.

export async function POST() {
  try {
    // Call the master sync endpoint internally
    const syncResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9125'}/api/social/sync`, {
      method: 'POST',
    });

    if (!syncResponse.ok) {
      return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }

    const result = await syncResponse.json();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json({ error: 'Cron execution failed' }, { status: 500 });
  }
}

export async function GET() {
  // Health check — return last sync status
  return NextResponse.json({ status: 'ok', endpoint: 'social-sync-cron' });
}
