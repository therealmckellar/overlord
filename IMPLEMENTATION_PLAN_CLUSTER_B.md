# Implementation Plan: Observability Layer (Cluster B) Panels

This document specifies the detailed implementation plan for the Observability Layer panels of the Overlord project. Cluster B provides the critical feedback loop for the system, translating raw execution data into actionable intelligence, cost metrics, and root-cause analysis.

## General Design Principles
- **UI Foundation**: All panels must use `PanelWrapper` for structural consistency.
- **Aesthetic**: "Premium" Dark Mode. Indigo accents (`#4F46E5`), glassmorphism (semi-transparent backgrounds), and inner-bevel edges.
- **Data Strategy**: Implement mock data hooks (`useMockData`) to simulate live observability streams.
- **Interactions**: Emphasis on "Drill-Down" flows (e.g., Analytics $\rightarrow$ Failure Log $\rightarrow$ Trace).

---

## 1. Analytics (Performance & Cost)
*Real-time tracking of system efficiency, financial burn, and quality metrics.*

### UI Components
- **KPI Ribbon**: 4 high-impact `PanelWrapper` cards at the top:
  - `Total Spend`: Currency value with 24h delta percentage.
  - `Avg Latency`: Time (ms) with a status indicator (Green/Yellow/Red).
  - `Token Velocity`: Tokens per second (TPS) real-time counter.
  - `Success Rate`: Percentage gauge (e.g., 98.4%).
- **Usage Heatmap**: A time-series area chart showing token usage by model (e.g., Claude 3.5 vs GPT-4o).
- **Cost Breakdown Table**: Detailed list of costs grouped by Agent or Mission.
  - Columns: Entity, Model, Input Tokens, Output Tokens, Total Cost, Efficiency Score.
- **Latency Distribution**: A histogram showing the distribution of response times across all active agents.

### Data Structures
```typescript
interface AnalyticsKPIs {
  totalSpend: number;
  spendDelta24h: number; // percentage
  avgLatency: number; // ms
  tokenVelocity: number; // tokens/sec
  successRate: number; // 0-100
}

interface TokenUsageRecord {
  timestamp: string;
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  latency: number;
  missionId: string;
}

interface CostBreakdown {
  entityId: string;
  entityName: string;
  totalCost: number;
  efficiencyScore: number; // 0-1 (cost vs quality)
}
```

### Interaction Flow
1. **Timeline Zoom**: Dragging on the Usage Heatmap filters the Cost Breakdown Table to the selected time range.
2. **Entity Click**: Clicking an entity in the Cost Breakdown redirects to the `AgentDeployment` panel for that specific instance.

---

## 2. Failure Logs (Error Analysis)
*Centralized aggregation of system failures, exceptions, and trace-level debugging.*

### UI Components
- **Error Aggregator**: A grouped list of failures.
  - `Error Card`: Grouped by error message/type.
  - Content: Occurrences count, first/last seen, affected agents, and severity badge.
- **Trace Viewer**: A vertical timeline `PanelWrapper` appearing when an error is selected.
  - `Event Node`: Timestamp, Component (e.g., "MCP-Server"), Event (e.g., "Tool Call"), Status.
  - `Payload Toggle`: Expandable section showing raw request/response JSON.
- **Root Cause Analysis (RCA) Panel**: An AI-generated summary of the failure.
  - Content: "Hypothesis", "Evidence", and "Suggested Fix" (e.g., "Update prompt to handle null return from Search tool").
- **Quick-Fix Hub**: Action buttons for `Clear Cache`, `Restart Agent`, or `Force Re-run Step`.

### Data Structures
```typescript
interface FailureEvent {
  traceId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  errorCode: string;
  message: string;
  agentId: string;
  missionId: string;
  stackTrace: string;
}

interface TraceStep {
  stepId: string;
  timestamp: string;
  component: string;
  action: string;
  status: 'success' | 'error';
  payload: {
    request: any;
    response: any;
  };
}

interface RCASummary {
  hypothesis: string;
  evidence: string[];
  suggestedFix: string;
  confidence: number; // 0-1
}
```

### Interaction Flow
1. **Error Selection**: Clicking an Error Card populates the Trace Viewer with all related `traceId` events.
2. **Trace Hop**: Clicking a `missionId` within the trace redirects to the `Pipeline` panel at the exact failed node.

---

## 3. Insights (Heuristics & Bottlenecks)
*Proactive system intelligence identifying patterns, waste, and optimization opportunities.*

### UI Components
- **Bottleneck Radar**: A radar chart identifying system weaknesses.
  - Axes: `Prompt Verbosity`, `Tool Latency`, `Retry Frequency`, `Model Hallucinations`, `Context Overflow`.
- **Pattern Detection Feed**: A stream of "Intelligence Cards".
  - `Card`: Title (e.g., "Redundant Tool Calls"), Description, Impact (e.g., "Saving $12/day"), and `Optimize Now` button.
- **Heuristic Table**: A list of suggested prompt improvements based on failure patterns.
  - Columns: Original Prompt Fragment, Suggested Change, Expected Improvement (e.g., "Reduce Latency by 15%").
- **Agent Efficiency Matrix**: A 2x2 grid mapping `Cost` vs `Performance` for all configured agents.

### Data Structures
```typescript
interface SystemBottleneck {
  metric: 'verbosity' | 'latency' | 'retries' | 'hallucinations' | 'context';
  score: number; // 0-100
  trend: 'improving' | 'stable' | 'degrading';
}

interface InsightCard {
  id: string;
  title: string;
  category: 'cost' | 'performance' | 'quality';
  description: string;
  impact: string;
  actionable: boolean;
}

interface PromptOptimization {
  original: string;
  suggested: string;
  reasoning: string;
  expectedGain: string;
}
```

### Interaction Flow
1. **Optimize Now**: Clicking the action button on an Insight Card opens the `Designer` panel with the suggested prompt changes pre-loaded as a "Proposed Version".
2. **Radar Hover**: Hovering over a radar axis highlights the specific Failure Logs contributing to that score.

---

## 4. Research (Knowledge Synthesis)
*Mapping the evolution of research missions and the synthesis of external knowledge.*

### UI Components
- **Mission Log Timeline**: A high-fidelity vertical scroll of research milestones.
  - `Milestone`: Date, Goal reached, Sources synthesized, and a "Knowledge Delta" summary.
- **Source Mapping Graph**: A visual network (similar to Pipeline) showing the relationship between external URLs/Papers and internal knowledge fragments.
  - `Nodes`: Sources (URLs), Concepts, Synthesized Facts.
  - `Edges`: "Supports", "Contradicts", "Refines".
- **Synthesis Library**: A searchable repository of synthesized "Truths".
  - `Entry`: Concept Name, Confidence Score, Supporting Evidence (links to sources), and Last Verified date.
- **Knowledge Gap Radar**: A visualization showing areas of the research objective that are currently under-supported.

### Data Structures
```typescript
interface ResearchMilestone {
  id: string;
  timestamp: string;
  goal: string;
  status: 'achieved' | 'partial' | 'blocked';
  synthesizedFacts: string[];
  sourcesUsed: string[];
}

interface KnowledgeEdge {
  sourceId: string;
  targetId: string;
  relation: 'supports' | 'contradicts' | 'refines';
  weight: number; // 0-1
}

interface SynthesizedTruth {
  id: string;
  concept: string;
  statement: string;
  confidence: number;
  evidence: {
    sourceUrl: string;
    quote: string;
  }[];
  lastVerified: string;
}
```

### Interaction Flow
1. **Source Click**: Clicking a node in the Source Mapping Graph opens a side-panel `PanelWrapper` showing the original source text with highlighted relevant passages.
2. **Gap Selection**: Clicking an under-supported area in the Knowledge Gap Radar automatically triggers a new "Deep Dive" research mission in the `AgentDeployment` panel.
