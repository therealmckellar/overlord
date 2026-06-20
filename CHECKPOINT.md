# Overlord Checkpoint — Phase 0 (In Progress)

**Date:** 2026-06-18
**Phase:** 0 — Scaffolding (3 of 5 sub-tasks done)

---

## Completed

- [x] Project scaffolding — folder structure, shared types, Tailwind theme tokens
- [x] Zustand stores — `stores/index.ts`, `stores/sessionStore.ts`, `stores/uiStore.ts`
- [x] Theme config — `src/config/themes.ts` (5 themes: dark, light, midnight, forest, arctic)
- [x] Shared types — `src/types/index.ts` (Message, Session, Theme, Settings, etc.)
- [x] Custom hooks — `src/hooks/useTheme.ts` (useTheme, useMediaQuery, useBreakpoint, useKeyboardShortcut, useClickOutside, useDebounce, useLocalStorage)
- [x] Global CSS — `src/app/globals.css` (Tailwind 4 import, basic light/dark vars)

## In Progress

- [ ] Layout shell (Header, Sidebar, main content area, theme provider)
- [ ] API route stubs (SSE handler, session CRUD, file upload)

## Known Issues (Must Fix Before Phase 1)

### 1. Duplicate / Divergent Theme Types
- `src/types/index.ts` line 109: `ThemeName = 'dark' | 'light' | 'midnight' | 'nord' | 'system'`
- `src/stores/uiStore.ts` line 10: `ThemeName = 'dark' | 'light' | 'midnight' | 'nord' | 'system'`
- `src/config/themes.ts` keys: `dark`, `light`, `midnight`, `forest`, `arctic` — **no `nord`, no `system`**
- **Mismatch:** types say `nord`/`system`, config has `forest`/`arctic`
- **Fix:** Unify to single `ThemeName` type in `src/types/index.ts`, re-export from there, remove local definitions in uiStore.ts. Config keys must match type union exactly.

### 2. Duplicate / Divergent ThemeColors Interface
- `src/types/index.ts` ThemeColors: `bgPrimary`, `bgSecondary`, `bgTertiary`, `bgElevated`, `bgInput`, `bgHover`, `bgActive`, `textPrimary`, `textSecondary`, `textMuted`, `textAccent`, `accentPrimary`, `accentSecondary`, `borderPrimary`, `borderSecondary`
- `src/config/themes.ts` actual keys: `bg`, `bgSecondary`, `bgTertiary`, `text`, `textSecondary`, `textMuted`, `border`, `accent`, `accentHover`, `accentMuted`, `success`, `warning`, `error`, `info`, `userBubble`, `assistantBubble`, `codeBg`, `codeText`, `shadow`, `overlay`
- **Mismatch:** completely different key names and different number of properties
- **Fix:** Align `ThemeColors` interface in types/index.ts to match the actual config keys, or vice versa. Recommended: use the config keys as source of truth since they're more complete.

### 3. Zustand Not in package.json
- `stores/sessionStore.ts` and `stores/uiStore.ts` both `import { create } from 'zustand'`
- `package.json` does NOT list `zustand` as a dependency
- **Fix:** `npm install zustand` and add to dependencies

### 4. Duplicate `useState` Import in useTheme.ts
- Line 6: `import { useEffect } from 'react';`
- Line 106: `import { useState } from 'react';` (at bottom of file)
- **Fix:** Merge into single import at top: `import { useEffect, useState } from 'react';`

### 5. globals.css Doesn't Use Theme CSS Variables
- Current `:root` only defines `--background` and `--foreground`
- Theme system defines `--bg`, `--bg-secondary`, `--accent`, etc. but they're not in CSS
- **Fix:** Add all theme CSS variables to `:root` in globals.css, mapped from the theme config

### 6. stores/index.ts Re-exports sessionStore and uiStore (Potential Circular Dependency)
- `stores/index.ts` re-exports from `sessionStore.ts` and `uiStore.ts`
- Both those files import from `@/utils/helpers` and `@/types` — no circular issue currently, but watch for it
- **Status:** OK for now, but consolidate if issues arise

---

## File Inventory (Phase 0)

```
src/
  app/
    globals.css          ✅ Tailwind 4, basic vars (needs theme vars)
    layout.tsx           ❌ Not yet created
    page.tsx             ❌ Not yet created
  components/
    (empty)              ❌ Layout shell not yet built
  config/
    themes.ts            ✅ 5 themes, getThemeColors(), themeToCSSVariables()
  hooks/
    useTheme.ts          ✅ 7 custom hooks (fix useState import)
  lib/
    (empty)              ❌ API helpers not yet created
  stores/
    index.ts             ✅ Re-exports sessionStore, uiStore, messageStore
    sessionStore.ts      ✅ Full CRUD, persist, export, journal
    uiStore.ts           ✅ Theme, sidebar, toasts, sounds, connection status
    messageStore.ts      ❌ Not yet created (referenced in index.ts)
  styles/
    (empty)
  types/
    index.ts             ✅ All shared types (fix ThemeColors mismatch)
  utils/
    helpers.ts           ❌ Not yet created (imported by sessionStore.ts)
package.json             ⚠️ Missing zustand dependency
```

---

## Next Actions (Priority Order)

1. **Fix theme type mismatch** — unify `ThemeName` and `ThemeColors` across types, config, and store
2. **Add zustand** — `npm install zustand`
3. **Fix useTheme.ts** — merge useState import
4. **Update globals.css** — add theme CSS variables
5. **Create `utils/helpers.ts`** — `generateId()` function (imported by sessionStore)
6. **Create `stores/messageStore.ts`** — message state management (re-exported by index.ts)
7. **Phase 0: Layout shell** — Header, Sidebar, main content, theme provider
8. **Phase 0: API stubs** — SSE route, session CRUD, file upload
9. **Verify** — `npx tsc --noEmit` + `npx eslint` clean

---

## Workstream Status

| Workstream | Features | Status | Agent |
|---|---|---|---|
| Phase 0: Scaffolding | Project structure, types, stores, hooks | 🔄 In Progress | Utility |
| Phase 0: Layout | Header, Sidebar, main, theme provider | ⏳ Pending | Fast |
| Phase 0: API Stubs | SSE, session CRUD, file upload routes | ⏳ Pending | Utility |
| WS1: Chat Core | 1, 10, 11 (SSE, reconnect, messages) | ⏳ Pending | Builder |
| WS2: Session Mgmt | 2, 4, 30, 31 (CRUD, persist, journal, export) | ⏳ Pending | Builder |
| WS3: Chat UI | 7, 8, 9, 12-14, 24, 25 (markdown, code, typing, timestamps, avatars, reactions, search, pinned) | ⏳ Pending | Builder |
| WS4: Input & Commands | 3, 6, 15, 22, 26-28, 34 (slash, autocomplete, keyboard, voice, emoji, mentions, palette, settings) | ⏳ Pending | Builder |
| WS5: File Uploads | 5 (drag-drop, preview, progress) | ⏳ Pending | Fast |
| WS6: UX Polish | 16-21, 23, 29, 32, 33 (themes, responsive, animations, notifications, sounds, tooltips, breadcrumbs, status bar, a11y) | ⏳ Pending | Builder |
