import { EventEmitter } from 'events';

interface EventItem {
  id: string;
  timestamp: number;
  type: 'info' | 'success' | 'warning' | 'error';
  source: string;
  message: string;
}

class EventBus extends EventEmitter {
  private events: EventItem[] = [];
  private readonly MAX_EVENTS = 100;

  logEvent(type: EventItem['type'], source: string, message: string): EventItem {
    const event: EventItem = {
      id: Math.random().toString(36).slice(2, 10),
      timestamp: Date.now(),
      type,
      source,
      message,
    };

    this.events.unshift(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.pop();
    }

    this.emit('event', event);
    return event;
  }

  getRecentEvents(): EventItem[] {
    return [...this.events];
  }

  subscribe(callback: (event: EventItem) => void) {
    this.on('event', callback);
    return () => this.off('event', callback);
  }
}

export const eventBus = new EventBus();
export const logEvent = eventBus.logEvent.bind(eventBus);
export const getRecentEvents = eventBus.getRecentEvents.bind(eventBus);
export const subscribeEvents = eventBus.subscribe.bind(eventBus);
