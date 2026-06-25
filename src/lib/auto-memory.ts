/**
 * Auto-memory: creates memory entries when agents complete work
 */

import { eventBus } from './event-bus';
import { useMemoryStore } from '@/stores/memoryStore';

export function onPipelineComplete(idea: { title: string; description: string; plan?: string }) {
  const addMemory = useMemoryStore.getState().addMemory;
  const words = idea.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const tags = words.slice(0, 3);
  
  addMemory({
    content: `Pipeline: ${idea.title}\n\n${idea.description}\n\nPlan: ${idea.plan?.slice(0, 200) || 'N/A'}`,
    tags: ['pipeline', ...tags],
    source: 'pipeline',
    pinned: false,
  });
}

export function onAgentComplete(agentName: string, task: string) {
  const addMemory = useMemoryStore.getState().addMemory;
  
  addMemory({
    content: `Agent ${agentName} completed: ${task.slice(0, 200)}`,
    tags: ['agent', agentName.toLowerCase().replace(/\s+/g, '-')],
    source: 'agent',
    pinned: false,
  });
}

export function initAutoMemory() {
  return eventBus.subscribe((event) => {
    if (event.type === 'success' && event.source.startsWith('Build:')) {
      // Extract title from "Build:<title>"
      const title = event.source.replace('Build:', '');
      onPipelineComplete({ title, description: event.message });
    }
    if (event.type === 'success' && event.source.startsWith('Agent:')) {
      const agentName = event.source.replace('Agent:', '');
      onAgentComplete(agentName, event.message);
    }
  });
}
