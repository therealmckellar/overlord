import { NextResponse } from 'next/server';

/**
 * Capability Handshake Endpoint.
 * Verifies that the underlying Hermes Gateway is not just reachable,
 * but is running the "Enhanced" configuration required for Overlord features.
 */
export async function GET() {
  try {
    // The Hermes Gateway runs on 9119 (verified via ss)
    const GATEWAY_URL = 'http://localhost:9119/api/config';
    
    // Using the session token from current environment
    const response = await fetch(GATEWAY_URL, {
      headers: {
        'Authorization': `Bearer ${process.env.HERMES_GATEWAY_TOKEN || 'aX-CJS8HzFKNTVQHAQt0Q66qcXYJetuRL8URS8TIIXQ'}`
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

    const config = await response.json();

    // CRITERIA FOR "ENHANCED" CAPABILITY:
    const expectedModel = 'google/gemma-4-31b-it:free';
    const actualModel = config.model;
    
    const hasReasoningFallbacks = config.fallback_providers?.some(
      (p: any) => p.model.includes('nemotron-3-ultra') || p.model.includes('qwen3-next')
    );

    const isEnhanced = (actualModel === expectedModel) && hasReasoningFallbacks;

    return NextResponse.json({
      success: true,
      status: isEnhanced ? 'enhanced' : 'vanilla',
      details: {
        version: '1.0.0-enhanced',
        defaultModel: actualModel,
        modelMatch: actualModel === expectedModel,
        capabilities: [
          'memory_galaxy',
          'prompt_arena',
          'deep_planning',
          'structural_intelligence'
        ].filter(() => isEnhanced),
        driftDetected: actualModel !== expectedModel
      }
    });

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      status: 'error',
      error: error.message,
      capability: 'unknown'
    }, { status: 500 });
  }
}
