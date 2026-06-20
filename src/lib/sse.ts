import { SSEEvent } from '@/types';

export type SSEHandler = (event: SSEEvent) => void;

export class SSEClient {
  private url: string;
  private eventSource: EventSource | null = null;
  private buffer: SSEEvent[] = [];
  private maxBufferSize = 100;
  private lastEventId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private backoffSchedule = [1000, 2000, 4000, 8000, 16000];

  private onMessageHandler: SSEHandler | null = null;
  private onErrorHandler: ((error: Event) => void) | null = null;
  private onReconnectHandler: (() => void) | null = null;

  constructor(url: string) {
    this.url = url;
  }

  public setOnMessage(handler: SSEHandler) {
    this.onMessageHandler = handler;
  }

  public setOnError(handler: (error: Event) => void) {
    this.onErrorHandler = handler;
  }

  public setOnReconnect(handler: () => void) {
    this.onReconnectHandler = handler;
  }

  public connect(): void {
    if (this.eventSource) {
      this.disconnect();
    }

    // Note: Native EventSource does not support custom headers.
    // For Last-Event-ID, the server typically handles it via the 'Last-Event-ID' header
    // sent by the browser automatically during reconnect if the server provided IDs.
    // However, some implementations require a query param or a polyfill.
    // For this robust implementation, we use the native EventSource.
    
    const connectionUrl = this.lastEventId 
      ? `${this.url}?lastEventId=${this.lastEventId}` 
      : this.url;

    this.eventSource = new EventSource(connectionUrl);

    this.eventSource.onmessage = (event) => {
      this.handleEvent({
        type: 'message',
        data: event.data,
        id: event.lastEventId || undefined,
      });
    };

    // Listen for custom event types (chunk, done, error, typing, presence)
    const customTypes: SSEEvent['type'][] = ['chunk', 'done', 'error', 'typing', 'presence'];
    customTypes.forEach(type => {
      this.eventSource?.addEventListener(type, (event: MessageEvent) => {
        this.handleEvent({
          type,
          data: event.data as string,
          id: (event as any).lastEventId || undefined,
        });
      });
    });

    this.eventSource.onerror = (error) => {
      this.handleError(error);
    };
  }

  private handleEvent(event: SSEEvent): void {
    if (event.id) {
      this.lastEventId = event.id;
    }

    // Ring buffer storage
    this.buffer.push(event);
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift();
    }

    this.reconnectAttempts = 0; // Reset attempts on successful message

    if (this.onMessageHandler) {
      this.onMessageHandler(event);
    }
  }

  private handleError(error: Event): void {
    if (this.onErrorHandler) {
      this.onErrorHandler(error);
    }

    this.disconnect();
    this.reconnect();
  }

  public reconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('SSEClient: Max reconnect attempts reached. Giving up.');
      return;
    }

    const delay = this.backoffSchedule[this.reconnectAttempts] || 16000;
    this.reconnectAttempts++;

    setTimeout(() => {
      if (this.onReconnectHandler) {
        this.onReconnectHandler();
      }
      this.connect();
    }, delay);
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public getBufferedEvents(): SSEEvent[] {
    return [...this.buffer];
  }
}
