# Implementation Plan: Cluster C - Automation & Advanced Tools

This document outlines the implementation details for the final set of panels in the Overlord dashboard. All panels must adhere to the **Premium Dark (Indigo/Glassmorphism)** aesthetic, utilize the `PanelWrapper` component, and implement high-fidelity skeletons with mock data hooks.

## General Design Principles
- **Shell**: All content wrapped in `PanelWrapper`.
- **Styling**: 
  - Primary Accent: Indigo (`#6366f1`)
  - Backgrounds: `bg-slate-950`, `bg-slate-900/50` (glass), `bg-indigo-500/5` (highlight)
  - Borders: `border-slate-800`, `border-indigo-500/30` (active/highlight)
  - Text: `text-slate-200` (primary), `text-slate-400` (secondary), `text-indigo-400` (accent)
- **Components**: Lucide-react for iconography, Tailwind CSS for layout, Framer Motion for state transitions.

---

## 1. Loops Panel (Recursive Task Chains)
Focuses on the orchestration and monitoring of autonomous, recursive agent loops.

### UI Components
- **`LoopGraph`**: A node-based visualization showing the recursive path. Nodes represent iterations; edges represent transitions.
- **`ExitConditionMonitor`**: A grid of status indicators for active exit conditions (e.g., "Token Budget < 10%", "Goal State Reached", "Max Depth 10").
- **`ActiveLoopsList`**: A list of current loop instances with iteration counters and real-time status badges.
- **`LoopControlBar`**: Global controls to Pause, Resume, or Force-Break all active loops.

### Data Structures
```typescript
interface LoopDefinition {
  id: string;
  name: string;
  trigger: string;
  recursionLimit: number;
  exitConditions: ExitCondition[];
}

interface ExitCondition {
  id: string;
  type: 'budget' | 'goal' | 'depth' | 'manual';
  threshold: number | string;
  isMet: boolean;
}

interface LoopInstance {
  id: string;
  definitionId: string;
  currentIteration: number;
  maxDepth: number;
  status: 'running' | 'paused' | 'completed' | 'broken';
  logs: LogEntry[];
}
```

### Interaction Flow
1. **Trigger**: User selects a `LoopDefinition` and hits "Start Loop".
2. **Monitoring**: The `LoopGraph` updates in real-time as the agent recurses.
3. **Intervention**: User observes a "Budget Warning" in the `ExitConditionMonitor` and manually triggers a "Force-Break" via the `LoopControlBar`.

---

## 2. Memory Panel (Knowledge Graph & Pruning)
Provides a visual and manual interface for the agent's long-term memory.

### UI Components
- **`KnowledgeGraphViewer`**: A force-directed 2D graph of entities (nodes) and relationships (edges).
- **`MemoryPruningControls`**: Sliders for 'Decay Rate' and 'Importance Threshold', with a 'Purge' button for low-weight nodes.
- **`ContextInjectionPanel`**: A list of "Pinned" memories currently being injected into the active session's prompt.
- **`EntityInspector`**: A side-panel showing detailed metadata for a selected node (last accessed, weight, source).

### Data Structures
```typescript
interface MemoryNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'fact';
  weight: number; // 0.0 to 1.0
  lastAccessed: string; // ISO timestamp
}

interface MemoryEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}
```

### Interaction Flow
1. **Exploration**: User navigates the `KnowledgeGraphViewer` to find a specific concept.
2. **Optimization**: User increases the 'Importance Threshold' in `MemoryPruningControls`, causing low-weight nodes to fade and be removed.
3. **Injection**: User selects a critical entity and clicks "Pin to Context", adding it to the `ContextInjectionPanel`.

---

## 3. DevTools Panel (System Internals & Debugging)
Low-level access to API traffic, server logs, and system state.

### UI Components
- **`ApiInspector`**: A table of recent HTTP/RPC calls. Clicking a row opens a JSON-formatted Request/Response viewer.
- **`McpServerLogs`**: A terminal-style log stream with filters for specific MCP servers (e.g., "filesystem", "github").
- **`SystemInternals`**: A dashboard of sparklines showing CPU, Memory, and Token-per-second (TPS) usage.
- **`DebugConsole`**: A command-line input for executing raw system calls or manipulating internal state.

### Data Structures
```typescript
interface ApiCall {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: number;
  request: any;
  response: any;
  durationMs: number;
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  server: string;
  message: string;
}
```

### Interaction Flow
1. **Detection**: User notices an error in `McpServerLogs`.
2. **Analysis**: User finds the corresponding `ApiCall` in the `ApiInspector` to see the exact payload that caused the failure.
3. **Resolution**: User types a fix command into the `DebugConsole` to reset the server state.

---

## 4. Skills Panel (Library & Authoring)
Management of the agent's capability set and custom skill creation.

### UI Components
- **`SkillLibrary`**: A grid of skill cards showing versions, dependency badges, and usage frequency.
- **`SkillEditor`**: A split-pane editor (Code/Preview) for authoring skills in Markdown, JSON, or Python.
- **`DependencyMap`**: A visual DAG (Directed Acyclic Graph) showing skill hierarchies and prerequisites.
- **`VersionHistory`**: A vertical timeline of versions with a "Compare" (diff) button.

### Data Structures
```typescript
interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  code: string;
  dependencies: string[]; // IDs of other skills
  tags: string[];
}
```

### Interaction Flow
1. **Discovery**: User searches the `SkillLibrary` for "Search" capabilities.
2. **Authoring**: User opens the `SkillEditor` to create a "DeepResearch" skill that depends on the "WebSearch" skill.
3. **Deployment**: User saves the skill, triggering a dependency check in the `DependencyMap` before deploying to the agent.

---

## 5. Sessions Panel (Archives & Playback)
Historical analysis and state-recovery of past agent interactions.

### UI Components
- **`SessionArchive`**: A searchable list of sessions with metadata (Date, Model, Outcome, Token Cost).
- **`SessionPlayback`**: A "Time-Travel" UI with a scrubber bar to step through the conversation turn-by-turn.
- **`ContextSnapshot`**: A view of the active memory and prompt context at a specific turn in the playback.
- **`ArchiveExport`**: Buttons to export session data as JSON or PDF.

### Data Structures
```typescript
interface Session {
  id: string;
  startTime: string;
  endTime: string;
  messages: Message[];
  stateSnapshots: Snapshot[];
}

interface Snapshot {
  turnIndex: number;
  activeContext: string[];
  memoryState: any;
}
```

### Interaction Flow
1. **Retrieval**: User searches the `SessionArchive` for a session from "June 2026".
2. **Analysis**: User uses the `SessionPlayback` scrubber to find the exact turn where the agent deviated from the goal.
3. **Inspection**: User opens the `ContextSnapshot` for that turn to see which memory was incorrectly injected.

---

## 6. Content Pipeline Panel (Generation & Distribution)
Workflow management for content produced by the agent.

### UI Components
- **`PipelineFlow`**: A linear stage-based progress bar (Draft $\to$ Review $\to$ Polish $\to$ Distribute).
- **`ReviewStage`**: A side-by-side editor (Agent Draft vs. User Edit) with a "Approve" button.
- **`DistributionTriggers`**: A checklist of targets (e.g., "Discord", "X", "WordPress") with scheduling toggles.
- **`ContentQueue`**: A list of items awaiting review.

### Data Structures
```typescript
interface PipelineItem {
  id: string;
  content: string;
  currentStage: 'draft' | 'review' | 'polish' | 'distribute';
  history: StageUpdate[];
  targets: Target[];
}

interface Target {
  platform: string;
  scheduledTime: string;
  isTriggered: boolean;
}
```

### Interaction Flow
1. **Ingestion**: Agent generates a blog post, which appears in the `ContentQueue`.
2. **Review**: User opens the `ReviewStage`, makes a few edits, and marks the item as "Ready for Polish".
3. **Distribution**: User selects "Discord" and "X" in `DistributionTriggers` and schedules them for 9 AM tomorrow.

---

## 7. Auto Queue Panel (Scheduling & Resources)
Management of autonomous tasks and resource allocation.

### UI Components
- **`TaskQueue`**: A priority-sorted list of pending tasks (High, Medium, Low) with resource requirements.
- **`ResourceAllocation`**: Visual progress bars showing current usage of GPU, API tokens, and Memory.
- **`SchedulerSettings`**: A Cron-style interface for setting up recurring autonomous tasks.
- **`QueueOptimizer`**: A "Re-prioritize" button that uses an AI agent to optimize the queue based on deadlines.

### Data Structures
```typescript
interface QueuedTask {
  id: string;
  priority: 'high' | 'medium' | 'low';
  taskType: string;
  scheduledTime: string;
  resourceRequirements: {
    tokens: number;
    compute: number;
  };
}
```

### Interaction Flow
1. **Scheduling**: User creates a recurring "Weekly Market Audit" task via `SchedulerSettings`.
2. **Prioritization**: A high-priority "Emergency Fix" task enters the `TaskQueue`.
3. **Resource Check**: User checks `ResourceAllocation` to ensure there are enough tokens to run both tasks concurrently.
