'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  Share2, 
  Trash2, 
  Pin, 
  Search, 
  Filter,
  Info,
  Database,
  Zap
} from 'lucide-react';

// --- Types ---
interface MemoryNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'fact';
  weight: number;
  lastAccessed: string;
}

interface MemoryEdge {
  source: string;
  target: string;
  relationship: string;
  strength: number;
}

// --- Mock Data ---
const MOCK_NODES: MemoryNode[] = [
  { id: 'n1', label: 'Project Overlord', type: 'concept', weight: 0.95, lastAccessed: '2026-06-30T10:00:00Z' },
  { id: 'n2', label: 'Cluster C', type: 'concept', weight: 0.88, lastAccessed: '2026-06-30T11:30:00Z' },
  { id: 'n3', label: 'Knowledge Graph', type: 'entity', weight: 0.72, lastAccessed: '2026-06-29T09:15:00Z' },
  { id: 'n4', label: 'Recursive Loops', type: 'fact', weight: 0.65, lastAccessed: '2026-06-30T08:45:00Z' },
  { id: 'n5', label: 'Premium Dark Theme', type: 'fact', weight: 0.45, lastAccessed: '2026-06-25T14:20:00Z' },
  { id: 'n6', label: 'MCP Protocol', type: 'entity', weight: 0.90, lastAccessed: '2026-06-30T12:00:00Z' },
];

const MOCK_EDGES: MemoryEdge[] = [
  { source: 'n1', target: 'n2', relationship: 'contains', strength: 0.9 },
  { source: 'n2', target: 'n3', relationship: 'implements', strength: 0.8 },
  { source: 'n2', target: 'n4', relationship: 'implements', strength: 0.8 },
  { source: 'n3', target: 'n6', relationship: 'utilizes', strength: 0.7 },
];

export default function MemoryPage() {
  const [selectedNode, setSelectedNode] = useState<MemoryNode | null>(MOCK_NODES[0]);
  const [pinnedNodes, setPinnedNodes] = useState<string[]>(['n1', 'n6']);
  const [importanceThreshold, setImportanceThreshold] = useState(0.5);

  const togglePin = (id: string) => {
    setPinnedNodes(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <Database className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Neural Memory Store</h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search entities..." 
              className="bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-md text-xs transition-all">
            <Trash2 size={14} /> Purge Low-Weight
          </button>
        </div>
      </div>

      {/* Knowledge Graph Visualization (Mock) */}
      <div className="col-span-8">
        <PanelWrapper title="Knowledge Graph Viewer">
          <div className="relative h-[600px] w-full bg-slate-900/30 rounded-lg border border-slate-800 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing">
            <svg className="absolute inset-0 w-full h-full opacity-60">
              {MOCK_EDGES.map((edge, i) => {
                const s = MOCK_NODES.find(n => n.id === edge.source);
                const t = MOCK_NODES.find(n => n.id === edge.target);
                // Random coords for mock visualization
                const x1 = 200 + Math.random() * 200;
                const y1 = 200 + Math.random() * 200;
                const x2 = 400 + Math.random() * 200;
                const y2 = 200 + Math.random() * 200;
                return (
                  <line 
                    key={i} 
                    x1={x1} y1={y1} x2={x2} y2={y2} 
                    stroke="#4f46e5" 
                    strokeWidth={edge.strength * 3} 
                    strokeOpacity={0.4}
                  />
                );
              })}
              {MOCK_NODES.map((node, i) => {
                const x = 200 + Math.random() * 400;
                const y = 100 + Math.random() * 400;
                return (
                  <g key={node.id} onClick={() => setSelectedNode(node)} className="cursor-pointer">
                    <circle 
                      cx={x} cy={y} 
                      r={20 * node.weight} 
                      fill={selectedNode?.id === node.id ? '#818cf8' : '#1e293b'} 
                      stroke="#6366f1" 
                      strokeWidth="2"
                      className="transition-all duration-300"
                    />
                    <text x={x} y={y + 35} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">{node.label}</text>
                  </g>
                );
              })}
            </svg>
            <div className="absolute bottom-4 left-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-500 space-y-1">
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Concept</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /> Entity</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-600" /> Fact</div>
            </div>
          </div>
        </PanelWrapper>
      </div>

      {/* Right Sidebar */}
      <div className="col-span-4 flex flex-col gap-4">
        <PanelWrapper title="Entity Inspector">
          {selectedNode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-indigo-300">{selectedNode.label}</h3>
                <button 
                  onClick={() => togglePin(selectedNode.id)}
                  className={`p-2 rounded-md transition-all ${pinnedNodes.includes(selectedNode.id) ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                >
                  <Pin size={16} fill={pinnedNodes.includes(selectedNode.id) ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-md">
                  <p className="text-[10px] text-slate-500 uppercase">Weight</p>
                  <p className="text-sm font-mono text-slate-300">{(selectedNode.weight * 100).toFixed(1)}%</p>
                </div>
                <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-md">
                  <p className="text-[10px] text-slate-500 uppercase">Type</p>
                  <p className="text-sm font-mono text-slate-300 capitalize">{selectedNode.type}</p>
                </div>
              </div>
              <div className="p-2 bg-slate-900/50 border border-slate-800 rounded-md">
                <p className="text-[10px] text-slate-500 uppercase">Last Accessed</p>
                <p className="text-xs font-mono text-slate-400">{selectedNode.lastAccessed}</p>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic text-center py-10">Select a node to inspect</div>
          )}
        </PanelWrapper>

        <PanelWrapper title="Memory Pruning">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Decay Rate</span>
                <span className="text-indigo-400 font-mono">0.02 / cycle</span>
              </div>
              <input type="range" className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Importance Threshold</span>
                <span className="text-indigo-400 font-mono">{importanceThreshold}</span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.05" 
                value={importanceThreshold} 
                onChange={(e) => setImportanceThreshold(parseFloat(e.target.value))}
                className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
              />
            </div>
          </div>
        </PanelWrapper>

        <PanelWrapper title="Context Injection">
          <div className="flex flex-col gap-2">
            {pinnedNodes.map(id => {
              const node = MOCK_NODES.find(n => n.id === id);
              return node ? (
                <div key={id} className="flex items-center justify-between p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-md text-xs text-slate-300 group">
                  <span className="flex items-center gap-2">
                    <Pin size={12} className="text-indigo-400" />
                    {node.label}
                  </span>
                  <button onClick={() => togglePin(id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
                    <Trash2 size={12} />
                  </button>
                </div>
              ) : null;
            })}
            {pinnedNodes.length === 0 && <div className="text-[10px] text-slate-600 text-center py-4 italic">No pinned memories</div>}
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
