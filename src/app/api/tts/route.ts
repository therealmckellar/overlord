import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json();

    if (!text) {
      return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    let apiKey: string | null = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
    
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey === '') {
      apiKey = process.env.DEEPGRAM_API_KEY_OVERLORD || process.env.DEEPGRAM_API_KEY || null;
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Deepgram API Key not configured. Please set DEEPGRAM_API_KEY_OVERLORD in env or settings.' },
        { status: 400 }
      );
    }

    const voiceModel = voice || 'aura-asteria-en';

    // Call Deepgram TTS API
    const deepgramUrl = `https://api.deepgram.com/v1/speak?model=${encodeURIComponent(voiceModel)}`;

    const response = await fetch(deepgramUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Deepgram TTS error:', response.status, errorText);
      return NextResponse.json(
        { error: `Deepgram TTS request failed with status ${response.status}: ${errorText}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error: any) {
    console.error('[Deepgram TTS API Error]:', error);
    return NextResponse.json({ error: 'Failed to synthesize speech', details: error.message }, { status: 500 });
  }
}
