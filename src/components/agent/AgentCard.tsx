'use client';

import React from 'react';
import { Agent } from '@/stores/agentStore';

interface AgentCardProps {
  agent: Agent;
  isSelected: boolean;
  onClick: () => void;
}

export const AgentCard = ({ agent, isSelected, onClick }: AgentCardProps) => {
  const statusColors = {
    active: 'bg-green-500',
    idle: 'bg-amber-500',
    error: 'bg-red-500',
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-[var(--accent)] bg-[var(--bg-secondary)] ring-1 ring-[var(--accent)]' 
          : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]'
      }`}
    >
      <div className="flex items-center gap-4">
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: agent.color }}
        >
          {agent.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-[var(--text)] truncate">{agent.name}</h3>
            <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          </div>
          <p className="text-xs text-[var(--text-muted)] truncate">{agent.role}</p>
        </div>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
          <span>Last activity: {agent.lastActivity}</span>
          <span>{agent.tokensUsed.toLocaleString()} tokens</span>
        </div>
        <div className="w-full h-1 bg-[var(--border)] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--accent)] transition-all" 
            style={{ width: `${Math.min((agent.tokensUsed / 50000) * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
