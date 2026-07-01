import { useState } from 'react';

export interface TaskCard {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'active' | 'review' | 'done';
  assignedAgentId: string | null;
  assignedAgentName: string | null;
  deadline: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  files: string[];
  memoryTags: string[];
  globalContext: Record<string, string>;
}

export interface AgentInstance {
  instanceId: string;
  configVersion: string;
  endpoint: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  resources: {
    cpu: number;
    mem: number;
  };
}

export function useMockData() {
  const [tasks] = useState<TaskCard[]>([
    { id: 't1', title: 'Audit API Endpoints', description: 'Scan all public endpoints for shadow APIs', priority: 'high', status: 'active', assignedAgentId: 'a1', assignedAgentName: 'Sentinel-01', deadline: '2026-07-01' },
    { id: 't2', title: 'Refresh Vector Index', description: 'Re-index project documentation for R2 migration', priority: 'medium', status: 'pending', assignedAgentId: 'a2', assignedAgentName: 'Indexer-Prime', deadline: '2026-07-05' },
    { id: 't3', title: 'Verify Token Budget', description: 'Review token usage for Campaign Alpha', priority: 'critical', status: 'review', assignedAgentId: 'a1', assignedAgentName: 'Sentinel-01', deadline: '2026-06-30' },
    { id: 't4', title: 'Generate Q2 Report', description: 'Aggregate performance metrics from all active agents', priority: 'low', status: 'done', assignedAgentId: 'a3', assignedAgentName: 'Archivist', deadline: '2026-06-25' },
    { id: 't5', title: 'Test Prompt v2.1', description: 'Run A/B test on new system prompt for SDR agent', priority: 'high', status: 'pending', assignedAgentId: 'a4', assignedAgentName: 'Tuner-01', deadline: '2026-07-02' },
  ]);

  const [workspaces] = useState<Workspace[]>([
    { id: 'w1', name: 'SDR-Campaign-Alpha', description: 'Outbound lead generation and qualification workflow', files: ['/docs/leads.csv', '/prompts/sdr-v1.txt'], memoryTags: ['outbound', 'qualification', 'leads'], globalContext: { region: 'North America', target: 'Enterprise' } },
    { id: 'w2', name: 'R2-Migration-Project', description: 'Migrating legacy assets to Cloudflare R2', files: ['/config/r2-buckets.json', '/scripts/migrate.py'], memoryTags: ['migration', 'storage', 'cloudflare'], globalContext: { bucket_region: 'wnam', priority: 'high' } },
  ]);

  const [deployments] = useState<AgentInstance[]>([
    { instanceId: 'inst-001', configVersion: 'v1.2.4-beta', endpoint: 'https://agent-01.overlord.internal', status: 'online', uptime: 86400, resources: { cpu: 12, mem: 512 } },
    { instanceId: 'inst-002', configVersion: 'v1.1.0-stable', endpoint: 'https://agent-02.overlord.internal', status: 'online', uptime: 172800, resources: { cpu: 8, mem: 256 } },
    { instanceId: 'inst-003', configVersion: 'v1.3.0-canary', endpoint: 'https://agent-03.overlord.internal', status: 'degraded', uptime: 3600, resources: { cpu: 45, mem: 1024 } },
    { instanceId: 'inst-004', configVersion: 'v1.0.5-legacy', endpoint: 'https://agent-04.overlord.internal', status: 'offline', uptime: 0, resources: { cpu: 0, mem: 0 } },
  ]);

  return { tasks, workspaces, deployments };
}
