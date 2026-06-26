import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
  }

  const { prompt, model, size } = await req.json() as {
    prompt: string;
    model?: string;
    size?: string;
  };

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    // Use OpenRouter's image generation endpoint
    const response = await fetch(`${OPENROUTER_BASE_URL}/image/generations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://overlord.local',
        'X-Title': 'Overlord Agent OS',
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        model: model || 'openai/dall-e-3',
        n: 1,
        size: size || '1024x1024',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Image gen error:', response.status, errorText);
      return NextResponse.json(
        { error: `Image generation error ${response.status}: ${errorText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Image gen route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
