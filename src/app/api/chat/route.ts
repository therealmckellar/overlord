import { NextRequest, NextResponse } from 'next/server';
import { PERSONAS } from '@/lib/personas';

export async function POST(req: NextRequest) {
  const { messages, session } = await req.json();
  const personaSlug = req.headers.get('x-persona') || 'david';
  const systemPrompt = PERSONAS[personaSlug as keyof typeof PERSONAS]?.systemPrompt || PERSONAS.david.systemPrompt;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, data: string, id?: string) => {
        let payload = `event: ${type}\n`;
        if (id) payload += `id: ${id}\n`;
        payload += `data: ${data}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      send('typing', 'Agent is thinking...');

      // In a real app, we would send the systemPrompt and messages to an LLM
      // For this mock, we'll just acknowledge the persona
      const responseText = `[${systemPrompt.split(',')[0]}] Hello! I am responding as ${personaSlug}. How can I help you today?`;
      
      const chunks = responseText.split(' ');
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, 100));
        send('chunk', chunk + ' ');
      }

      send('done', 'Streaming complete');
      controller.close();
    },
    cancel() {
      console.log('SSE client disconnected');
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

export async function GET(req: NextRequest) {
  // Keep existing GET for simple testing
  return NextResponse.json({ status: 'Chat API active' });
}
