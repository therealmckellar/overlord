# Future Releases & Technical Debt Registry

This document tracks features that were removed from the production UI because they relied on simulated data (mocks) or lacked a functioning backend. 

## 🔴 P0: Core Revenue & Pipeline
*Features critical for generating revenue and qualified conversations.*

- [ ] **Real-time Social Auth**: Replace `/social/connect/simulate` with actual OAuth2 flows for X, LinkedIn, and Meta.
- [ ] **Agent Designer Backend**: Connect `AgentDesigner.tsx` to a real agent orchestration API to allow prompt tuning and capability mapping.
- [ ] **Actual Content Pipeline**: Replace `MOCK_PIPELINE` with a real database of content assets and status tracking.

## 🟡 P1: Operational Intelligence
*Features required for scaling and monitoring system health.*

- [ ] **Live Analytics**: Replace `generateMockKPIs` with real token usage and cost data from OpenRouter/Deepgram.
- [ ] **System DevTools**: Replace `MOCK_LOGS` with real server logs and API tracing.
- [ ] **Knowledge Graph**: Connect `MemoryPage` to a real Cognee/Vector DB graph visualization.
- [ ] **Loop Engine**: Implement the actual iteration logic for `LoopsPage` instead of fake SVG graphs.

## 🟢 P2: Polish & Experience
*Features that improve the UX but aren't critical for the initial launch.*

- [ ] **Session Archives**: Replace `MOCK_SESSIONS` with real historical session retrieval.
- [ ] **Skill Library**: Implement a real skill discovery and installation system in `SkillsPage`.
- [ ] **Auto-Queue**: Build the actual task queueing system for `AutoQueuePage`.
