'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  Search, RotateCw, Play, Pause, RefreshCw, X, FileText, Database, 
  Sparkles, ZoomIn, ZoomOut, AlertCircle, Cpu
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

// Load ForceGraph3D dynamically to prevent hydration/document issues on the server
const ForceGraph3D = dynamic(
  () => import('react-force-graph-3d').then((mod) => mod.default),
  { ssr: false }
);

interface NodeData {
  id: string;
  slug: string;
  label: string;
  type: string;
  text: string;
  created_at: string;
  topological_rank: number;
  x?: number;
  y?: number;
  z?: number;
}

interface EdgeData {
  id: string;
  source: string | { id: string };
  target: string | { id: string };
  relationship: string;
  label: string;
  text: string;
  created_at: string;
}

const TYPE_COLORS: Record<string, string> = {
  fact: '#3b82f6',       // Blue
  insight: '#8b5cf6',    // Purple
  decision: '#10b981',   // Emerald
  todo: '#f59e0b',       // Amber
  context: '#64748b',    // Slate
  concept: '#e11d48',    // Rose
  person: '#06b6d4',     // Cyan
  document: '#10b981',   // Emerald
  session: '#f43f5e',    // Rose-red
  memory: '#8b5cf6',     // Purple
};

export function Cognee3DGraph() {
  const [graphData, setGraphData] = useState<{ nodes: NodeData[]; links: EdgeData[] }>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRotate, setAutoRotate] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const addToast = useUIStore((s) => s.addToast);

  // Resize listener
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Fetch Cognee graph data
  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cognee/graph?limit=150');
      const data = await res.json();
      if (data.success) {
        // Map edges to "links" property which react-force-graph expects
        const links = (data.edges || []).map((e: any) => ({
          ...e,
          source: e.source,
          target: e.target,
        }));
        setGraphData({ nodes: data.nodes || [], links });
      } else {
        setError(data.error || 'Failed to fetch graph data');
      }
    } catch (err: any) {
      setError(err.message || 'Network error fetching Cognee graph');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraphData();
  }, [fetchGraphData]);

  // Handle auto-rotation
  useEffect(() => {
    let angle = 0;
    const interval = setInterval(() => {
      if (autoRotate && fgRef.current) {
        angle += 0.002;
        fgRef.current.cameraPosition({
          x: 250 * Math.sin(angle),
          z: 250 * Math.cos(angle)
        }, undefined, 100); // smooth step transition
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoRotate]);

  // Node filtering
  const filteredData = useMemo(() => {
    let nodes = graphData.nodes;
    let links = graphData.links;

    if (filterType) {
      nodes = nodes.filter((n) => n.type.toLowerCase() === filterType.toLowerCase());
      // Only keep edges connecting filtered nodes
      const nodeIds = new Set(nodes.map((n) => n.id));
      links = links.filter((link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      nodes = nodes.filter(
        (n) => n.label.toLowerCase().includes(query) || n.text.toLowerCase().includes(query)
      );
      const nodeIds = new Set(nodes.map((n) => n.id));
      links = links.filter((link) => {
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return nodeIds.has(sourceId) && nodeIds.has(targetId);
      });
    }

    return { nodes, links };
  }, [graphData, filterType, searchQuery]);

  // Types list for filtering
  const allTypes = useMemo(() => {
    const types = new Set<string>();
    graphData.nodes.forEach((n) => {
      if (n.type) types.add(n.type);
    });
    return Array.from(types);
  }, [graphData.nodes]);

  // Focus camera on a node
  const focusNode = useCallback((node: NodeData) => {
    if (!fgRef.current) return;
    setSelectedNode(node);
    setAutoRotate(false); // Stop rotating on focus

    // Aim camera from a moderate distance, look at node center
    const distance = 80;
    const distRatio = 1 + distance / Math.hypot(node.x || 0, node.y || 0, node.z || 0);

    fgRef.current.cameraPosition(
      {
        x: (node.x || 0) * distRatio,
        y: (node.y || 0) * distRatio,
        z: (node.z || 0) * distRatio,
      },
      node, // lookAt node
      1500  // transition ms
    );
  }, []);

  const handleNodeClick = useCallback((node: any) => {
    focusNode(node);
  }, [focusNode]);

  // Node rendering custom styling
  const nodeColorAccessor = useCallback((node: any) => {
    return TYPE_COLORS[node.type.toLowerCase()] || '#a1a1aa';
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase();
    const found = graphData.nodes.find((n) => n.label.toLowerCase().includes(query));
    if (found) {
      focusNode(found);
      addToast({ type: 'info', message: `Focused on: ${found.label}` });
    } else {
      addToast({ type: 'warning', message: 'Node not found' });
    }
  };

  const handleZoomIn = () => {
    if (!fgRef.current) return;
    const cam = fgRef.current.camera();
    fgRef.current.cameraPosition(
      { x: cam.position.x * 0.8, y: cam.position.y * 0.8, z: cam.position.z * 0.8 },
      undefined,
      500
    );
  };

  const handleZoomOut = () => {
    if (!fgRef.current) return;
    const cam = fgRef.current.camera();
    fgRef.current.cameraPosition(
      { x: cam.position.x * 1.25, y: cam.position.y * 1.25, z: cam.position.z * 1.25 },
      undefined,
      500
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] text-zinc-100 relative">
      
      {/* 3D Visualizer Canvas */}
      <div ref={containerRef} className="flex-1 w-full relative">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]/80 z-20 gap-3">
            <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
            <p className="text-xs text-zinc-400 font-mono">Loading 3D Knowledge Graph...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]/95 z-20 max-w-md mx-auto text-center gap-3">
            <AlertCircle className="w-10 h-10 text-red-500" />
            <p className="text-sm font-semibold text-red-400">Failed to Load Cognee Graph</p>
            <p className="text-xs text-zinc-500 font-mono leading-relaxed">{error}</p>
            <button 
              onClick={fetchGraphData} 
              className="mt-2 btn btn-secondary btn-sm"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && filteredData.nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0d0d]/80 z-20 gap-2">
            <Database className="w-10 h-10 text-zinc-600 animate-pulse" />
            <p className="text-xs text-zinc-500 font-mono">No nodes match current filters.</p>
          </div>
        )}

        {/* 3D Force Graph Render */}
        {!error && (
          <ForceGraph3D
            ref={fgRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={filteredData}
            nodeLabel={(node: any) => `<div class="px-2.5 py-1 bg-black/90 border border-zinc-800 rounded-md shadow-lg text-xs font-medium"><span class="opacity-60">[${node.type}]</span> ${node.label}</div>`}
            nodeColor={nodeColorAccessor}
            nodeVal={(node: any) => 3 + (node.topological_rank || 0) * 1.5}
            nodeResolution={24}
            linkWidth={1}
            linkColor={() => 'rgba(63, 63, 70, 0.4)'}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={1.5}
            linkDirectionalParticleColor={(link: any) => {
              const tgt = typeof link.target === 'object' ? link.target : graphData.nodes.find(n => n.id === link.target);
              return tgt ? nodeColorAccessor(tgt) : 'var(--accent)';
            }}
            onNodeClick={handleNodeClick}
            backgroundColor="#0d0d0d"
          />
        )}

        {/* Floating Controller HUD */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          {/* Search bar */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 bg-black/70 border border-zinc-800 rounded-lg p-1.5 shadow-xl backdrop-blur-md">
            <Search className="w-3.5 h-3.5 text-zinc-500 ml-1" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 3D nodes..."
              className="bg-transparent border-0 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none w-36"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} className="p-0.5 hover:bg-zinc-800 rounded">
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            )}
          </form>

          {/* Quick Stats Panel */}
          <div className="bg-black/70 border border-zinc-800 rounded-lg p-3 shadow-xl backdrop-blur-md font-mono text-[10px] text-zinc-400 space-y-1">
            <div className="flex items-center gap-1 text-[var(--accent)] font-semibold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>JARVIS CORE</span>
            </div>
            <div>Nodes: <span className="text-zinc-200">{graphData.nodes.length}</span></div>
            <div>Relationships: <span className="text-zinc-200">{graphData.links.length}</span></div>
          </div>
        </div>

        {/* Floating Utility Controls (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5">
          <button 
            onClick={() => setAutoRotate(!autoRotate)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
              autoRotate 
                ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]' 
                : 'bg-black/70 border-zinc-800 text-zinc-400 hover:text-zinc-100'
            }`}
            title="Auto Orbit Rotation"
          >
            {autoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 animate-pulse" />}
          </button>
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/70 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/70 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={fetchGraphData}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-black/70 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Reload Cognee DB"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Node detail slide-out overlay (right side) */}
        {selectedNode && (
          <div className="absolute top-4 right-4 bottom-4 w-72 bg-black/85 border border-zinc-800 rounded-xl shadow-2xl z-10 flex flex-col backdrop-blur-lg overflow-hidden animate-slide-in">
            {/* Detail Header */}
            <div className="flex items-center justify-between p-4 border-b border-zinc-800">
              <span className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                Node Properties
              </span>
              <button 
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide"
                  style={{ 
                    backgroundColor: `${nodeColorAccessor(selectedNode)}20`, 
                    color: nodeColorAccessor(selectedNode),
                    border: `1px solid ${nodeColorAccessor(selectedNode)}40`
                  }}
                >
                  {selectedNode.type}
                </span>
                <h4 className="text-sm font-semibold mt-2 text-zinc-100 leading-snug">{selectedNode.label}</h4>
              </div>

              {selectedNode.topological_rank > 0 && (
                <div className="p-2.5 rounded bg-zinc-900/60 border border-zinc-800 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-mono">Topological Rank</span>
                  <span className="text-xs font-bold text-[var(--accent)] font-mono">{selectedNode.topological_rank}</span>
                </div>
              )}

              {selectedNode.text && (
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Extracted Content</span>
                  <div className="p-3 rounded bg-zinc-950/80 border border-zinc-900 max-h-48 overflow-y-auto">
                    <p className="text-[11.5px] leading-relaxed text-zinc-300 font-sans whitespace-pre-line">
                      {selectedNode.text}
                    </p>
                  </div>
                </div>
              )}

              {selectedNode.created_at && (
                <div className="text-[10px] text-zinc-500 font-mono">
                  Indexed on: {new Date(selectedNode.created_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-end">
              <button 
                onClick={() => {
                  // Link to local editor file: open file based on slug or path
                  addToast({ type: 'info', message: `Opening: ${selectedNode.slug}` });
                  window.dispatchEvent(new CustomEvent('overlord-open-file', { detail: { path: selectedNode.slug } }));
                }}
                className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs w-full justify-center"
              >
                <FileText className="w-3.5 h-3.5" />
                Open File
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Categories filter bar (bottom) */}
      <div className="bg-[#0b0b0b] border-t border-zinc-900 px-4 py-2 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
        <span className="text-[10px] uppercase font-semibold text-zinc-500 shrink-0 tracking-wider">Filter:</span>
        <button 
          onClick={() => setFilterType(null)}
          className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-all ${
            !filterType 
              ? 'bg-zinc-800 text-zinc-100 shadow' 
              : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
          }`}
        >
          All
        </button>
        {allTypes.map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`px-2.5 py-1 text-[10px] rounded-md font-medium transition-all flex items-center gap-1.5 ${
              filterType === t 
                ? 'bg-zinc-800 text-zinc-100 shadow' 
                : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
            }`}
          >
            <span 
              className="w-1.5 h-1.5 rounded-full" 
              style={{ backgroundColor: TYPE_COLORS[t.toLowerCase()] || '#a1a1aa' }} 
            />
            <span className="capitalize">{t}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
