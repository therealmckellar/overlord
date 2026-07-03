# Technical Implementation Plan: Overlord Live Transition

This document outlines the rigorous path to transition all mock/simulated sections of Overlord to live production features, as identified in `LIVE_DATA_GAPS.md`.

## 1. Database Schema Updates (SQLite)
The current schema in `src/lib/db.ts` provides a foundation, but requires the following additions/modifications to support live data.

### A. Agent Configuration (`agent_configs` table)
**Required for:** Agent Designer (P0)
```sql
CREATE TABLE IF NOT EXISTS agent_configs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,
  system_prompt TEXT,
  model_id TEXT NOT NULL,
  temperature REAL DEFAULT 0.7,
  max_tokens INTEGER,
  capabilities TEXT, -- JSON array of enabled tools/plugins
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

### B. Content Assets (`content_assets` table)
**Required for:** Content Pipeline (P0)
```sql
CREATE TABLE IF NOT EXISTS content_assets (
  id TEXT PRIMARY KEY,
  pipeline_id TEXT,
  stage_id TEXT,
  asset_type TEXT NOT NULL, -- 'image', 'text', 'video', 'audio'
  storage_url TEXT NOT NULL, -- S3/R2 Path
  metadata TEXT, -- JSON blob for tags, dimensions, etc.
  status TEXT NOT NULL DEFAULT 'draft',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (pipeline_id) REFERENCES pipelines(id)
);
```

### C. Usage Logs (`usage_logs` table)
**Required for:** Analytics (P1)
```sql
CREATE TABLE IF NOT EXISTS usage_logs (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  user_id TEXT,
  tokens_prompt INTEGER,
  tokens_completion INTEGER,
  model_id TEXT,
  latency_ms INTEGER,
  endpoint TEXT,
  timestamp INTEGER NOT NULL
);
```

### D. Loop Definitions (`loop_definitions` table)
**Required for:** Loop Engine (P1)
```sql
CREATE TABLE IF NOT EXISTS loop_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  definition_json TEXT NOT NULL, -- Graph structure of the loop
  trigger_event TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

---

## 2. API Endpoint Definitions (Next.js)

### A. Agent Designer (`/api/agents/configure`)
- **POST**: Update agent configuration.
- **GET**: Retrieve current configuration for a specific agent ID.
- **PUT**: Change model or prompt settings.

### B. Content Pipeline (`/api/pipeline/assets`)
- **GET `/[pipelineId]`**: List all assets associated with a pipeline.
- **POST**: Upload new asset (via signed URL for R2).
- **PATCH `/[assetId]`**: Move asset to next pipeline stage.

### C. Analytics (`/api/stats/usage`)
- **GET**: Aggregate KPI data from `usage_logs` (Total tokens, cost, request volume).
- **GET `/breakdown`**: Model-specific usage patterns.

### D. Knowledge Graph (`/api/cognee/graph`)
- **GET**: Fetch nodes and edges from Cognee/Vector DB.
- **POST `/sync`**: Trigger a re-index of local workspace files into the graph.

### E. DevTools (`/api/system/logs`)
- **GET**: Stream `/var/log/overlord.log` via Server-Sent Events (SSE) or WebSocket.

---

## 3. Frontend Wiring Requirements

### A. Social Auth
- Replace `/social/connect/simulate` redirects with actual OAuth2 flow handlers in `src/app/api/social/accounts/connect/[platform]/callback`.
- Update `SocialAccount` components to reflect real `status` (Connected/Disconnected) from `social_accounts` table.

### B. Agent Designer
- Replace `setTimeout` loops in the Designer UI with `useEffect` hooks that fetch/push data to `/api/agents/configure`.
- Implement a "Save Configuration" state with optimistic UI updates.

### C. Content Pipeline
- Replace `MOCK_PIPELINE` array in `PipelineView.tsx` with a `useSWR` or `React Query` hook calling `/api/pipeline/assets`.
- Wire the Asset Upload component to handle R2 signed URLs.

### D. Analytics & KPIs
- Replace `generateMockKPIs()` with an API call to `/api/stats/usage`.
- Implement data visualization (Charts.js/Recharts) based on real `usage_logs` data.

### E. Loop Engine
- Replace SVG mockups with a dynamic graph renderer (e.g., React Flow) that loads data from `loop_definitions`.

---

## 4. Sequence of Execution

### Phase 1: Infrastructure & P0s (High Impact)
1. **DB Migration**: Update `src/lib/db.ts` with the new table definitions.
2. **OAuth Integration**: Implement live OAuth2 callbacks for X, LinkedIn, and Meta.
3. **Agent Config API**: Build the `/api/agents/configure` endpoints and wire the Designer UI.
4. **Asset Storage**: Setup Cloudflare R2 bucket and implement signed URL uploads in the Pipeline.

### Phase 2: Intelligence & P1s (Deep Integration)
5. **Cognee Sync**: Integrate the live Cognee graph API with the Knowledge Graph UI.
6. **Logging Stream**: Implement the WebSocket/SSE stream for real-time system logs.
7. **Analytics Engine**: Build the `usage_logs` aggregator and wire the Analytics dashboard.
8. **Loop Engine**: Implement the `loop_definitions` CRUD and the dynamic graph renderer.

### Phase 3: Hardening & Cleanup
9. **Mock Audit**: Global search for `MOCK_`, `simulate`, and `setTimeout` in `/src` to ensure zero leaks.
10. **Integration Testing**: End-to-end tests for Auth $\rightarrow$ Agent Config $\rightarrow$ Pipeline $\rightarrow$ Analytics.
11. **Performance Tuning**: Indexing SQLite tables for usage logs and content assets.
