import { NextRequest, NextResponse } from 'next/server';

  const OPENROUTER_API_KEY = process.env.OPENROUTER_SPACES_API_KEY || process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'OPENROUTER_API_KEY not configured' },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { messages, model, systemPrompt } = body as {
    messages: { sender: { role: string }; content: string }[];
    model?: string;
    systemPrompt?: string;
  };

  const selectedModel = model || process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha';

  // Build OpenAI-format messages
  const openaiMessages: ChatMessage[] = [];

  if (systemPrompt) {
    openaiMessages.push({ role: 'system', content: systemPrompt });
  } else {
    openaiMessages.push({
      role: 'system',
      content: 'You are an AI assistant in Overlord, a multi-agent operating system. Be concise, helpful, and direct. Use markdown formatting when appropriate.',
    });
  }

  for (const msg of messages) {
    const role = msg.sender?.role || 'user';
    if (role === 'user' || role === 'assistant') {
      openaiMessages.push({
        role: role as 'user' | 'assistant',
        content: msg.content,
      });
    }
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
        model: selectedModel,
        messages: openaiMessages,
        stream: true,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', response.status, errorText);
      return NextResponse.json(
        { error: `OpenRouter error ${response.status}: ${errorText.slice(0, 200)}` },
        { status: response.status }
      );
    }

    // Stream SSE from OpenRouter to client
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6).trim();

              if (data === '[DONE]') {
                controller.enqueue(encoder.encode(`event: done\ndata: {}\n\n`));
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    encoder.encode(`event: chunk\ndata: ${JSON.stringify({ content, id: parsed.id })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed chunks
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
          controller.enqueue(
            encoder.encode(`event: error\ndata: ${JSON.stringify({ content: 'Stream interrupted' })}\n\n`)
          );
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err) {
    console.error('Chat route error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
