import { NextResponse } from 'next/server';

/**
 * Capability Handshake Endpoint.
 * Verifies the underlying Hermes Gateway is reachable. Overlord is a TUI
 * replacement that mirrors Hermes activity, so the "source of overlord" is
 * the live Hermes gateway. We probe its health endpoint; a 2xx means Hermes
 * is connected and Overlord can mirror it.
 *
 * Configurable via HERMES_GATEWAY_URL (defaults to the local gateway /health).
 */
export async function GET() {
  try {
    const GATEWAY_URL = process.env.HERMES_GATEWAY_URL || 'http://127.0.0.1:8642/health';

    const response = await fetch(GATEWAY_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.HERMES_GATEWAY_TOKEN || ''}`
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        status: 'unreachable',
        error: `Gateway returned ${response.status}`,
        capability: 'vanilla'
      }, { status: 502 });
    }

    // Hermes is reachable -> Overlord is wired to its source.
    return NextResponse.json({
      success: true,
      status: 'enhanced',
      details: {
        version: '1.0.0-enhanced',
        gatewayUrl: GATEWAY_URL,
        capabilities: [
          'memory_galaxy',
          'prompt_arena',
          'deep_planning',
          'structural_intelligence'
        ],
        driftDetected: false
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
      cause: error.cause?.message || error.cause?.code || null,
      capability: 'unknown'
    }, { status: 500 });
  }
}
