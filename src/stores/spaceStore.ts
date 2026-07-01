/**
 * Zustand Store — Spaces (Perplexity-style workspaces)
 * Each Space groups threads, files, custom instructions, and members
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SpaceFile {
  id: string;
  name: string;
  type: string;       // mime type
  size: number;
  uploadedAt: number;
  url?: string;       // local/object URL
}

export interface SpaceArtifact {
  id: string;
  title: string;
  type: 'document' | 'code' | 'image' | 'data' | 'other';
  content: string;      // text content or base64 for images
  createdAt: number;
  updatedAt: number;
}

export interface SpaceAttachment {
  id: string;
  name: string;
  type: string;         // mime type
  size: number;
  url: string;          // stored URL / object URL
  uploadedAt: number;
  description?: string;
}

export interface SpaceLink {
  id: string;
  title: string;
  url: string;
  description?: string;
  category?: string;    // e.g. 'docs', 'api', 'reference', 'repo'
  addedAt: number;
}

export interface SpaceMember {
  id: string;
  name: string;
  role: 'owner' | 'contributor' | 'viewer';
  avatar?: string;
}

export interface SpaceThreadMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface SpaceThread {
  id: string;
  title: string;
  lastActivity: number;
  messageCount: number;
  messages: SpaceThreadMessage[];
}

export interface Space {
  id: string;
  name: string;
  description: string;
  masterPrompt: string;            // master system prompt for the space
  customInstructions: string;      // supplementary AI instructions
  model: string;                   // default model for chats in this space
  provider: string;                // default provider (e.g. 'openrouter')
  files: SpaceFile[];
  artifacts: SpaceArtifact[];
  attachments: SpaceAttachment[];
  links: SpaceLink[];
  skills: string[];                // IDs/names of skills assigned to this space
  threads: SpaceThread[];
  pinnedItems: string[];   // ids of pinned threads/files
  members: SpaceMember[];
  color: string;
  icon: string;
  createdAt: number;
  updatedAt: number;
}

const SPACE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];
const SPACE_ICONS = ['📁', '🔬', '💼', '🎯', '📊', '🚀', '📝', '🧪'];

function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

interface SpaceState {
  spaces: Space[];
  activeSpaceId: string | null;

  // Actions
  createSpace: (name: string, description?: string, masterPrompt?: string) => Space;
  updateSpace: (id: string, updates: Partial<Space>) => void;
  deleteSpace: (id: string) => void;
  setActiveSpace: (id: string | null) => void;

  // Master Prompt & Description
  setMasterPrompt: (spaceId: string, prompt: string) => void;
  setDescription: (spaceId: string, description: string) => void;
  setSpaceModel: (spaceId: string, model: string) => void;
  setSpaceProvider: (spaceId: string, provider: string) => void;

  // Instructions
  setCustomInstructions: (spaceId: string, instructions: string) => void;

  // Threads
  activeThreadId: string | null;
  addThread: (spaceId: string, thread: Omit<SpaceThread, 'id'>) => void;
  removeThread: (spaceId: string, threadId: string) => void;
  setActiveThread: (threadId: string | null) => void;
  addThreadMessage: (spaceId: string, threadId: string, message: Omit<SpaceThreadMessage, 'id' | 'timestamp'>) => void;
  removeThreadMessage: (spaceId: string, threadId: string, messageId: string) => void;
  updateThreadTitle: (spaceId: string, threadId: string, title: string) => void;

  // Files
  addFile: (spaceId: string, file: Omit<SpaceFile, 'id' | 'uploadedAt'>) => void;
  removeFile: (spaceId: string, fileId: string) => void;

  // Artifacts
  addArtifact: (spaceId: string, artifact: Omit<SpaceArtifact, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateArtifact: (spaceId: string, artifactId: string, updates: Partial<SpaceArtifact>) => void;
  removeArtifact: (spaceId: string, artifactId: string) => void;

  // Attachments
  addAttachment: (spaceId: string, attachment: Omit<SpaceAttachment, 'id' | 'uploadedAt'>) => void;
  removeAttachment: (spaceId: string, attachmentId: string) => void;

  // Links
  addLink: (spaceId: string, link: Omit<SpaceLink, 'id' | 'addedAt'>) => void;
  updateLink: (spaceId: string, linkId: string, updates: Partial<SpaceLink>) => void;
  removeLink: (spaceId: string, linkId: string) => void;

  // Skills
  addSkill: (spaceId: string, skillName: string) => void;
  removeSkill: (spaceId: string, skillName: string) => void;

  // Members
  addMember: (spaceId: string, member: Omit<SpaceMember, 'id'>) => void;
  removeMember: (spaceId: string, memberId: string) => void;

  // Pinning
  togglePin: (spaceId: string, itemId: string) => void;

  // Getters
  getActiveSpace: () => Space | null;
}

export const useSpaceStore = create<SpaceState>()(
  persist(
    (set, get) => ({
      spaces: [],
      activeSpaceId: null,
      activeThreadId: null,

      createSpace: (name, description, masterPrompt) => {
        const space: Space = {
          id: generateId(),
          name,
          description: description || '',
          masterPrompt: masterPrompt || '',
          customInstructions: '',
          model: '',
          provider: '',
          files: [],
          artifacts: [],
          attachments: [],
          links: [],
          skills: [],
          threads: [],
          pinnedItems: [],
          members: [{ id: 'owner', name: 'Rich', role: 'owner' }],
          color: SPACE_COLORS[get().spaces.length % SPACE_COLORS.length],
          icon: SPACE_ICONS[get().spaces.length % SPACE_ICONS.length],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ spaces: [...state.spaces, space] }));
        return space;
      },

      updateSpace: (id, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
          ),
        })),

      deleteSpace: (id) =>
        set((state) => ({
          spaces: state.spaces.filter((s) => s.id !== id),
          activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId,
        })),

      setActiveSpace: (id) => set({ activeSpaceId: id }),

      setCustomInstructions: (spaceId, instructions) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, customInstructions: instructions, updatedAt: Date.now() } : s
          ),
        })),

      setMasterPrompt: (spaceId, prompt) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, masterPrompt: prompt, updatedAt: Date.now() } : s
          ),
        })),

      setDescription: (spaceId, description) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, description, updatedAt: Date.now() } : s
          ),
        })),

      setSpaceModel: (spaceId, model) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, model, updatedAt: Date.now() } : s
          ),
        })),

      setSpaceProvider: (spaceId, provider) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId ? { ...s, provider, updatedAt: Date.now() } : s
          ),
        })),

      addThread: (spaceId, thread) => {
        const newThread = { ...thread, id: generateId(), messages: thread.messages || [] };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, threads: [...s.threads, newThread], updatedAt: Date.now() }
              : s
          ),
          activeThreadId: newThread.id,
        }));
      },

      removeThread: (spaceId, threadId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, threads: s.threads.filter((t) => t.id !== threadId), updatedAt: Date.now() }
              : s
          ),
          activeThreadId: state.activeThreadId === threadId ? null : state.activeThreadId,
        })),

      setActiveThread: (threadId) => set({ activeThreadId: threadId }),

      addThreadMessage: (spaceId, threadId, message) => {
        const newMsg: SpaceThreadMessage = { ...message, id: generateId(), timestamp: Date.now() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  threads: s.threads.map((t) =>
                    t.id === threadId
                      ? { ...t, messages: [...t.messages, newMsg], messageCount: t.messageCount + 1, lastActivity: Date.now() }
                      : t
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      removeThreadMessage: (spaceId, threadId, messageId) => {
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  threads: s.threads.map((t) =>
                    t.id === threadId
                      ? { ...t, messages: t.messages.filter((m) => m.id !== messageId), messageCount: Math.max(0, t.messageCount - 1) }
                      : t
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      updateThreadTitle: (spaceId, threadId, title) => {
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  threads: s.threads.map((t) =>
                    t.id === threadId ? { ...t, title, lastActivity: Date.now() } : t
                  ),
                  updatedAt: Date.now(),
                }
              : s
          ),
        }));
      },

      addFile: (spaceId, file) => {
        const newFile: SpaceFile = { ...file, id: generateId(), uploadedAt: Date.now() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, files: [...s.files, newFile], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeFile: (spaceId, fileId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, files: s.files.filter((f) => f.id !== fileId), updatedAt: Date.now() }
              : s
          ),
        })),

      // Artifacts
      addArtifact: (spaceId, artifact) => {
        const now = Date.now();
        const newArtifact: SpaceArtifact = { ...artifact, id: generateId(), createdAt: now, updatedAt: now };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, artifacts: [...s.artifacts, newArtifact], updatedAt: now }
              : s
          ),
        }));
      },

      updateArtifact: (spaceId, artifactId, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, artifacts: s.artifacts.map((a) => a.id === artifactId ? { ...a, ...updates, updatedAt: Date.now() } : a), updatedAt: Date.now() }
              : s
          ),
        })),

      removeArtifact: (spaceId, artifactId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, artifacts: s.artifacts.filter((a) => a.id !== artifactId), updatedAt: Date.now() }
              : s
          ),
        })),

      // Attachments
      addAttachment: (spaceId, attachment) => {
        const newAttachment: SpaceAttachment = { ...attachment, id: generateId(), uploadedAt: Date.now() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, attachments: [...s.attachments, newAttachment], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeAttachment: (spaceId, attachmentId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, attachments: s.attachments.filter((a) => a.id !== attachmentId), updatedAt: Date.now() }
              : s
          ),
        })),

      // Links
      addLink: (spaceId, link) => {
        const newLink: SpaceLink = { ...link, id: generateId(), addedAt: Date.now() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, links: [...s.links, newLink], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      updateLink: (spaceId, linkId, updates) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, links: s.links.map((l) => l.id === linkId ? { ...l, ...updates } : l), updatedAt: Date.now() }
              : s
          ),
        })),

      removeLink: (spaceId, linkId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, links: s.links.filter((l) => l.id !== linkId), updatedAt: Date.now() }
              : s
          ),
        })),

      addSkill: (spaceId, skillName) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, skills: s.skills.includes(skillName) ? s.skills : [...s.skills, skillName], updatedAt: Date.now() }
              : s
          ),
        })),

      removeSkill: (spaceId, skillName) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, skills: s.skills.filter((sk) => sk !== skillName), updatedAt: Date.now() }
              : s
          ),
        })),

      addMember: (spaceId, member) => {
        const newMember = { ...member, id: generateId() };
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, members: [...s.members, newMember], updatedAt: Date.now() }
              : s
          ),
        }));
      },

      removeMember: (spaceId, memberId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? { ...s, members: s.members.filter((m) => m.id !== memberId), updatedAt: Date.now() }
              : s
          ),
        })),

      togglePin: (spaceId, itemId) =>
        set((state) => ({
          spaces: state.spaces.map((s) =>
            s.id === spaceId
              ? {
                  ...s,
                  pinnedItems: s.pinnedItems.includes(itemId)
                    ? s.pinnedItems.filter((id) => id !== itemId)
                    : [...s.pinnedItems, itemId],
                  updatedAt: Date.now(),
                }
              : s
          ),
        })),

      getActiveSpace: () => {
        const { spaces, activeSpaceId } = get();
        return spaces.find((s) => s.id === activeSpaceId) || null;
      },
    }),
    {
      name: 'overlord-space-store',
      partialize: (state) => ({ spaces: state.spaces.slice(0, 30).map(s => ({ ...s, threads: s.threads.slice(0, 20).map(t => ({ ...t, messages: t.messages.slice(-50) })) })), activeSpaceId: state.activeSpaceId }),
    }
  )
);
