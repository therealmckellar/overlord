# Overlord Feature Spec — 34 Features

Migrating Agent OS (monolithic HTML/JS) to Next.js 16 + React 19 + Tailwind 4.

## WS1: Chat Core (Features 1, 10, 11)
- **F1 — SSE Streaming**: Server-Sent Events for real-time message delivery. Each token/block streams to client as it's generated.
- **F10 — Reconnect Logic**: Auto-reconnect on SSE disconnect with exponential backoff (max 5 attempts). Resume from last received message ID.
- **F11 — Message Rendering**: Render streaming messages in real-time. Support partial message updates (append tokens). Smooth scroll-to-bottom on new content.

## WS2: Session Management (Features 2, 4, 30, 31)
- **F2 — Session CRUD**: Create, rename, delete chat sessions. Each session has unique ID, title, created_at, updated_at.
- **F4 — Session Persistence**: Persist sessions to localStorage (fallback: IndexedDB). Load on app init. Debounce writes.
- **F30 — Session Journaling**: Append-only journal per session. Track: messages sent, files uploaded, commands used. Persist with session.
- **F31 — Session Export**: Export session as JSON or Markdown. Include full message history + metadata.

## WS3: Chat UI (Features 7, 8, 9, 12, 13, 14, 24, 25)
- **F7 — Markdown Rendering**: Full markdown support (CommonMark + GFM tables, strikethrough, task lists).
- **F8 — Code Blocks**: Syntax-highlighted code blocks with copy button. Language detection. Use rehype-highlight or shiki.
- **F9 — Typing Indicator**: Animated dots when agent is "typing". Show agent name. Hide on first token received.
- **F12 — Timestamps**: Show relative time ("2m ago"). Toggle to absolute on hover. Group by date separator.
- **F13 — Avatars**: User and agent avatars. Fallback to initials with color hash. Configurable per-agent.
- **F14 — Reactions**: Emoji reactions on messages. Toggle reaction. Show count. Common quick-reaction bar.
- **F24 — Search**: Full-text search across all sessions. Highlight matches. Keyboard shortcut to focus (Cmd/Ctrl+K).
- **F25 — Pinned Messages**: Pin important messages within a session. Pin list in sidebar. Unpin capability.

## WS4: Input & Commands (Features 3, 6, 15, 22, 26, 27, 28, 34)
- **F3 — Slash Commands**: `/command` parser. Built-in commands: /help, /clear, /export, /settings. Extensible registry.
- **F6 — Autocomplete**: Tab-complete for slash commands and mentions. Fuzzy match. Show description preview.
- **F15 — Keyboard Shortcuts**: Cmd+Enter send, Cmd+K search, Cmd+/ focus input, Esc close panels. Shortcut help modal.
- **F22 — Voice Input**: Web Speech API voice-to-text. Toggle button. Visual feedback while recording. Auto-send on pause.
- **F26 — Emoji Picker**: Native emoji picker panel. Recent emojis. Search emoji by name. Insert at cursor position.
- **F27 — Mentions**: @mention agent/person. Autocomplete dropdown. Highlight in message. Notification trigger.
- **F28 — Command Palette**: Cmd+Shift+P opens palette. Fuzzy search across all commands, sessions, actions.
- **F34 — Settings**: User preferences panel. Theme, font size, notification preferences, keyboard shortcut customization.

## WS5: File Uploads (Feature 5)
- **F5 — Drag-Drop + Preview + Progress**: Drag files onto chat area. Image preview thumbnail. Upload progress bar. Error states. Max file size config. Supported: images, PDFs, text files.

## WS6: UX Polish (Features 16, 17, 18, 19, 20, 21, 23, 29, 32, 33)
- **F16 — Themes**: 5 themes (light, dark, system, high-contrast, navy). CSS variable-based. Instant switch. Persist preference.
- **F17 — Responsive**: Mobile-first. Breakpoints: sm, md, lg. Collapsible sidebar on mobile. Touch-friendly.
- **F18 — Animations**: Smooth transitions. Message fade-in. Sidebar slide. Loading skeletons. Reduce-motion respect.
- **F19 — Notifications**: Toast notifications for: new message, error, success, info. Auto-dismiss. Action buttons. Position config.
- **F20 — Sounds**: Optional sound effects for: message sent, message received, error. Volume control. Persist preference.
- **F21 — Tooltips**: Contextual tooltips on icon buttons. Delayed show. Keyboard-accessible.
- **F23 — Breadcrumbs**: Show current context path. Navigate back. Collapsible on mobile.
- **F29 — Status Bar**: Bottom bar showing: connection status, session name, message count, typing status.
- **F32 — Keyboard Navigation**: Full keyboard accessible. Tab order. Focus management. Skip links.
- **F33 — Accessibility**: ARIA labels. Screen reader announcements. Color contrast WCAG AA. Focus indicators.

## Shared Infrastructure (Phase 0)
- **Component folder structure** — co-located by feature
- **Shared types** — TypeScript interfaces for Session, Message, User, etc.
- **Tailwind theme tokens** — extended theme for colors, spacing, animations
- **Global state** — Zustand stores: chatStore, sessionStore, uiStore, settingsStore
- **API route stubs** — /api/chat (SSE), /api/sessions, /api/upload, /api/export
- **Layout shell** — Header, Sidebar with nav, main content area, ThemeProvider
