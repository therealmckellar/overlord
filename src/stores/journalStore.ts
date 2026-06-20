/**
 * Zustand Store — Journal / Activity Log
 * Per-session activity tracking for WS1 + WS3
 */

import { create } from 'zustand';
import { generateId } from '@/utils/helpers';

export interface JournalEntry {
  id: string;
  sessionId: string;
  type: 'message' | 'status' | 'file' | 'command' | 'system';
  content: string;
  timestamp: number;
}

interface JournalState {
  entriesBySession: Record<string, JournalEntry[]>;

  addEntry: (sessionId: string, type: JournalEntry['type'], content: string) => JournalEntry;
  getEntries: (sessionId: string) => JournalEntry[];
  clearEntries: (sessionId: string) => void;
}

export const useJournalStore = create<JournalState>()((set, get) => ({
  entriesBySession: {},

  addEntry: (sessionId, type, content) => {
    const entry: JournalEntry = {
      id: generateId(8),
      sessionId,
      type,
      content,
      timestamp: Date.now(),
    };
    set((state) => ({
      entriesBySession: {
        ...state.entriesBySession,
        [sessionId]: [...(state.entriesBySession[sessionId] || []), entry],
      },
    }));
    return entry;
  },

  getEntries: (sessionId) => {
    return get().entriesBySession[sessionId] || [];
  },

  clearEntries: (sessionId) =>
    set((state) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [sessionId]: _, ...rest } = state.entriesBySession;
      return { entriesBySession: rest };
    }),
}));
