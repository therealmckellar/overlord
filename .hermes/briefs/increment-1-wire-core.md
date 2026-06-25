# Increment 1: Wire Up the Overlord Core

## Context

Overlord (port 9125) is the Next.js 16 + React 19 dashboard that needs to fully replace the Hermes TUI. Currently several critical components are either non-functional or have placeholder-only implementations. This increment wires up 4 foundation features: Loop Engineering (real execution + cancel/edit), Agent Designer, Studio (code editor + terminal), and persistent memory.

## Requirements

### T1.1: Wire Loop Engine to Real Execution

**File:** `/home/rmckellar/overlord/src/components/loop/LoopEngineering.tsx`
**File:** `/home/rmckellar/overlord/src/lib/loop-engine.ts`

Currently `LoopEngineering.tsx` renders `DEMO_TASKS` with hardcoded data. We need:

1. Replace DEMO_TASKS with a Zustand-based loop store (localStorage persisted):
   - `loops: LoopTask[]` array
   - `startLoop(task: LoopTask)` → POST to `/api/agents/spawn` with the loop config
   - `stopLoop(id: string)` → abort the running fetch, mark task as `idle`
   - `updateLoop(id: string, changes: Partial<LoopTask>)` → mutate config in-place

2. When user creates a "New Loop":
   - A form modal collects: name, description, model (from UNIQUE_MODELS), maxIterations (3-10), scoring criteria (prompt)
   - Calls `POST /api/agents/spawn` with `{ type: 'loop', config: { name, description, model, maxIterations, prompt } }`
   - Response returns a job ID. Poll `GET /api/agents/:id` for results.

3. Results streaming:
   - SSE connection to `/api/events` filtered by agent ID
   - Each iteration result appears in the results list in real-time
   - Score is calculated client-side (or received from server) and added to the score chart

4. Connect to existing APIs:
   - `POST /api/agents/spawn` already exists and returns job IDs
   - `GET /api/events` SSE already exists — loop can consume it
   - Create `GET /api/agents/:id/status` if it doesn't exist (returns current loop state)

### T1.2: Add Cancel/Edit/Stop to Loop Engineering

**File:** `/home/rmckellar/overlord/src/components/loop/LoopEngineering.tsx`

1. **Cancel button** (per running task):
   - Only visible when `task.status === 'running'`
   - Calls `AbortController.abort()` on the active fetch/stream
   - Sets task status back to `idle`
   - Shows toast: "Loop stopped"

2. **Edit button** (per task):
   - Opens inline edit: change model, maxIterations, description
   - Cannot edit while running (must stop first)
   - Saves changes to the loop store

3. **Stop all button** (header):
   - Loops through all running tasks, aborts each
   - Sets all to `idle`
   - Confirmation dialog: "Stop all running loops?"

4. **Keyboard shortcut**: `Escape` stops the focused running loop

### T1.3: Build Agent Designer Component

**NEW File:** `/home/rmckellar/overlord/src/components/agent/AgentDesigner.tsx`
**File:** `/home/rmckellar/overlord/src/stores/agentStore.ts`

A full-page panel (replaces AgentPanel or is accessible from it) for designing agents:

**Agent configuration form:**
- **Name**: text input (e.g., "SEO Researcher", "Cold Email Writer")
- **Role**: dropdown (Researcher, Executor, Analyst, Writer, Coder, Specialist)
- **Model**: dropdown from `UNIQUE_MODELS` (imported from model-graph)
- **System Prompt**: Textarea with monospace font, line numbers, placeholder showing example prompt
- **Tools/Skill**: Checkbox list of available tools (web_search, file_read, file_write, terminal, browser, image_gen, tts)
- **Output Format**: dropdown (markdown, json, html, plain)
- **Memory Scope**: dropdown (per-agent, shared, global)
- **Temperature**: slider (0.0-1.0, step 0.05)
- **Max Tokens**: number input (1000-100000)

**Actions:**
- **Save**: Persists to agentStore (localStorage)
- **Save as Preset**: Names and saves to a presets array in agentStore
- **Load Preset**: Dropdown to load any saved preset
- **Deploy**: Calls `POST /api/agents/spawn` with full config → shows deployment status

**Preview panel** (right side):
- Shows the compiled system prompt with variables interpolated
- Shows JSON config that will be sent to the agent

**Store updates to agentStore.ts:**
- Add `presets: AgentPreset[]` (saved templates)
- Add `savePreset(preset: AgentPreset)` 
- Add `loadPreset(id: string): AgentPreset`
- Add `deployAgent(config: AgentConfig): Promise<string>` (returns job ID)

### T1.4: Wire Studio with Code Editor + Terminal

**File:** `/home/rmckellar/overlord/src/components/studio/StudioView.tsx`
**NEW File:** `/home/rmckellar/overlord/src/components/studio/CodeEditor.tsx`
**NEW File:** `/home/rmckellar/overlord/src/components/studio/TerminalEmulator.tsx`

**CodeEditor component:**
- Install: `npm install @monaco-editor/react monaco-editor`
- Full Monaco editor instance with:
  - Dark theme (vs-dark)
  - Language mode selector (typescript, javascript, python, markdown, json, bash)
  - Tab size 2, word wrap, minimap
  - `onChange` updates parent state with current code
  - Keyboard shortcuts: Ctrl+S → save (toast), Ctrl+/ → comment

**TerminalEmulator component:**
- Install: `npm install xterm @xterm/xterm @xterm/addon-fit`
- Full xterm.js terminal that connects to a WebSocket:
  - Create API route `/api/ws/terminal` (Next.js route handler with upgrade)
  - Terminal renders in a container, fits to size
  - Supports bash commands (or a restricted command set if needed)
  - Shows connection status indicator (green/red dot)
  - Auto-reconnect with exponential backoff

**StudioView updates:**
- Replace inline stub `<CodeEditor />` and `<TerminalEmulator />` with the real components
- Add a "Connected"/"Disconnected" status indicator in the Studio header

**WebSocket terminal API** (if not existing):
- **NEW File:** `/home/rmckellar/overlord/src/app/api/ws/terminal/route.ts`
- Creates a WebSocket server that spawns a PTY (using `node-pty` if available, or falls back to a simple exec shell)
- Streams I/O bidirectionally
- If `node-pty` is not available, use a simpler approach with `child_process.exec` + stdin/stdout

**Alternative (simpler, no WebSocket infra needed):**
- Use `xterm` with a mock/responsive terminal that runs a server-side command API
- POST `/api/terminal/execute` with `{ command: string }` → returns `{ output: string }`
- Terminal sends commands via HTTP POST rather than raw WebSocket

**Use the simpler WebSocket-free approach**: POST API is easier to secure and debug, and works through Cloudflare tunnel.

## Constraints

- **No new dependencies beyond what's specified** (monaco-editor, xterm, xterm-addon-fit). If package install fails, implement with existing tools (e.g., a styled textarea for code, iframe for terminal).
- **All Zustand stores use individual scalar selectors** — never destructure objects from `useStore()`.
- **All panels use `absolute inset-0 z-10`** within the main content area (which has `relative` class).
- **No placeholder/stub content**. Every panel must have real functionality or a minimal icon + one-line CTA.
- **TypeScript strict** — `npx tsc --noEmit` must pass with zero errors.
- **Git**: All changes committed and pushed to `github.com/therealmckellar/agent-os.git`.

## Files to Modify/Create

1. `/home/rmckellar/overlord/src/components/loop/LoopEngineering.tsx` — Major refactor
2. `/home/rmckellar/overlord/src/lib/loop-engine.ts` — Add loop store
3. `/home/rmckellar/overlord/src/stores/agentStore.ts` — Add presets + deploy
4. `/home/rmckellar/overlord/src/components/agent/AgentDesigner.tsx` — NEW
5. `/home/rmckellar/overlord/src/components/studio/StudioView.tsx` — Replace stubs
6. `/home/rmckellar/overlord/src/components/studio/CodeEditor.tsx` — NEW
7. `/home/rmckellar/overlord/src/components/studio/TerminalEmulator.tsx` — NEW
8. `/home/rmckellar/overlord/src/components/studio/FileBrowser.tsx` — NEW (basic file listing)
9. `/home/rmckellar/overlord/src/app/api/terminal/execute/route.ts` — NEW
10. `/home/rmckellar/overlord/src/app/api/agents/[id]/route.ts` — NEW (agent status endpoint)

## Verification

1. `cd /home/rmckellar/overlord && npx tsc --noEmit` — zero errors
2. `npm run build` — successful production build
3. `curl http://localhost:9125/api/health` — returns 200
4. Manual UI checks (after deploy):
   - Loop Engineering: create loop → select model → click Start → results stream in → click Stop → loop halts
   - Agent Designer: fill form → Save Preset → reload page → Load Preset → Deploy → agent appears in roster
   - Studio: Code tab shows Monaco editor with syntax highlighting, Terminal tab executes commands and returns output
   - Refresh page → loop tasks, agent presets persist (localStorage)
