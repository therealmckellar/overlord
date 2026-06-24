import { NextRequest, NextResponse } from 'next/server';
import { PERSONAS } from '@/lib/personas';
import { verifyToken } from '@/lib/auth/jwt';
import { findById } from '@/lib/auth/users';

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha';

// Build OpenRouter messages from our message format
function buildMessages(messages: Array<{ sender: { role: string }; content: string }>, systemPrompt: string) {
  const result: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
  ];
  for (const msg of messages) {
    const role = msg.sender?.role === 'user' ? 'user' : 'assistant';
    result.push({ role, content: msg.content });
  }
  return result;
}

export async function POST(req: NextRequest) {
  // Auth check
  const token = req.cookies.get('accessToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
  const user = await findById(payload.userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { messages, session } = body;
  const personaSlug = req.headers.get('x-persona') || 'david';
  const modelFromHeader = req.headers.get('x-model');
  const persona = PERSONAS[personaSlug as keyof typeof PERSONAS] || PERSONAS.david;

  // Use model from selector header, fallback to env var
  const model = modelFromHeader || OPENROUTER_MODEL;

  const openRouterMessages = buildMessages(messages || [], persona.systemPrompt);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: string, id?: string) => {
        let payload = `event: ${type}\n`;
        if (id) payload += `id: ${id}\n`;
        payload += `data: ${JSON.stringify({ content: data })}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      send('typing', `${persona.name} is thinking...`);

      try {
        const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9125',
            'X-Title': 'Overlord',
          },
          body: JSON.stringify({
            model,
            messages: openRouterMessages,
            stream: true,
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          send('error', `OpenRouter error: ${response.status} ${errorText}`);
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          send('error', 'No response body from OpenRouter');
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                send('chunk', delta);
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }

        send('done', '');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        send('error', `Stream error: ${message}`);
      }

      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}

export async function GET() {
  return NextResponse.json({ status: 'ok', message: 'Chat endpoint ready. POST with messages.' });
}
