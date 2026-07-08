'use client';

import React, { useState } from 'react';
import { UNIQUE_MODELS } from '@/lib/model-graph';

export type AgentRole = 'Researcher' | 'Executor' | 'Analyst' | 'Writer' | 'Coder' | 'Specialist';

interface SpawnAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpawn: (name: string, role: string, model: string) => void;
}

export const SpawnAgentModal = ({ isOpen, onClose, onSpawn }: SpawnAgentModalProps) => {
  const [name, setName] = useState('');
  const [role, setRole] = useState<AgentRole>('Analyst');
  const [model, setModel] = useState(UNIQUE_MODELS[0]?.value || 'google/gemma-4-31b-it:free');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-xl font-bold text-[var(--text)] mb-4">Spawn New Agent</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Agent Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              placeholder="e.g. Alpha-One"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Role</label>
            <select 
              value={role}
              onChange={(e) => setRole(e.target.value as AgentRole)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="Researcher">Researcher</option>
              <option value="Executor">Executor</option>
              <option value="Analyst">Analyst</option>
              <option value="Writer">Writer</option>
              <option value="Coder">Coder</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Model</label>
            <select 
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {UNIQUE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              if (name) {
                onSpawn(name, role, model);
                onClose();
              }
            }}
            className="px-4 py-2 text-sm bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Spawn Agent
          </button>
        </div>
      </div>
    </div>
  );
};
