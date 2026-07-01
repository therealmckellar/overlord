'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  Layers,
  Globe,
  Settings,
  AlertCircle
} from 'lucide-react';

// --- Types ---
interface Target {
  platform: string;
  scheduledTime: string;
  isTriggered: boolean;
}

interface PipelineItem {
  id: string;
  content: string;
  currentStage: 'draft' | 'review' | 'polish' | 'distribute';
  history: { stage: string; timestamp: string }[];
  targets: Target[];
}

// --- Mock Data ---
const MOCK_PIPELINE: PipelineItem[] = [
  {
    id: 'pipe-1',
    content: 'The emergence of Agentic Workflows in 2026 has fundamentally shifted the paradigm of software engineering from "coding" to "orchestration". By leveraging Recursive-Loop patterns, agents can now self-correct their logic paths without human intervention...',
    currentStage: 'review',
    history: [
      { stage: 'draft', timestamp: '2026-06-30T10:00:00Z' },
      { stage: 'review', timestamp: '2026-06-30T11:15:00Z' },
    ],
    targets: [
      { platform: 'X (Twitter)', scheduledTime: '2026-07-01T09:00:00Z', isTriggered: false },
      { platform: 'Discord', scheduledTime: '2026-07-01T09:05:00Z', isTriggered: false },
      { platform: 'WordPress', scheduledTime: '2026-07-01T10:00:00Z', isTriggered: false },
    ],
  },
  {
    id: 'pipe-2',
    content: 'A comprehensive analysis of MCP-Server Connection Timeouts in distributed agent clusters. We found that implementing a back-off jitter strategy reduced failures by 42% across the GitHub-Relay node...',
    currentStage: 'draft',
    history: [
      { stage: 'draft', timestamp: '2026-06-30T12:00:00Z' },
    ],
    targets: [
      { platform: 'X (Twitter)', scheduledTime: '2026-07-01T12:00:00Z', isTriggered: false },
    ],
  },
];

export default function ContentPipelinePage() {
  const [selectedItem, setSelectedItem] = useState<PipelineItem | null>(MOCK_PIPELINE[0]);

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <Layers className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Content Generation Pipeline</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md text-xs hover:bg-indigo-500/20 transition-all">
            Force Trigger All
          </button>
          <button className="px-3 py-1.5 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-700 transition-all">
            Pipeline Settings
          </button>
        </div>
      </div>

      {/* Pipeline Queue */}
      <div className="col-span-4 space-y-4">
        <PanelWrapper title="Generation Queue">
          <div className="flex flex-col gap-3">
            {MOCK_PIPELINE.map(item => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedItem?.id === item.id 
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-mono opacity-60">{item.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                    item.currentStage === 'distribute' ? 'bg-green-500/20 text-green-400' : 
                    item.currentStage === 'review' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'
                  }`}>
                    {item.currentStage}
                  </span>
                </div>
                <p className="text-xs line-clamp-2 mb-3">{item.content}</p>
                <div className="flex justify-between items-center text-[10px]">
                  <div className="flex items-center gap-1 text-slate-500">
                    <Clock size={10} /> {item.history[0].timestamp.split('T')[0]}
                  </div>
                  <div className="text-indigo-400 flex items-center gap-1">
                    {item.targets.length} Targets <ChevronRight size={10} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      </div>

      {/* Pipeline Flow & Editor */}
      <div className="col-span-8 space-y-4">
        {selectedItem ? (
          <>
            <PanelWrapper title="Workflow Stage Progress">
              <div className="flex items-center justify-between relative px-4 py-6">
                {/* Line background */}
                <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />
                
                {['draft', 'review', 'polish', 'distribute'].map((stage, i) => {
                  const isActive = selectedItem.currentStage === stage;
                  const isCompleted = ['draft', 'review', 'polish', 'distribute'].indexOf(selectedItem.currentStage) > i;
                  return (
                    <div key={stage} className="relative z-10 flex flex-col items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                        isCompleted ? 'bg-indigo-500 border-indigo-400 text-white' : 
                        isActive ? 'bg-slate-950 border-indigo-500 text-indigo-400 animate-pulse' : 
                        'bg-slate-900 border-slate-800 text-slate-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-bold">{i+1}</span>}
                      </div>
                      <span className={`text-[10px] uppercase font-medium ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}>
                        {stage}
                      </span>
                    </div>
                  );
                })}
              </div>
            </PanelWrapper>

            <PanelWrapper title="Review & Refinement">
              <div className="grid grid-cols-2 gap-4 h-[400px]">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase">Agent Draft</span>
                    <div className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] rounded">AI-Generated</div>
                  </div>
                  <div className="flex-grow bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 overflow-y-auto font-serif leading-relaxed">
                    {selectedItem.content}
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] text-slate-500 uppercase">User Edit</span>
                    <div className="px-1.5 py-0.5 bg-green-500/10 text-green-400 text-[9px] rounded">Human-Corrected</div>
                  </div>
                  <textarea 
                    className="flex-grow bg-slate-900 border border-slate-800 rounded-lg p-4 text-sm text-slate-200 overflow-y-auto font-serif leading-relaxed focus:outline-none focus:border-indigo-500/50"
                    defaultValue={selectedItem.content}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button className="px-4 py-2 bg-slate-800 border border-slate-700 text-slate-300 rounded-md text-xs hover:bg-slate-700 transition-all">
                  Request Re-generation
                </button>
                <button className="px-4 py-2 bg-indigo-500 text-white rounded-md text-xs hover:bg-indigo-600 transition-all">
                  Approve & Advance
                </button>
              </div>
            </PanelWrapper>

            <PanelWrapper title="Distribution Targets">
              <div className="grid grid-cols-3 gap-4">
                {selectedItem.targets.map((target, i) => (
                  <div key={i} className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        target.isTriggered ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Globe size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-300">{target.platform}</p>
                        <p className="text-[10px] text-slate-500 font-mono">{target.scheduledTime}</p>
                      </div>
                    </div>
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        className="w-3 h-3 rounded bg-slate-800 border-slate-700 accent-indigo-500 cursor-pointer"
                        checked={target.isTriggered}
                        onChange={() => {}} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </PanelWrapper>
          </>
        ) : (
          <div className="flex items-center justify-center h-full py-20 text-slate-500 italic text-sm">
            Select an item from the queue to manage pipeline
          </div>
        )}
      </div>
    </div>
  );
}
