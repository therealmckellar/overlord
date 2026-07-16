<div align="center">

<img src=".github/hero-dark.svg" alt="Overlord — Agent Command Center" width="100%" />

<br />

**AI Agent Orchestration Platform** — Route, build, review, and deploy through multiple specialized AI agents with a unified command center.

<br />

<img src=".github/dashboard-preview.svg" alt="Overlord Dashboard Preview" width="100%" />

</div>

---

## What is Overlord?

Overlord is a **multi-agent command center** built on Next.js that orchestrates AI-powered workflows across specialized agents — Planner, Architect, Builder, Reviewer, Security, SDR, and more. It pairs a visual UI with a deterministic execution layer (SQLite-backed state, PWA support) so agent runs are observable, replayable, and routeable across providers. It provides:

- **Model Graph** — Visualize and route between AI models (Nemotron Ultra, GPT-OSS, Nex-N2, etc.) with full slug visibility (`:free` suffix on all applicable)
- **Chat** — Multi-model conversations with inline model switching and agent dispatch
- **Cron** — Schedule and monitor recurring agent tasks
- **Plugins** — Extend capabilities with a plugin architecture
- **Workflows** — Chain agents into pipelines (Plan -> Architect -> Build -> Review)
- **Channels** — Connect to Discord, Telegram, and other platforms
- **Config** — Manage Overlord settings and agent configurations
- **MCP** — Model Context Protocol server management
- **Webhooks** — Incoming/outgoing webhook configuration
- **Pairing** — Device and session pairing
- **Achievements** — Track agent milestones and performance

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Overlord UI                       │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐  │
│  │Model Graph│ │   Chat   │ │ Cron │ │ Plugins  │  │
│  └──────────┘ └──────────┘ └──────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌──────────┐  │
│  │Workflows │ │ Channels │ │Config│ │   MCP    │  │
│  └──────────┘ └──────────┘ └──────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐│
│  │ Webhooks │ │ Pairing  │ │    Achievements     ││
│  └──────────┘ └──────────┘ └──────────────────────┘│
└─────────────────────────────────────────────────────┘
                         │
               Next.js API (src/)
                         │
         ┌───────────────┴───────────────┐
         │   SQLite state (better-sqlite3) │
         │     OpenRouter (Model Routing)  │
         └─────────────────────────────────┘
```

## Agent Paths

| Path | Agents | Use Case |
|------|--------|----------|
| **Path 1** | Planner -> Architect -> Builder -> Reviewer | Complex multi-step builds |
| **Path 2** | Builder | Heavy fix / fast build |
| **Path 3** | Docs | Specs, documentation, copy |
| **Path 4** | Fast | Narrow fix, quick task |
| **Path 5** | Utility | Shell glue, cleanup |
| **Path 6** | Researcher | Research, decks, landing pages |
| **Path 7** | Refactor | Code refactoring |
| **Path 8** | Silent-Failure | Silent failure hunting |
| **Path 9** | E2E | End-to-end testing |
| **Path 10** | Explorer | Read-only codebase exploration |

## Tech Stack

- **Next.js** (App Router) — React Server Components, PWA via `next-pwa`
- **React / lucide-react** — UI
- **Tailwind CSS** — Utility-first styling
- **Zustand** (`stores/`) — Client state management
- **better-sqlite3** — Local agent/state persistence
- **react-force-graph-3d / three** — Model Graph visualization
- **OpenRouter** — Multi-provider model routing (all `:free` models)
- **shiki / react-markdown / katex** — Rendering for chat and docs

## Project Structure

- `src/` — Application source (routes, API, agents)
- `components/` — UI components
- `stores/` — Zustand client state
- `data/` — Static/data assets
- `public/` — Static assets
- `scripts/` — Build and maintenance scripts
- `tests/` — Test suite (`test-results/` for output)
- `.github/` — Hero/preview assets and CI workflows

## Getting Started

```bash
git clone git@github.com:therealmckellar/overlord.git
cd overlord
npm install
npm run dev
```

Open [http://localhost:9125](http://localhost:9125) — port 9125, never 3000.

## Environment

Create `.env.local`:

```env
NEXTAUTH_SECRET=<your-secret>
NEXTAUTH_URL=http://localhost:9125
OPENROUTER_API_KEY=<your-openrouter-key>
```

## License

Private — © Rich McKellar
