import { NextResponse } from 'next/server';
import { getRecentEvents, subscribeEvents } from '@/lib/event-bus';

export async function GET() {
  const events = getRecentEvents();
  
  // Check if the request wants SSE (based on Accept header)
  // In Next.js App Router, for SSE we return a ReadableStream
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Push existing events first
      events.forEach(event => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      // Subscribe to new events
      const unsubscribe = subscribeEvents((event) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      });

      // Handle stream closing
      // Note: In some environments, we need to handle the close event explicitly
    },
    cancel() {
      // Cleanup if necessary
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
