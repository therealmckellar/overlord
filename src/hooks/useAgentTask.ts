'use client';

import { useState, useCallback } from 'react';
import { TaskCategory, getAgentForTask, AgentConfig } from '@/lib/model-graph';

interface AgentTaskRequest {
  task: TaskCategory;
  prompt: string;
  persona?: string;
  options?: Record<string, string>;
}

interface AgentTaskResponse {
  success: boolean;
  agent: string;
  model: string;
  agentFlag: string;
  output: string;
  errors?: string;
  error?: string;
  code?: string;
}

/**
 * Hook for routing tasks through the Model Graph.
 * Any component that needs AI work MUST use this instead of calling the orchestrator directly.
 */
export function useAgentTask() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AgentTaskResponse | null>(null);

  const executeTask = useCallback(async (request: AgentTaskRequest): Promise<AgentTaskResponse | null> => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      // Get agent info for display
      const agent = getAgentForTask(request.task);

      const response = await fetch('/api/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      const data: AgentTaskResponse = await response.json();

      if (!response.ok) {
        setError(data.error || 'Task failed');
        return null;
      }

      setResult(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    executeTask,
    isLoading,
    error,
    result,
    clearResult,
  };
}

/**
 * Get the agent config for display purposes (showing which model is handling the task)
 */
export function getAgentDisplayInfo(task: TaskCategory): {
  name: string;
  model: string;
  color: string;
} {
  const config = getAgentForTask(task);
  const colors: Record<string, string> = {
    builder: '#3b82f6',
    researcher: '#8b5cf6',
    reviewer: '#f59e0b',
    security: '#ef4444',
    perf: '#10b981',
    docs: '#06b6d4',
    sdr: '#3b82f6',
    e2e: '#f59e0b',
    explorer: '#6366f1',
    refactor: '#ec4899',
    fast: '#6366f1',
    trading: '#f97316',
    utility: '#6b7280',
    'kanban-orchestrator': '#8b5cf6',
    'kanban-worker': '#3b82f6',
    marketing: '#06b6d4',
    'content-creator': '#8b5cf6',
    'content-editor': '#f59e0b',
  };
  return {
    name: config.role.charAt(0).toUpperCase() + config.role.slice(1),
    model: config.model,
    color: colors[config.role] || '#6b7280',
  };
}
