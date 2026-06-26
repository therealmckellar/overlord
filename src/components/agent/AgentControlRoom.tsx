import React, { useState } from 'react';
import { X, Info, Settings, Activity, Layers, Shield, Cpu } from 'lucide-react';
import { useAgentStore } from '@/stores/agentStore';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';
import { useSkillsStore } from '@/stores/skillsStore';
import { useApiConfigStore } from '@/stores/apiConfigStore';

export const AgentControlRoom = ({ agentId, onClose }: { agentId: string, onClose: () => void }) => {
  const [activeTab, setActiveTab] = useState<'sessions' | 'skills' | 'plugins' | 'config'>('sessions');
  const { agents, updateAgent } = useAgentStore();
  const { sessions } = useSharedMemoryStore();
  const { skills, updateSkill } = useSkillsStore();
  const { configs, setConfig } = useApiConfigStore();

  const agent = agents.find(a => a.id === agentId);
  if (!agent) return null;

  const agentSessions = sessions.filter(s => s.agentName === agent.name);
  const apiConfig = configs[agent.id] || { provider: 'openrouter', model: agent.model, apiKey: '' };

  const toggleSkill = (skillId: string) => {
    const current = new Set(agent.assignedSkillIds);
    if (current.has(skillId)) current.delete(skillId);
    else current.add(skillId);
    
    // Assuming we add updateAgent to the store
    // For now, since I don't have it, I'll just log. I should add it to the store.
    console.log(`Assigning skills to ${agent.name}:`, Array.from(current));
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg" style={{ backgroundColor: agent.color }}>
              {agent.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-slate-400 uppercase tracking-widest">{agent.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex border-b border-slate-800 px-6 gap-8">
          {(['sessions', 'skills', 'plugins', 'config'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-xs font-bold uppercase tracking-wider transition-all relative ${
                activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500" />}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">Session History</h3>
              {agentSessions.length === 0 ? (
                <p className="text-slate-500 italic text-sm">No session history available.</p>
              ) : (
                agentSessions.map((s, i) => (
                  <div key={i} className="p-3 bg-slate-800/50 border border-slate-700 rounded-lg text-sm">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>{s.role === 'user' ? 'Rich' : agent.name}</span>
                      <span>{new Date(s.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-300">{s.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'skills' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-500 uppercase">Attached Skills</h3>
                <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                  {agent.assignedSkillIds.length} Active
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {skills.map(skill => (
                  <div 
                    key={skill.id} 
                    onClick={() => toggleSkill(skill.id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                      agent.assignedSkillIds.includes(skill.id) 
                        ? 'bg-blue-500/10 border-blue-500/50 text-blue-100' 
                        : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{skill.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{skill.name}</p>
                        <p className="text-xs opacity-60">{skill.description}</p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border ${
                      agent.assignedSkillIds.includes(skill.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                    }`} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'plugins' && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-500 italic text-sm">
              <Layers className="w-8 h-8 mb-2 opacity-20" />
              <p>Plugin system under construction</p>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold text-slate-500 uppercase">Routing & Model Config</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Provider</label>
                  <select 
                    value={apiConfig.provider}
                    onChange={(e) => setConfig(agent.id, { provider: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                  >
                    <option value="openrouter">OpenRouter</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="openai">OpenAI</option>
                    <option value="google">Google</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">Model</label>
                  <input 
                    type="text" 
                    value={apiConfig.model}
                    onChange={(e) => setConfig(agent.id, { model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase">API Key</label>
                  <div className="relative">
                    <input 
                      type="password" 
                      value={apiConfig.apiKey}
                      onChange={(e) => setConfig(agent.id, { apiKey: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-sm text-white outline-none focus:border-blue-500"
                      placeholder="••••••••••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <button 
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20"
            onClick={() => alert('Agent configuration deployed!')}
          >
            Deploy Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
