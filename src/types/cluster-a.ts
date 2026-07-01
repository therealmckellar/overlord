export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: number;
  activeAgents: number;
  tokenThroughput: number; // tokens/sec
  errorRate: number;
}

export interface MissionSummary {
  id: string;
  agentId: string;
  agentName: string;
  objective: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  progress: number; // 0-100
  lastUpdate: string; // ISO date
}

export interface PipelineNode {
  id: string;
  type: 'prompt' | 'tool' | 'filter' | 'branch';
  label: string;
  config: any;
  status: 'pending' | 'executing' | 'success' | 'error';
  inputData: any;
  outputData: any;
  timestamp: string;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  payload: any;
}

export interface AgentConfig {
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

export interface Capability {
  id: string;
  name: string;
  description: string;
  category: 'core' | 'search' | 'execution' | 'memory';
}
