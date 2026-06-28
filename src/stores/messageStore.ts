/**
 * Zustand Store — Messages
 * Per-session message management for WS1 + WS3
 */

import { create } from 'zustand';
import { generateId } from '@/utils/helpers';
import type { Message } from '@/types';


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

  // Reactions
  toggleReaction: (sessionId: string, messageId: string, emoji: string, userId: string, userName: string) => void;

  // Pinning
  togglePin: (sessionId: string, messageId: string) => void;
  getPinnedMessages: (sessionId: string) => Message[];
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

  // Reactions
  toggleReaction: (sessionId, messageId, emoji, userId, userName) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || [];
      const updated = messages.map((m) => {
        if (m.id !== messageId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        const existingIdx = reactions.findIndex(
          (r) => r.emoji === emoji && r.userId === userId,
        );
        if (existingIdx >= 0) {
          reactions.splice(existingIdx, 1);
        } else {
          reactions.push({ emoji, userId, userName });
        }
        return { ...m, reactions };
      });
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      };
    }),

  // Pinning
  togglePin: (sessionId, messageId) =>
    set((state) => {
      const messages = state.messagesBySession[sessionId] || [];
      const updated = messages.map((m) =>
        m.id === messageId ? { ...m, pinned: !m.pinned } : m,
      );
      return {
        messagesBySession: { ...state.messagesBySession, [sessionId]: updated },
      };
    }),

  getPinnedMessages: (sessionId) => {
    const messages = get().messagesBySession[sessionId] || [];
    return messages.filter((m) => m.pinned);
  },
}));
