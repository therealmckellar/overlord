/**
 * Zustand Store — Messages
 * Per-session message management for WS1 + WS3
 */

import { create } from 'zustand';
import { generateId } from '@/utils/helpers';
import type { Message } from '@/types';
import { useJournalStore } from './journalStore';

interface MessageState {
  // Map of sessionId -> messages
  messagesBySession: Record<string, Message[]>;
  streamingContent: string;
  isStreaming: boolean;

  // Actions
  addMessage: (sessionId: string, content: string, sender: Message['sender']) => Message;
  updateMessage: (sessionId: string, messageId: string, updates: Partial<Message>) => void;
  deleteMessage: (sessionId: string, messageId: string) => void;
  getMessages: (sessionId: string) => Message[];
  clearMessages: (sessionId: string) => void;

  // Streaming
  setStreamingContent: (content: string) => void;
  setIsStreaming: (streaming: boolean) => void;
  appendStreamChunk: (chunk: string) => void;
  clearStream: () => void;
}

export const useMessageStore = create<MessageState>()((set, get) => ({
  messagesBySession: {},
  streamingContent: '',
  isStreaming: false,

  addMessage: (sessionId, content, sender) => {
    const message: Message = {
      id: generateId(12),
      sessionId,
      content,
      sender,
      timestamp: Date.now(),
    };
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: [...(state.messagesBySession[sessionId] || []), message],
      },
    }));

    // Auto-log to journal
    useJournalStore.getState().addEntry(sessionId, 'message', `${sender.role === 'user' ? 'User' : 'AI'} sent a message`);

    return message;
  },

  updateMessage: (sessionId, messageId, updates) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: (state.messagesBySession[sessionId] || []).map((m) =>
          m.id === messageId ? { ...m, ...updates } : m
        ),
      },
    })),

  deleteMessage: (sessionId, messageId) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: (state.messagesBySession[sessionId] || []).filter(
          (m) => m.id !== messageId
        ),
      },
    })),

  getMessages: (sessionId) => {
    return get().messagesBySession[sessionId] || [];
  },

  clearMessages: (sessionId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...rest } = state.messagesBySession;
      return { messagesBySession: rest };
    }),

  setStreamingContent: (content) => set({ streamingContent: content }),
  setIsStreaming: (streaming) => set({ isStreaming: streaming }),
  appendStreamChunk: (chunk) =>
    set((state) => ({ streamingContent: state.streamingContent + chunk })),
  clearStream: () => set({ streamingContent: '', isStreaming: false }),
}));
