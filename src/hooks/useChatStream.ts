'use client';

import { useCallback, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';

interface SendMessageOptions {
  sessionId: string;
  persona: string;
}

export function useChatStream({ sessionId, persona }: SendMessageOptions) {
  const addMessage = useMessageStore((s) => s.addMessage);
  const setStreamingContent = useMessageStore((s) => s.setStreamingContent);
  const setIsStreaming = useMessageStore((s) => s.setIsStreaming);
  const appendStreamChunk = useMessageStore((s) => s.appendStreamChunk);
  const addToast = useUIStore((s) => s.addToast);
  const updateSession = useSessionStore((s) => s.updateSession);

  const abortRef = useRef<AbortController | null>(null);

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

    let assistantContent = '';
    let gotDone = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-persona': persona,
        },
        body: JSON.stringify({
          messages: recentMessages,
          session: { id: sessionId },
        }),
        signal: controller.signal,
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

          let parsed: { content: string };
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            parsed = { content: dataStr };
          }

          if (eventType === 'chunk') {
            assistantContent += parsed.content;
            appendStreamChunk(parsed.content);
          } else if (eventType === 'done') {
            gotDone = true;
            if (assistantContent.trim()) {
              addMessage(sessionId, assistantContent, {
                id: 'assistant',
                name: persona.charAt(0).toUpperCase() + persona.slice(1),
                role: 'assistant',
              });
            }
          } else if (eventType === 'error') {
            addToast({ type: 'error', message: parsed.content, duration: 5000 });
          }
        }
      }

      // If stream ended without a done event, save what we have
      if (!gotDone && assistantContent.trim()) {
        addMessage(sessionId, assistantContent, {
          id: 'assistant',
          name: persona.charAt(0).toUpperCase() + persona.slice(1),
          role: 'assistant',
        });
      }

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
        if (assistantContent.trim()) {
          addMessage(sessionId, assistantContent, {
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
  }, [sessionId, persona, addMessage, setStreamingContent, setIsStreaming, appendStreamChunk, addToast, updateSession]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { sendMessage, cancelStream };
}
