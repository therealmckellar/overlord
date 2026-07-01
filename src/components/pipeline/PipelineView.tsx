'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { PipelineNode, PipelineEdge } from '@/types/cluster-a';
import { Play, RotateCcw, Info, X, ChevronRight } from 'lucide-react';

const MOCK_NODES: PipelineNode[] = [
  { id: '1', type: 'prompt', label: 'Lead Analysis', status: 'success', timestamp: '10:00:01', inputData: 'Lead: John Doe, CEO of Acme Corp', outputData: 'High intent, needs scalability solution', config: { prompt: 'Analyze lead intent...' } },
  { id: '2', type: 'tool', label: 'LinkedIn Scraper', status: 'success', timestamp: '10:00:05', inputData: 'John Doe', outputData: 'Recent post: "Looking for AI automation"', config: { tool: 'linkedin_search' } },
  { id: '3', type: 'prompt', label: 'Outreach Gen', status: 'executing', timestamp: '10:00:10', inputData: 'Intent: High, Context: AI automation', outputData: null, config: { prompt: 'Draft personalized email...' } },
  { id: '4', type: 'tool', label: 'Email Dispatch', status: 'pending', timestamp: '', inputData: null, outputData: null, config: { tool: 'send_grid' } },
];

const MOCK_EDGES: PipelineEdge[] = [
  { id: 'e1-2', source: '1', target: '2', payload: { leadId: 'LD-99' } },
  { id: 'e2-3', source: '2', target: '3', payload: { scrapeResult: 'Recent post content' } },
  { id: 'e3-4', source: '3', target: '4', payload: { emailDraft: 'Hello John...' } },
];

export default function Pipeline() {
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);

  return (
    <div className="flex h-full gap-6 p-6 animate-fade-in">
      {/* Visual Flow Canvas */}
      <div className="flex-1 relative bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-12">
        <div className="flex items-center gap-12 relative">
          {MOCK_NODES.map((node, idx) => (
            <React.Fragment key={node.id}>
              <Node 
                node={node} 
                onClick={() => setSelectedNode(node)} 
                isSelected={selectedNode?.id === node.id} 
              />
              {idx < MOCK_NODES.length - 1 && <Edge edge={MOCK_EDGES[idx]} />}
            </React.Fragment>
          ))}
        </div>
        <div className="absolute top-4 left-4 flex gap-3">
          <button className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700">
            <Play size={16} />
          </button>
          <button className="p-2 rounded-md bg-slate-800 hover:bg-slate-700 text-white transition-colors border border-slate-700">
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Step Inspector */}
      <div className="w-96 flex flex-col gap-4">
        {selectedNode ? (
          <PanelWrapper title={`Step Inspector: ${selectedNode.label}`}>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  selectedNode.status === 'success' ? 'bg-green-500/10 text-green-400' : 
                  selectedNode.status === 'executing' ? 'bg-blue-500/10 text-blue-400 animate-pulse' : 
                  'bg-slate-800 text-slate-400'
                }`}>
                  {selectedNode.status}
                </span>
                <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <section>
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Input</h4>
                  <div className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-slate-300 border border-slate-800">
                    {selectedNode.inputData || 'No input data'}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Configuration</h4>
                  <div className="p-3 rounded-lg bg-slate-950 text-xs font-mono text-indigo-300 border border-slate-800">
                    {JSON.stringify(selectedNode.config, null, 2)}
                  </div>
                </section>

                <section>
                  <h4 className="text-xs font-medium text-slate-500 uppercase mb-2">Output</td>
                  <div className={`p-3 rounded-lg text-xs font-mono border border-slate-800 ${
                    selectedNode.outputData ? 'bg-slate-950 text-slate-300' : 'bg-slate-900/50 text-slate-600 italic'
                  }`}>
                    {selectedNode.outputData || 'Waiting for execution...'}
                  </div>
                </section>
              </div>

              <button className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <RotateCcw size={14} />
                Retry Step
              </button>
            </div>
          </PanelWrapper>
        ) : (
          <PanelWrapper title="Pipeline Details">
            <div className="flex flex-col items-center justify-center text-center py-12 text-slate-500">
              <Info size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Select a node to inspect step details</p>
            </div>
          </PanelWrapper>
        )}
      </div>
    </div>
  );
}

function Node({ node, onClick, isSelected }: { node: PipelineNode, onClick: () => void, isSelected: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 w-48 ${
        isSelected 
          ? 'border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(79,70,229,0.3)]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500'
      }`}
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-tighter">{node.type}</span>
        <div className={`w-2 h-2 rounded-full ${
          node.status === 'success' ? 'bg-green-500' : 
          node.status === 'executing' ? 'bg-blue-500 animate-pulse' : 
          'bg-slate-600'
        }`} />
      </div>
      <div className="text-sm font-medium text-white mb-2 truncate">{node.label}</div>
      <div className="text-[10px] text-slate-500 font-mono">{node.timestamp}</div>
    </div>
  );
}

function Edge({ edge }: { edge: PipelineEdge }) {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <div className="w-12 h-px bg-slate-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-indigo-500 animate-slide-right" style={{ animationDuration: '2s' }} />
      </div>
      <ChevronRight size={16} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
    </div>
  );
}
