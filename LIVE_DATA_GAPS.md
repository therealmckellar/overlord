# Live Data Gaps & Implementation Roadmap

This document tracks the transition from "Mock/Simulated" components to "Live" production features.

| Feature | Mock Source | Live Source Required | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Social Auth** | `/social/connect/simulate` | OAuth2 (X, LinkedIn, Meta) $\rightarrow$ `social_accounts` table | **P0** | 🛠 In Progress |
| **Agent Designer** | `setTimeout` loops | `/api/agents/configure` $\rightarrow$ `agent_configs` table | **P0** | ⏳ Pending |
| **Content Pipeline** | `MOCK_PIPELINE` array | `content_assets` table $\rightarrow$ S3/R2 Storage | **P0** | ⏳ Pending |
| **Analytics** | `generateMockKPIs()` | `usage_logs` table $\rightarrow$ OpenRouter API | **P1** | ⏳ Pending |
| **Knowledge Graph** | `MOCK_NODES` | Cognee / Vector DB $\rightarrow$ `/api/cognee/graph` | **P1** | ⏳ Pending |
| **DevTools** | `MOCK_LOGS` | `/var/log/overlord.log` $\rightarrow$ WebSocket stream | **P1** | ⏳ Pending |
| **Loop Engine** | SVG Mockups | `loop_definitions` table $\rightarrow$ Execution Engine | **P1** | ⏳ Pending |
