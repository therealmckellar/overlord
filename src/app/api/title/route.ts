import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { message } = body as { message: string };

  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://overlord.local',
        'X-Title': 'Overlord Agent OS',
      },
      body: JSON.stringify({
        model: 'google/gemma-2-9b-it:free',
        messages: [
          {
            role: 'system',
            content: 'You are a concise chat title generator. Given a user message, generate a short, descriptive title (3-6 words) that summarizes the topic. No punctuation at the end. No quotes. Just the title.',
          },
          {
            role: 'user',
            content: `Generate a short title for this message: "${message.slice(0, 200)}"`,
          },
        ],
        max_tokens: 20,
        stream: false,
      }),
    });

    if (!response.ok) {
      // Fallback: truncate the message itself
      const fallback = message.slice(0, 40).trim() + (message.length > 40 ? '...' : '');
      return NextResponse.json({ title: fallback });
    }

    const data = await response.json();
    const title = data.choices?.[0]?.message?.content?.trim() || message.slice(0, 40).trim();
    return NextResponse.json({ title });
  } catch {
    // Fallback: truncate the message
    const fallback = message.slice(0, 40).trim() + (message.length > 40 ? '...' : '');
    return NextResponse.json({ title: fallback });
  }
}
