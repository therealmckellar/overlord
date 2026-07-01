# Implementation Plan: Operational Core (Cluster A) Panels

This document specifies the detailed implementation plan for the Operational Core panels of the Overlord project. These panels form the central nervous system of the application, managing agent orchestration, configuration, and resource allocation.

## General Design Principles
- **UI Foundation**: All panels must use `PanelWrapper` for structural consistency.
- **Aesthetic**: "Premium" Dark Mode. Indigo accents (`#4F46E5`), glassmorphism (semi-transparent backgrounds), and inner-bevel edges.
- **Data Strategy**: Implement mock data hooks (`useMockData`) to simulate real-time API responses until backends are fully integrated.
- **Interactions**: High-frequency updates (polling/sockets) for mission and agent status.

---

## 1. Dashboard (Main Entry)
*High-level system health and active operational overview.*

### UI Components
- **Health Grid**: 3-4 small `PanelWrapper` cards showing:
  - `System Load`: Radial progress bar.
  - `Active Agents`: Count with trend indicator.
  - `Token Velocity`: Real-time line sparkline.
  - `Error Rate`: Percentage with severity color (Green $\rightarrow$ Red).
- **Active Missions Table**: High-fidelity list of ongoing operations.
  - Columns: Mission ID, Agent, Objective, Status (Pulsing indicator), Progress (Linear bar).
- **Quick-Action Hub**: Button group for `Spawn Agent`, `New Workspace`, `Emergency Stop`.

### Data Structures
```typescript
interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  tokenThroughput: number; // tokens/sec
  errorRate: number;
}

interface MissionSummary {
  id: string;
  agentId: string;
  objective: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  lastUpdate: string; // ISO date
}
```

### Interaction Flow
1. **Click Mission**: Redirects to `Pipeline` panel filtered by `missionId`.
2. **Spawn Agent**: Opens a modal leading to the `Designer` flow.

---

## 2. Pipeline (Visual Flow)
*Visual representation of agent task sequences and data transformations.*

### UI Components
- **Node Graph**: A canvas-based flow (using React Flow or similar) representing the execution chain.
  - `Nodes`: Task type, Input/Output status, Execution time.
  - `Edges`: Data flow arrows with "data packet" animations.
- **Step Inspector**: A side-panel `PanelWrapper` that appears when a node is clicked.
  - Content: Full prompt used, raw LLM output, tool call logs, and "Retry Step" button.
- **Timeline Scrub**: A slider at the bottom to replay the pipeline execution.

### Data Structures
```typescript
interface PipelineNode {
  id: string;
  type: 'prompt' | 'tool' | 'filter' | 'branch';
  config: any;
  status: 'pending' | 'executing' | 'success' | 'error';
  inputData: any;
  outputData: any;
  timestamp: string;
}

interface PipelineEdge {
  source: string;
  target: string;
  payload: any;
}
```

### Interaction Flow
1. **Node Click**: Populates Step Inspector.
2. **Edge Hover**: Highlights the data payload being passed between tasks.

---

## 3. Designer (Agent Configuration)
*The "IDE" for agent creation, prompt tuning, and capability mapping.*

### UI Components
- **Configuration Stack**: Vertical `PanelWrapper` sections.
  - `Identity`: Name, Role, Persona definition.
  - `Core Prompt`: Code-editor style input with variable injection (e.g., `{{context}}`).
  - `Capability Matrix`: A grid of checkboxes/toggles for enabling tools (Search, Code Exec, Memory, etc.).
- **Prompt Sandbox**: Split-screen view.
  - Left: Prompt Editor.
  - Right: Instant test output with "Compare Versions" toggle.
- **Mapping Tool**: Drag-and-drop interface to link specific tasks to specific capabilities.

### Data Structures
```typescript
interface AgentConfig {
  id: string;
  name: string;
  persona: string;
  systemPrompt: string;
  model: string; // e.g., 'gpt-4-turbo'
  capabilities: string[]; // ['web_search', 'python_repl', 'vector_db']
  parameters: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}
```

### Interaction Flow
1. **Variable Injection**: Typing `{{` in the prompt editor triggers a dropdown of available context variables.
2. **Test Run**: Clicking `Execute` sends the current config to a canary endpoint and streams the result to the Sandbox.

---

## 4. Task Board (Kanban)
*Operational queue management for human-in-the-loop and autonomous tasks.*

### UI Components
- **Kanban Columns**: `Pending` $\rightarrow$ `In Progress` $\rightarrow$ `Review` $\rightarrow$ `Done`.
- **Task Cards**: Small `PanelWrapper` cards.
  - Header: Priority badge (Low, Med, High, Critical).
  - Body: Task summary, assigned agent.
  - Footer: Due date, attachment count.
- **Global Filter**: Search bar and priority filter at the top.

### Data Structures
```typescript
interface TaskCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'review' | 'done';
  assignedAgentId: string | null;
  deadline: string;
}
```

### Interaction Flow
1. **Drag & Drop**: Moving a card updates the `status` via API call.
2. **Card Expand**: Opens a full-screen detail view for task editing and communication.

---

## 5. Workspaces (Context Management)
*Grouping of files, memory fragments, and project-specific constraints.*

### UI Components
- **Workspace Browser**: A tree-view navigation on the left.
- **Resource Grid**: `PanelWrapper` containers for:
  - `Pinned Files`: List of key documents.
  - `Memory Fragments`: Cards showing recent knowledge graph extractions.
  - `Shared Context`: Global variables and constants for the project.
- **Import/Export**: Interface to sync with GitHub, Linear, or local folders.

### Data Structures
```typescript
interface Workspace {
  id: string;
  name: string;
  description: string;
  files: string[]; // Paths/IDs
  memoryTags: string[];
  globalContext: Record<string, string>;
}
```

### Interaction Flow
1. **Link Resource**: Dragging a file into a workspace adds it to the agent's context.
2. **Switch Workspace**: Updates the global `activeWorkspace` store, triggering a context refresh for all active agents.

---

## 6. Deployments (Instance Management)
*Managing the lifecycle of active agent instances.*

### UI Components
- **Instance Registry**: Table of all live agents.
  - Columns: Instance ID, Version, Endpoint, Uptime, Resource Usage.
- **Version Control**: A dropdown to rollback an instance to a previous `Designer` snapshot.
- **Control Panel**: `Start`, `Stop`, `Restart`, and `Scale` buttons.
- **Log Stream**: A terminal-style `PanelWrapper` showing real-time stdout for the selected instance.

### Data Structures
```typescript
interface AgentInstance {
  instanceId: string;
  configVersion: string;
  endpoint: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number; // seconds
  resources: {
    cpu: number;
    mem: number;
  };
}
```

### Interaction Flow
1. **Version Rollback**: Selecting a version $\rightarrow$ `Restart` $\rightarrow$ Instance updates its system prompt and capabilities.
2. **Log Filter**: Using regex in the log stream to isolate specific events (e.g., `ERROR` or `TOOL_CALL`).
