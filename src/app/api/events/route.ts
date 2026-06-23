import { NextResponse } from 'next/server';

interface EventItem {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  source: string;
  message: string;
}

// In-memory ring buffer for recent events
const eventBuffer: EventItem[] = [];
const MAX_EVENTS = 50;

export function logEvent(type: EventItem['type'], source: string, message: string) {
  eventBuffer.unshift({
    id: Math.random().toString(36).slice(2, 10),
    timestamp: Date.now(),
    type,
    source,
    message,
  });
  if (eventBuffer.length > MAX_EVENTS) {
    eventBuffer.length = MAX_EVENTS;
  }
}

export async function GET() {
  return NextResponse.json({ events: eventBuffer });
}

// Seed some initial events
logEvent('info', 'System', 'Overlord started');
logEvent('success', 'Auth', 'Authentication system ready');
logEvent('info', 'Chat', 'Chat system initialized');
