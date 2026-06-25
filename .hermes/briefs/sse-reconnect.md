SSE Auto-Connect + Auto-Reconnect for Overlord Chat

## Context
Overlord is a Next.js 16 + React 19 + Tailwind 4 app on port 9125. The chat system uses SSE (Server-Sent Events) via /api/chat for streaming AI responses. Currently when the connection drops the user sees a broken stream with no recovery.

## Current State
- Chat route: src/app/api/chat/route.ts streams SSE
- Chat hook: src/hooks/useChatStream.ts manages EventSource connection
- Chat composer: src/components/chat/ChatComposer.tsx
- Chat window: src/components/chat/ChatWindow.tsx
- UI store: src/stores/uiStore.ts has connectionStatus field

## Requirements
1. Auto-reconnect on drop: exponential backoff 1s → 2s → 4s → max 30s capped at 10 retries
2. Stream reattach: on reconnect send last received message_id so server can resume
3. Heartbeat/ping: server sends keepalive comments every 15s to prevent proxy timeouts
4. Offline detection: if all retries fail show offline status with manual reconnect button in UI
5. Status indicators: connected → reconnecting → offline → connected (update uiStore)
6. Memory cleanup: clear reconnect timers on component unmount
7. Copy-to-clipboard: add copy button on each ChatMessage (copy raw markdown/text)

## Technical Constraints
- Do NOT use useShallow (broken with Zustand v5 + React 19). Use individual scalar selectors only.
- Do NOT use || [] or || {} in selectors. Use module-level constants with ??.
- Do NOT put Zustand actions in useEffect deps. Use getState() in callbacks.
- Must pass npx tsc --noEmit with 0 errors after changes

## Files to Modify
- src/hooks/useChatStream.ts — main SSE auto-reconnect logic
- src/app/api/chat/route.ts — add keepalive comments, support resume-from-message-id
- src/components/chat/ChatMessage.tsx — add copy-to-clipboard button
- src/components/chat/ChatWindow.tsx — offline indicator + manual reconnect button

## Verification
1. npx tsc --noEmit — 0 errors
2. Build: npm run build — success
3. Manual test: kill network connection in DevTools → verify auto-reconnect
4. Status dot cycles: green (connected) → amber pulse (reconnecting) → red (offline)
