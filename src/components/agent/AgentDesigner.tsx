'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { AgentConfig, Capability } from '@/types/cluster-a';
import { Save, Play, Settings, ShieldCheck, Zap, Cpu, Database, Globe } from 'lucide-react';

const AVAILABLE_CAPABILITIES: Capability[] = [
  { id: 'web_search', name: 'Web Search', description: 'Real-time internet access', category: 'search' },
  { id: 'python_repl', name: 'Python Execution', description: 'Run arbitrary code', category: 'execution' },
  { id: 'vector_db', name: 'Vector Memory', description: 'Long-term knowledge retrieval', category: 'memory' },
  { id: 'file_read', name: 'File Access', description: 'Read local system files', category: 'core' },
  { id: 'api_call', name: 'Generic API', description: 'REST/GraphQL interface', category: 'core' },
];

const INITIAL_CONFIG: AgentConfig = {
  id: 'agent-001',
  name: 'SDR-Lead-Gen-Agent',
  persona: 'Professional, aggressive but polite B2B sales expert. Focuses on pain-point discovery.',
  systemPrompt: 'You are an elite SDR. Your goal is to identify high-value leads and draft outreach emails that convert. Use {{context}} to personalize.',
  model: 'gpt-4-turbo',
  capabilities: ['web_search', 'vector_db'],
  parameters: {
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1,
  },
};

export default function AgentDesigner() {
  const [config, setConfig] = useState<AgentConfig>(INITIAL_CONFIG);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const toggleCapability = (id: string) => {
    setConfig(prev => ({
      ...prev,
      capabilities: prev.capabilities.includes(id) 
        ? prev.capabilities.filter(c => c !== id) 
        : [...prev.capabilities, id]
    }));
  };

  const runTest = async () => {
    setIsTesting(true);
    setTestOutput('Initializing canary run...');
    // Simulate streaming
    await new Promise(r => setTimeout(r, 1000));
    setTestOutput(prev => prev + '\n\n> Analyzing system prompt...');
    await new Promise(r => setTimeout(r, 800));
    setTestOutput(prev => prev + '\n\n> Testing capability mapping...');
    await new Promise(r => setTimeout(r, 1200));
    setTestOutput(prev => prev + '\n\n[RESULT]: Agent responded successfully to sample lead query. Persona: Consistent. Tool call: web_search invoked.');
    setIsTesting(false);
  };

  return (
    <div className="flex h-full gap-6 p-6 animate-fade-in">
      {/* Config Stack */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto pr-2">
        <PanelWrapper title="Identity & Persona">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Agent Name</label>
              <input 
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 outline-none transition-colors"
                value={config.name}
                onChange={e => setConfig({...config, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Model</label>
              <select 
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-800 text-white focus:border-indigo-500 outline-none transition-colors"
                value={config.model}
                onChange={e => setConfig({...config, model: e.target.value})}
              >
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="claude-3-opus">Claude 3 Opus</option>
                <option value="llama-3-70b">Llama 3 70B</option>
              </select>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-medium text-slate-500 uppercase">Persona Definition</label>
              <textarea 
                className="w-full p-3 rounded-lg bg-slate-950 border border-slate-800 text-white h-24 focus:border-indigo-500 outline-none transition-colors resize-none"
                value={config.persona}
                onChange={e => setConfig({...config, persona: e.target.value})}
              />
            </div>
          </div>
        </PanelWrapper>

        <PanelWrapper title="Core Prompt Editor">
          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/30">System</span>
              </div>
              <textarea 
                className="w-full p-4 rounded-lg bg-slate-950 border border-slate-800 text-indigo-100 font-mono text-sm h-64 focus:border-indigo-500 outline-none transition-colors resize-none leading-relaxed"
                value={config.systemPrompt}
                onChange={e => setConfig({...config, systemPrompt: e.target.value})}
                placeholder="Enter system prompt..."
              />
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-slate-500">Available Variables:</span>
              <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer hover:bg-slate-700">{"{{context}}"}</span>
              <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer hover:bg-slate-700">{"{{user_id}}"}</span>
              <span className="text-xs bg-slate-800 text-indigo-300 px-2 py-0.5 rounded border border-slate-700 cursor-pointer hover:bg-slate-700">{"{{history}}"}</span>
            </div>
          </div>
        </PanelWrapper>

        <PanelWrapper title="Capability Mapping">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {AVAILABLE_CAPABILITIES.map(cap => (
              <div 
                key={cap.id}
                onClick={() => toggleCapability(cap.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                  config.capabilities.includes(cap.id) 
                    ? 'bg-indigo-500/10 border-indigo-500/50 text-white shadow-[0_0_10px_rgba(79,70,229,0.1)]' 
                    : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className={`p-2 rounded-md ${config.capabilities.includes(cap.id) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                  {getCapabilityIcon(cap.category)}
                </div>
                <div>
                  <div className="text-sm font-medium">{cap.name}</div>
                  <div className="text-xs text-slate-500">{cap.description}</div>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>

        <div className="flex justify-end gap-4 pb-12">
          <button className="px-6 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-sm font-medium">
            Discard Changes
          </button>
          <button className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors text-sm font-medium flex items-center gap-2 shadow-lg shadow-indigo-500/20">
            <Save size={16} />
            Save Configuration
          </button>
        </div>
      </div>

      {/* Prompt Sandbox */}
      <div className="w-1/3 flex flex-col gap-4">
        <PanelWrapper title="Prompt Sandbox">
          <div className="flex flex-col h-full gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Zap size={12} />
                Canary Environment
              </div>
              <button 
                onClick={runTest} 
                disabled={isTesting}
                className="px-3 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isTesting ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Play size={12} />}
                Execute
              </button>
            </div>
            <div className="flex-1 min-h-[400px] p-4 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-indigo-200 overflow-y-auto leading-relaxed whitespace-pre-wrap">
              {testOutput || 'Click execute to test the current configuration in the canary environment...'}
            </div>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}

function getCapabilityIcon(category: string) {
  switch (category) {
    case 'search': return <Globe size={14} />;
    case 'execution': return <Cpu size={14} />;
    case 'memory': return <Database size={14} />;
    default: return <ShieldCheck size={14} />;
  }
}
