'use client';

import React, { useState, useMemo } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { BookOpen, GitBranch, ShieldCheck, AlertCircle, ExternalLink, Search, Filter } from 'lucide-react';

// Types based on IMPLEMENTATION_PLAN_CLUSTER_B.md
interface ResearchMilestone {
  id: string;
  timestamp: string;
  goal: string;
  status: 'achieved' | 'partial' | 'blocked';
  synthesizedFacts: string[];
  sourcesUsed: string[];
}

interface SynthesizedTruth {
  id: string;
  concept: string;
  statement: string;
  confidence: number;
  evidence: {
    sourceUrl: string;
    quote: string;
  }[];
  lastVerified: string;
}

// Mock Data
const generateMockMilestones = (): ResearchMilestone[] => [
  {
    id: 'm1',
    timestamp: '2026-06-15T10:00:00Z',
    goal: 'Map Llama-4 prompt architecture',
    status: 'achieved',
    synthesizedFacts: ['Uses dynamic context windowing', 'Implements multi-step reasoning tokens'],
    sourcesUsed: ['arxiv.org/abs/2401.001', 'meta.ai/blog/llama-4'],
  },
  {
    id: 'm2',
    timestamp: '2026-06-20T14:30:00Z',
    goal: 'Analyze token efficiency vs GPT-4o',
    status: 'partial',
    synthesizedFacts: ['Superior in code synthesis', 'Inferior in long-form creative writing'],
    sourcesUsed: ['benchmarks.ai/llama4-vs-gpt4o'],
  },
  {
    id: 'm3',
    timestamp: '2026-06-25T09:00:00Z',
    goal: 'Validate cross-model consistency',
    status: 'blocked',
    synthesizedFacts: [],
    sourcesUsed: [],
  },
];

const generateMockTruths = (): SynthesizedTruth[] => [
  {
    id: 't1',
    concept: 'Dynamic Context Windowing',
    statement: 'Llama-4 uses a sliding-window attention mechanism that dynamically adjusts based on token importance.',
    confidence: 0.95,
    evidence: [
      { sourceUrl: 'arxiv.org/abs/2401.001', quote: 'The model implements a dynamic window that prunes low-attention tokens...' },
      { sourceUrl: 'meta.ai/blog/llama-4', quote: 'Our new attention mechanism optimizes memory for long contexts.' },
    ],
    lastVerified: '2026-06-28',
  },
  {
    id: 't2',
    concept: 'Reasoning Tokens',
    statement: 'Internal reasoning tokens are used to plan response structure before generating final output.',
    confidence: 0.88,
    evidence: [
      { sourceUrl: 'tech-review.com/llama4', quote: 'The trace shows a sequence of hidden tokens used for chain-of-thought planning.' },
    ],
    lastVerified: '2026-06-27',
  },
];

export default function ResearchPanel() {
  const milestones = useMemo(() => generateMockMilestones(), []);
  const truths = useMemo(() => generateMockTruths(), []);
  const [selectedTruth, setSelectedTruth] = useState<SynthesizedTruth | null>(null);

  return (
    <div className="flex h-full overflow-hidden bg-transparent">
      {/* Left Side: Timeline & Graph (Simulated) */}
      <div className="w-1/2 flex flex-col gap-4 p-4 overflow-y-auto border-r border-slate-800">
        <PanelWrapper title="Mission Log Timeline">
          <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
            {milestones.map((m, i) => (
              <div key={m.id} className="relative group">
                <div className={`absolute -left-[13px] top-1 w-2 h-2 rounded-full ${
                  m.status === 'achieved' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 
                  m.status === 'partial' ? 'bg-yellow-500 shadow-[0_0_5px_rgba(234,179,8,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                }`} />
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-semibold text-slate-200">{m.goal}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{new Date(m.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="space-y-2">
                  {m.synthesizedFacts.map((f, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs text-slate-400">
                      <ShieldCheck className="w-3 h-3 text-indigo-400 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                  {m.status === 'blocked' && (
                    <div className="flex items-center gap-2 text-xs text-red-400">
                      <AlertCircle className="w-3 h-3" /> Blocked: Missing primary source evidence
                    </div>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.sourcesUsed.map((s, j) => (
                    <span key={j} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 hover:text-indigo-300 cursor-pointer transition-colors">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>

        <PanelWrapper title="Source Mapping Graph (Simulated)">
          <div className="h-64 bg-slate-950 rounded-lg border border-slate-800 relative overflow-hidden flex items-center justify-center">
            {/* Simple SVG Graph Mockup */}
            <svg className="w-full h-full opacity-50">
              <circle cx="50%" cy="50%" r="40" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="50%" cy="50%" r="5" fill="var(--accent)" />
              
              {/* Nodes */}
              <circle cx="30%" cy="30%" r="4" fill="#8b5cf6" />
              <circle cx="70%" cy="30%" r="4" fill="#8b5cf6" />
              <circle cx="70%" cy="70%" r="4" fill="#3b82f6" />
              <circle cx="30%" cy="70%" r="4" fill="#3b82f6" />
              
              {/* Edges */}
              <line x1="50%" y1="50%" x2="30%" y2="30%" stroke="#475569" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="70%" y2="30%" stroke="#475569" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="70%" y2="70%" stroke="#475569" strokeWidth="1" />
              <line x1="50%" y1="50%" x2="30%" y2="70%" stroke="#475569" strokeWidth="1" />
              <line x1="30%" y1="30%" x2="70%" y2="30%" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className="text-[10px] text-slate-500 uppercase tracking-tighter">Knowledge Synthesis Hub</span>
            </div>
            <div className="absolute bottom-2 right-2 flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Concept</span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500"><span className="w-2 h-2 rounded-full bg-blue-500" /> Source</span>
            </div>
          </div>
        </PanelWrapper>
      </div>

      {/* Right Side: Truth Library & Gaps */}
      <div className="w-1/2 flex flex-col gap-4 p-4 overflow-y-auto">
        <PanelWrapper title="Synthesis 'Truth' Library">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
              <input 
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-indigo-500 outline-none transition-colors" 
                placeholder="Search synthesized truths..." 
              />
            </div>
            <button className="p-1.5 bg-slate-800 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
              <Filter className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-2">
            {truths.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedTruth(t)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedTruth?.id === t.id 
                  ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.1)]' 
                  : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-semibold text-slate-200">{t.concept}</span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/30">
                    {t.confidence * 100}% Conf
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{t.statement}</p>
              </div>
            ))}
          </div>
        </PanelWrapper>

        {selectedTruth && (
          <PanelWrapper title="Evidence Breakdown" className="border-indigo-500/30 bg-indigo-500/5">
            <div className="space-y-3">
              {selectedTruth.evidence.map((e, i) => (
                <div key={i} className="p-2 rounded bg-slate-900 border border-slate-800">
                  <div className="flex justify-between items-center mb-1">
                    <a href={e.sourceUrl} target="_blank" className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1">
                      <ExternalLink className="w-2 h-2" /> {e.sourceUrl}
                    </a>
                  </div>
                  <p className="text-xs text-slate-300 italic leading-relaxed">"{e.quote}"</p>
                </div>
              ))}
            </div>
          </PanelWrapper>
        )}

        <PanelWrapper title="Knowledge Gap Radar">
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative w-32 h-32">
              <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="8" />
                <circle 
                  cx="50" cy="50" r="40" fill="none" stroke="var(--accent)" strokeWidth="8" 
                  strokeDasharray="140 251" strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-200">64%</span>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400 mb-3">Coverage: Architecture & Benchmarks</p>
              <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/20">
                <GitBranch className="w-3 h-3" /> Trigger Deep Dive
              </button>
            </div>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
