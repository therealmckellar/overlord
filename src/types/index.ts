/**
 * Shared Types for Agent OS / Overlord
 * Single source of truth for all workstreams
 */

// ============================================================
// MESSAGES
// ============================================================

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnailUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    role: 'user' | 'assistant' | 'system';
  };
  timestamp: number;
  updatedAt?: number;
  attachments?: Attachment[];
  reactions?: MessageReaction[];
  pinned?: boolean;
  isStreaming?: boolean;
  replyTo?: string; // message ID being replied to
}

// ============================================================
// SESSIONS
// ============================================================

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messageCount: number;
  pinned: boolean;
  archived: boolean;
  unreadCount: number;
  lastMessage: {
    content: string;
    sender: string;
    timestamp: number;
  } | null;
}

export interface SessionMeta {
  id: string;
  title: string;
  updatedAt: number;
  messageCount: number;
  pinned: boolean;
  archived: boolean;
}

// ============================================================
// SLASH COMMANDS
// ============================================================

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
  category: 'session' | 'chat' | 'system' | 'utility' | 'fun';
  execute: (args: string) => CommandResult;
}

export interface CommandResult {
  type: 'text' | 'action' | 'error' | 'redirect';
  content?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================
// VOICE
// ============================================================

export interface VoiceState {
  isRecording: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
}

// ============================================================
// MENTIONS
// ============================================================

export interface MentionableUser {
  id: string;
  name: string;
  avatar?: string;
  online?: boolean;
}

// ============================================================
// THEMES
// ============================================================

export type ThemeName = 'dark' | 'light' | 'midnight' | 'forest' | 'arctic' | 'system';
// Note: config/themes.ts defines the canonical theme keys. This type must match exactly.

export interface ThemeColors {
  bg: string;
  bgSecondary: string;
  bgTertiary: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  accent: string;
  accentHover: string;
  accentMuted: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  userBubble: string;
  assistantBubble: string;
  codeBg: string;
  codeText: string;
  shadow: string;
  overlay: string;
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message?: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    href?: string;
    onClick: () => void;
  };
}

// ============================================================
// FILE UPLOAD
// ============================================================

export interface UploadProgress {
  id: string;
  file: File;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
  url?: string;
}

// ============================================================
// SETTINGS
// ============================================================

export interface Settings {
  // Appearance
  theme: ThemeName;
  fontSize: 'sm' | 'base' | 'lg';
  compactMode: boolean;

  // Chat
  enterToSend: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
  markdownEnabled: boolean;

  // Notifications
  notificationsEnabled: boolean;
  soundsEnabled: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;

  // Sidebar
  sidebarOpen: boolean;
  sidebarWidth: number;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  fontSize: 'base',
  compactMode: false,
  enterToSend: true,
  showTimestamps: true,
  showAvatars: true,
  markdownEnabled: true,
  notificationsEnabled: true,
  soundsEnabled: true,
  reducedMotion: false,
  highContrast: false,
  sidebarOpen: true,
  sidebarWidth: 260,
};

// ============================================================
// SSE / STREAMING
// ============================================================

export interface SSEEvent {
  type: 'message' | 'chunk' | 'done' | 'error' | 'typing' | 'presence' | 'bg_task_complete';
  data: string;
  id?: string;
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

export interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: 'navigation' | 'chat' | 'commands' | 'accessibility';
  action: () => void;
}
