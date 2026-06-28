'use client';

import { useCallback, useRef } from 'react';
import { useMessageStore } from '@/stores/messageStore';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';

interface SendMessageOptions {
  sessionId: string;
  persona: string;
  model: string;
  systemPrompt?: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;

export function useChatStream({ sessionId, persona, model, systemPrompt }: SendMessageOptions) {
  const addMessage = useMessageStore((s) => s.addMessage);
  const setStreamingContent = useMessageStore((s) => s.setStreamingContent);
  const setIsStreaming = useMessageStore((s) => s.setIsStreaming);
  const appendStreamChunk = useMessageStore((s) => s.appendStreamChunk);
  const addToast = useUIStore((s) => s.addToast);
  const setConnectionStatus = useUIStore((s) => s.setConnectionStatus);
  const updateSession = useSessionStore((s) => s.updateSession);

  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Abort any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    // Add user message
    addMessage(sessionId, content, {
      id: 'user',
      name: 'You',
      role: 'user',
    });

    setIsStreaming(true);
    setStreamingContent('');
    setConnectionStatus('connecting');

    // Build message history (last 20 messages)
    const allMessages = useMessageStore.getState().messagesBySession[sessionId] || [];
    const recentMessages = allMessages.slice(-20).map((m) => ({
      sender: { role: m.sender.role },
      content: m.content,
    }));

    let assistantContent = '';

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'x-persona': persona,
          'x-model': model,
        },
        body: JSON.stringify({
          messages: recentMessages,
          model,
          systemPrompt: systemPrompt || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Chat error ${res.status}: ${text.slice(0, 200)}`);
      }

      setConnectionStatus('connected');

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });

        // Parse SSE events
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

          let parsed: { content?: string; id?: string };
          try {
            parsed = JSON.parse(dataStr);
          } catch {
            parsed = {};
          }

          if (eventType === 'chunk' && parsed.content) {
            assistantContent += parsed.content;
            appendStreamChunk(parsed.content);
          } else if (eventType === 'done') {
            // Stream complete
          } else if (eventType === 'error') {
            throw new Error(parsed.content || 'Stream error');
          }
        }
      }

      // Save the final assistant message
      if (assistantContent.trim()) {
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

      // Auto-title: if session still has default title, generate one from first user message
      const session = useSessionStore.getState().getSessionById(sessionId);
      if (session && /^Chat \d+$/.test(session.title)) {
        const autoTitle = content.length > 50
          ? content.slice(0, 47).trim() + '...'
          : content;
        useSessionStore.getState().renameSession(sessionId, autoTitle);
      }

      // Auto-record journal entry for significant conversations
      if (assistantContent.trim()) {
        const today = new Date().toISOString().split('T')[0];
        useSharedMemoryStore.getState().addJournal({
          date: today,
          content: `Chat with ${persona}: ${content.slice(0, 100)}${content.length > 100 ? '...' : ''}`,
          type: 'built',
          agentName: persona.charAt(0).toUpperCase() + persona.slice(1),
        });
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // User cancelled — save partial content
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
        setConnectionStatus('offline');
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
  }, [sessionId, persona, model, systemPrompt, addMessage, setStreamingContent, setIsStreaming, appendStreamChunk, addToast, setConnectionStatus, updateSession]);

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const reconnect = useCallback(() => {
    setConnectionStatus('reconnecting');
    const allMsgs = useMessageStore.getState().messagesBySession[sessionId];
    const lastUserMsg = allMsgs?.filter((m) => m.sender.role === 'user').slice(-1)[0];
    if (lastUserMsg) {
      sendMessage(lastUserMsg.content);
    }
  }, [sessionId, sendMessage]);

  return { sendMessage, cancelStream, reconnect };
}
