'use client';

import React, { useState } from 'react';
import { useAgentStore } from '@/stores/agentStore';
import { AgentCard } from './AgentCard';
import { AgentDetail } from './AgentDetail';
import { SpawnAgentModal } from './SpawnAgentModal';

export const AgentPanel = () => {
  const agents = useAgentStore((state) => state.agents);
  const selectedAgentId = useAgentStore((state) => state.selectedAgentId);
  const selectAgent = useAgentStore((state) => state.selectAgent);
  const spawnAgent = useAgentStore((state) => state.spawnAgent);
  const killAgent = useAgentStore((state) => state.killAgent);
  const pauseAgent = useAgentStore((state) => state.pauseAgent);
  const restartAgent = useAgentStore((state) => state.restartAgent);

  const [isSpawnModalOpen, setIsSpawnModalOpen] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[var(--bg)]">
      <div className={`flex-1 flex flex-col p-6 transition-all duration-300 ${selectedAgentId ? 'w-1/2' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--text)]">Agent Roster</h1>
            <p className="text-sm text-[var(--text-muted)]">Manage and monitor your AI workforce</p>
          </div>
          <button 
            onClick={() => setIsSpawnModalOpen(true)}
            className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <span>+</span> Spawn Agent
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-2">
          {agents.map(agent => (
            <AgentCard 
              key={agent.id} 
              agent={agent} 
              isSelected={selectedAgentId === agent.id}
              onClick={() => selectAgent(agent.id)}
            />
          ))}
        </div>
      </div>

      {selectedAgent && (
        <AgentDetail 
          agent={selectedAgent}
          onClose={() => selectAgent(null)}
          onKill={killAgent}
          onPause={pauseAgent}
          onRestart={restartAgent}
        />
      )}

      <SpawnAgentModal 
        isOpen={isSpawnModalOpen}
        onClose={() => setIsSpawnModalOpen(false)}
        onSpawn={spawnAgent}
      />
    </div>
  );
};
