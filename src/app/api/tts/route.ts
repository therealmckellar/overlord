import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side TTS proxy — calls Deepgram Aura directly.
 * The real API key stays server-side; the client never sees it.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY_OVERLORD;
  if (!apiKey) {
    return NextResponse.json({ error: 'Deepgram API key not configured' }, { status: 500 });
  }

  try {
    const { text, voice } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid "text" field' }, { status: 400 });
    }

    const selectedVoice = voice || 'aura-asteria-en';

    const response = await fetch(
      `https://api.deepgram.com/v1/speak?model=aura-${selectedVoice.replace('aura-', '')}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: selectedVoice,
        }),
      }
    );

    if (!response.ok) {
      const body = await response.text();
      console.error('[TTS] Deepgram error:', response.status, body);
      return NextResponse.json(
        { error: `Deepgram TTS failed: ${response.status}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    console.error('[TTS] Proxy error:', err);
    return NextResponse.json({ error: 'TTS proxy failed' }, { status: 500 });
  }
}
