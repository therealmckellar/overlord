'use client';

import { useCallback, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';

interface SendMessageOptions {
  sessionId: string;
  persona: string;
  model: string;
}

const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY_MS = 1000;
const RECONNECT_DELAY_CAP_MS = 30000;

function getReconnectDelay(attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s (capped at 30s)
  return Math.min(BASE_RECONNECT_DELAY_MS * Math.pow(2, attempt), RECONNECT_DELAY_CAP_MS);
}

export function useChatStream({ sessionId, persona, model }: SendMessageOptions) {
  const addMessage = useMessageStore((s) => s.addMessage);
  const setStreamingContent = useMessageStore((s) => s.setStreamingContent);
  const setIsStreaming = useMessageStore((s) => s.setIsStreaming);
  const appendStreamChunk = useMessageStore((s) => s.appendStreamChunk);
  const addToast = useUIStore((s) => s.addToast);
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const updateSession = useSessionStore((s) => s.updateSession);

  const abortRef = useRef<AbortController | null>(null);
  const reconnectAttempts = useRef(0);
  const lastMessageId = useRef<string | null>(null);

  const doFetch = useCallback(async (
    messages: { sender: { role: string }; content: string }[],
    session: { id: string },
    signal: AbortSignal,
  ): Promise<{ success: boolean; assistantContent: string }> => {
    let assistantContent = '';

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-persona': persona,
        'x-model': model,
        ...(lastMessageId.current ? { 'x-resume-from': lastMessageId.current } : {}),
      },
      body: JSON.stringify({ messages, session }),
      signal,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Chat error ${res.status}: ${text}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buf += decoder.decode(value, { stream: true });

      while (true) {
        const eventEnd = buf.indexOf('\n\n');
        if (eventEnd === -1) break;

        const eventBlock = buf.slice(0, eventEnd);
        buf = buf.slice(eventEnd + 2);

        let eventType = '';
        let dataStr = '';
        for (const line of eventBlock.split('\n')) {
          if (line.startsWith('event: ')) eventType = line.slice(7).trim();
          else if (line.startsWith('data: ')) dataStr = line.slice(6);
        }

        if (!eventType || !dataStr) continue;

        let parsed: { content: string; id?: string };
        try {
          parsed = JSON.parse(dataStr);
        } catch {
          parsed = { content: dataStr };
        }

        if (eventType === 'chunk') {
          assistantContent += parsed.content;
          appendStreamChunk(parsed.content);
          // Track last message ID for resume
          if (parsed.id) lastMessageId.current = parsed.id;
        } else if (eventType === 'done') {
          if (assistantContent.trim()) {
            addMessage(sessionId, assistantContent, {
              id: 'assistant',
              name: persona.charAt(0).toUpperCase() + persona.slice(1),
              role: 'assistant',
            });
          }
          return { success: true, assistantContent };
        } else if (eventType === 'error') {
          throw new Error(parsed.content || 'Stream error');
        }
      }
    }

    // Stream ended without done event
    if (assistantContent.trim()) {
      addMessage(sessionId, assistantContent, {
        id: 'assistant',
        name: persona.charAt(0).toUpperCase() + persona.slice(1),
        role: 'assistant',
      });
    }
    return { success: true, assistantContent };
  }, [sessionId, persona, model, addMessage, appendStreamChunk]);

  const sendMessage = useCallback(async (content: string) => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    addMessage(sessionId, content, {
      id: 'user',
      name: 'You',
      role: 'user',
    });

    const allMessages = useMessageStore.getState().messagesBySession[sessionId] || [];
    const recentMessages = allMessages.slice(-20).map((m) => ({
      sender: { role: m.sender.role },
      content: m.content,
    }));

    setIsStreaming(true);
    setStreamingContent('');
    setConnectionStatus('connected');
    reconnectAttempts.current = 0;

    const trySend = async (): Promise<string> => {
      try {
        const result = await doFetch(
          recentMessages,
          { id: sessionId },
          controller.signal,
        );
        reconnectAttempts.current = 0;
        setConnectionStatus('connected');
        return result.assistantContent;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err; // Don't reconnect on user abort
        }

        // Attempt reconnect with exponential backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const attempt = reconnectAttempts.current;
          reconnectAttempts.current = attempt + 1;
          setConnectionStatus('reconnecting');

          addToast({
            type: 'warning',
            message: `Connection lost. Reconnecting (${attempt + 1}/${MAX_RECONNECT_ATTEMPTS})…`,
            duration: 3000,
          });

          const delay = getReconnectDelay(attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));

          if (!controller.signal.aborted) {
            return trySend();
          }
        }

        setConnectionStatus('offline');
        addToast({
          type: 'error',
          message: 'Connection lost. Click Reconnect to try again.',
          duration: 0, // persists until dismissed
        });
        throw err;
      }
    };

    let assistantContent = '';
    try {
      assistantContent = await trySend();

      updateSession(sessionId, {
        updatedAt: Date.now(),
        lastMessage: {
          content: assistantContent || content,
          sender: 'assistant',
          timestamp: Date.now(),
        },
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Save partial content on abort
        const partial = useMessageStore.getState().streamingContent;
        if (partial.trim()) {
          addMessage(sessionId, partial, {
            id: 'assistant',
            name: persona.charAt(0).toUpperCase() + persona.slice(1),
            role: 'assistant',
          });
        }
      } else {
        const message = err instanceof Error ? err.message : 'Chat failed';
        addToast({ type: 'error', message, duration: 5000 });
        addMessage(sessionId, `⚠️ ${message}`, {
          id: 'system',
          name: 'System',
          role: 'system',
        });
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
      abortRef.current = null;
    }
  }, [sessionId, persona, model, addMessage, setStreamingContent, setIsStreaming, appendStreamChunk, addToast, setConnectionStatus, updateSession, doFetch]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    setConnectionStatus('reconnecting');
    reconnectAttempts.current = 0;
    // Re-trigger send with last user message if available
    const allMsgs = useMessageStore.getState().messagesBySession[sessionId];
    const lastUserMsg = allMsgs?.filter((m) => m.sender.role === 'user').slice(-1)[0];
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  }, [sessionId, sendMessage]);

  return { sendMessage, cancelStream, reconnect };
}
