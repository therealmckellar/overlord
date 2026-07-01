'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  Library, 
  Plus, 
  Layers, 
  History, 
  Save, 
  Search,
  Settings,
  Zap,
  ChevronRight,
  Code
} from 'lucide-react';

// --- Types ---
interface Skill {
  id: string;
  name: string;
  version: string;
  description: string;
  code: string;
  dependencies: string[];
  tags: string[];
}

// --- Mock Data ---
const MOCK_SKILLS: Skill[] = [
  { 
    id: 'skill-1', 
    name: 'WebSearch-Enhanced', 
    version: '2.4.1', 
    description: 'Performs multi-source semantic search with result cross-referencing.', 
    code: 'async function search(query) { ... }', 
    dependencies: ['core-net', 'semantic-parser'], 
    tags: ['Search', 'Network'] 
  },
  { 
    id: 'skill-2', 
    name: 'DeepResearch-Synthesis', 
    version: '1.0.2', 
    description: 'Synthesizes complex research papers into a structured summary.', 
    code: 'async function synthesize(papers) { ... }', 
    dependencies: ['skill-1', 'llm-core'], 
    tags: ['Analysis', 'Synthesis'] 
  },
  { 
    id: 'skill-3', 
    name: 'Code-Refactor-Agent', 
    version: '0.8.5', 
    description: 'Automated TypeScript refactoring using structural analysis.', 
    code: 'async function refactor(code) { ... }', 
    dependencies: ['ast-parser', 'ts-compiler'], 
    tags: ['Development', 'Refactor'] 
  },
];

export default function SkillsPage() {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(MOCK_SKILLS[0]);
  const [editorCode, setEditorCode] = useState(selectedSkill?.code || '');

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <Library className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Capability Library</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Filter skills..." 
              className="bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md text-xs hover:bg-indigo-500/20 transition-all">
            <Plus size={14} /> New Skill
          </button>
        </div>
      </div>

      {/* Skill Library Grid */}
      <div className="col-span-4 space-y-4">
        <PanelWrapper title="Available Skills">
          <div className="flex flex-col gap-3">
            {MOCK_SKILLS.map(skill => (
              <div 
                key={skill.id} 
                onClick={() => {
                  setSelectedSkill(skill);
                  setEditorCode(skill.code);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSkill?.id === skill.id 
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold">{skill.name}</span>
                  <span className="text-[10px] font-mono opacity-60">v{skill.version}</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2 line-clamp-2">{skill.description}</p>
                <div className="flex flex-wrap gap-1">
                  {skill.tags.map(tag => (
                    <span key={tag} className="px-1.5 py-0.5 bg-slate-800 text-slate-500 rounded text-[9px] uppercase">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
        
        <PanelWrapper title="Dependency Map">
          <div className="h-48 bg-slate-900/30 border border-slate-800 rounded-lg flex items-center justify-center overflow-hidden relative">
            <svg className="absolute inset-0 w-full h-full opacity-40">
              <circle cx="50" cy="50" r="10" fill="#6366f1" />
              <circle cx="150" cy="80" r="10" fill="#6366f1" />
              <circle cx="100" cy="120" r="10" fill="#6366f1" />
              <line x1="60" y1="50" x2="140" y2="80" stroke="#6366f1" strokeWidth="1" />
              <line x1="60" y1="50" x2="110" y2="120" stroke="#6366f1" strokeWidth="1" />
              <line x1="160" y1="80" x2="110" y2="120" stroke="#6366f1" strokeWidth="1" />
            </svg>
            <p className="text-[10px] text-slate-500 italic z-10">DAG Visualization Active</p>
          </div>
        </PanelWrapper>
      </div>

      {/* Skill Editor */}
      <div className="col-span-8">
        <PanelWrapper title="Skill Authoring Editor">
          <div className="flex flex-col h-full min-h-[600px]">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="text-indigo-400 w-4 h-4" />
                <span className="text-xs font-mono text-slate-400">{selectedSkill?.name || 'untitled_skill.js'}</span>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-700 transition-all">
                  <History size={14} /> History
                </button>
                <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500 text-white rounded-md text-xs hover:bg-indigo-600 transition-all">
                  <Save size={14} /> Deploy
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 flex-grow">
              <div className="relative">
                <div className="absolute top-2 right-2 text-[10px] text-slate-600 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  TypeScript / JSON
                </div>
                <textarea 
                  value={editorCode} 
                  onChange={(e) => setEditorCode(e.target.value)}
                  className="w-full h-full min-h-[500px] bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-indigo-300 focus:outline-none focus:border-indigo-500/50 resize-none"
                  spellCheck={false}
                />
              </div>
              <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 overflow-y-auto">
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-800">
                  <Zap className="text-indigo-400 w-4 h-4" />
                  <span className="text-xs font-medium text-slate-300">Live Preview / Simulation</span>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-md">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Input</p>
                    <p className="text-xs font-mono text-slate-300">{"{ \"query\": \"Quantum Computing in 2026\" }"}</p>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-md border-l-2 border-l-indigo-500">
                    <p className="text-[10px] text-slate-500 uppercase mb-1">Output (Simulated)</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      The quantum advantage has been reached in 4 specific domains: 
                      material science, cryptanalysis, and pharmaceutical discovery. 
                      Current stability is at 99.98% for 128-qubit arrays.
                    </p>
                  </div>
                  <div className="flex justify-center py-4">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-600 animate-spin">
                      <Zap size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
