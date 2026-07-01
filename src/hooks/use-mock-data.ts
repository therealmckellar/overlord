'use client';

import { useState, useEffect } from 'react';
import { SystemHealth, MissionSummary } from '@/types/cluster-a';

export function useMockHealthData() {
  const [health, setHealth] = useState<SystemHealth>({
    cpuUsage: 42,
    memoryUsage: 68,
    activeAgents: 12,
    tokenThroughput: 1250,
    errorRate: 0.02,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setHealth(prev => ({
        ...prev,
        cpuUsage: Math.min(100, Math.max(0, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.min(100, Math.max(0, prev.memoryUsage + (Math.random() - 0.5) * 2)),
        tokenThroughput: Math.max(0, prev.tokenThroughput + (Math.random() - 0.5) * 100),
        errorRate: Math.max(0, prev.errorRate + (Math.random() - 0.5) * 0.01),
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return health;
}

export function useMockMissionsData() {
  const [missions] = useState<MissionSummary[]>([
    {
      id: 'MIS-001',
      agentId: 'SDR-1',
      agentName: 'SDR-Lead-Gen-Agent',
      objective: 'Extract high-intent leads from LinkedIn Sales Navigator',
      status: 'running',
      progress: 65,
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'MIS-002',
      agentId: 'R2-SYNC',
      agentName: 'R2-Asset-Sync-Tool',
      objective: 'Sync multi-cloud assets for Project Overlord',
      status: 'running',
      progress: 32,
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'MIS-003',
      agentId: 'C-AUDIT',
      agentName: 'Compliance-Audit-Bot',
      objective: 'Perform regulatory check on Q3 financial reports',
      status: 'paused',
      progress: 12,
      lastUpdate: new Date().toISOString(),
    },
    {
      id: 'MIS-004',
      agentId: 'S-RESEARCH',
      agentName: 'Market-Intel-Sentry',
      objective: 'Monitor competitor pricing for AI-SaaS vertical',
      status: 'completed',
      progress: 100,
      lastUpdate: new Date().toISOString(),
    },
  ]);

  return missions;
}
