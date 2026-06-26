import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { message, agentId } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const responses = [
        `Hello! I am the agent assigned to this task. `,
        `I've received your message: "${message}". `,
        `I am now processing the request and searching the codebase... `,
        `Based on my analysis, I recommend implementing a modular approach... `,
        `I will now begin generating the necessary components.`,
      ];

      for (const chunk of responses) {
        const words = chunk.split(' ');
        for (const word of words) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: word + ' ' })}\n\n`));
          await new Promise((r) => setTimeout(r, 50 + Math.random() * 100));
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
        await new Promise((r) => setTimeout(r, 500));
      }
      controller.close();
    },
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
