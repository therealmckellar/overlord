'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useMemoryStore, type Memory } from '@/stores/memoryStore';
import { useUIStore } from '@/stores/uiStore';
import {
  Brain, Search, Plus, Trash2, Pin, Tag, Filter,
  X, Sparkles, ChevronDown, ChevronUp, Network,
  RefreshCw, Link2, Eye, BookOpen, Heart, FileDown,
  Zap, AlertTriangle, CheckCircle
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface VaultMemory {
  id: string;
  filename: string;
  source: string;
  type: string;
  tags: string[];
  content: string;
  createdAt: string | null;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'memory' | 'tag' | 'source';
  color: string;
  x: number;
  y: number;
  connections: number;
}

interface GraphEdge {
  source: string;
  target: string;
  label?: string;
}

interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

interface WikiSearchResult {
  id: string;
  title: string;
  relativePath: string;
  snippet: string;
  tags: string[];
  type: string;
  confidence: string;
  score: number;
}

interface WikiLintSummary {
  totalFiles: number;
  totalIssues: number;
  errors: number;
  warnings: number;
  info: number;
  byCheck: Record<string, number>;
  reportFile?: string;
}

// ─── Colors ─────────────────────────────────────────────────────────────────

const TYPE_COLORS: Record<string, string> = {
  fact: '#3b82f6',
  insight: '#8b5cf6',
  decision: '#10b981',
  todo: '#f59e0b',
  context: '#64748b',
  memory: '#8b5cf6',
  tag: '#f59e0b',
  source: '#3b82f6',
};

const SOURCE_COLORS: Record<string, string> = {
  steve: '#8b5cf6',
  david: '#3b82f6',
  josh: '#10b981',
  fathom: '#f59e0b',
  system: '#64748b',
  Rich: '#ec4899',
};

// ─── Props ──────────────────────────────────────────────────────────────────

interface MemoryGalaxyProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewMode = 'list' | 'graph' | 'cognee' | 'wiki';

// ─── Component ──────────────────────────────────────────────────────────────

export function MemoryGalaxy({ isOpen, onClose }: MemoryGalaxyProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [source, setSource] = useState('steve');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [vaultMemories, setVaultMemories] = useState<VaultMemory[]>([]);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);

  // ─── Wiki state ────────────────────────────────────────────────────────────
  const [wikiQuery, setWikiQuery] = useState('');
  const [wikiResults, setWikiResults] = useState<WikiSearchResult[]>([]);
  const [wikiSearching, setWikiSearching] = useState(false);
  const [lintSummary, setLintSummary] = useState<WikiLintSummary | null>(null);
  const [lintRunning, setLintRunning] = useState(false);
  const [compactRunning, setCompactRunning] = useState(false);
  const [fileToWikiContent, setFileToWikiContent] = useState('');
  const [fileToWikiCategory, setFileToWikiCategory] = useState('shared');
  const [fileToWikiTitle, setFileToWikiTitle] = useState('');
  const [showFileForm, setShowFileForm] = useState(false);

  const addToast = useUIStore((s) => s.addToast);

  // ─── Wiki handlers ────────────────────────────────────────────────────────────────
  const handleWikiSearch = useCallback(async () => {
    if (!wikiQuery.trim() || wikiQuery.length < 2) return;
    setWikiSearching(true);
    try {
      const res = await fetch(`/api/wiki/search?q=${encodeURIComponent(wikiQuery)}&limit=20`);
      const data = await res.json();
      if (data.success) {
        setWikiResults(data.results || []);
      }
    } catch { /* search failed */ }
    setWikiSearching(false);
  }, [wikiQuery]);

  const handleLintRun = useCallback(async () => {
    setLintRunning(true);
    try {
      const res = await fetch('/api/wiki/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checks: 'orphans,broken-links,missing-frontmatter,incomplete-frontmatter,oversized,stale,duplicates,missing-index,invalid-tags' }),
      });
      const data = await res.json();
      if (data.success) {
        setLintSummary(data.summary);
        addToast({ type: 'info', message: `Lint complete: ${data.summary.errors} errors, ${data.summary.warnings} warnings` });
      }
    } catch { /* lint failed */ }
    setLintRunning(false);
  }, [addToast]);

  const handleCompact = useCallback(async (apply: boolean = false) => {
    setCompactRunning(true);
    try {
      const res = await fetch('/api/wiki/compact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apply, pruneOrphans: apply }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: apply ? 'success' : 'info', message: `Compact ${apply ? 'applied' : 'dry run'}: ${data.totalActions} actions` });
      }
    } catch { /* compact failed */ }
    setCompactRunning(false);
  }, [addToast]);

  const handleFileToWiki = useCallback(async () => {
    if (!fileToWikiContent.trim()) return;
    try {
      const res = await fetch('/api/wiki/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: fileToWikiContent,
          title: fileToWikiTitle || undefined,
          category: fileToWikiCategory,
          type: 'concept',
          tags: fileToWikiCategory === 'robbi' ? ['robbi-promotional'] : fileToWikiCategory === 'mcf' ? ['commercial-funding'] : [],
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({ type: 'success', message: `Filed to wiki: ${data.file}` });
        setFileToWikiContent('');
        setFileToWikiTitle('');
        setShowFileForm(false);
      }
    } catch { /* file failed */ }
  }, [fileToWikiContent, fileToWikiTitle, fileToWikiCategory, addToast]);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    searchQuery, setSearchQuery,
    filterTag, setFilterTag,
    filterSource, setFilterSource,
    getAllTags, getAllSources,
    getFilteredMemories,
    addMemory, deleteMemory, updateMemory,
  } = useMemoryStore();

  const filtered = getFilteredMemories();
  const allTags = getAllTags();
  const allSources = getAllSources();

  // ─── Vault sync ────────────────────────────────────────────────────────────

  const syncFromVault = useCallback(async () => {
    try {
      const res = await fetch('/api/memory');
      const data = await res.json();
      if (data.success) {
        setVaultMemories(data.memories);
        return data.memories as VaultMemory[];
      }
    } catch {
      // Vault not available yet
    }
    return [];
  }, []);

  // ─── Graph generation ─────────────────────────────────────────────────────

  const generateGraphData = useCallback((memories: VaultMemory[]): GraphData => {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const tagNodes = new Map<string, number>();
    const sourceNodes = new Map<string, number>();

    // Create memory nodes
    memories.forEach((mem, i) => {
      const angle = (i / memories.length) * Math.PI * 2;
      const radius = 150 + Math.random() * 100;
      const color = TYPE_COLORS[mem.type] || TYPE_COLORS.memory;

      nodes.push({
        id: mem.id,
        label: mem.content.slice(0, 40) + (mem.content.length > 40 ? '...' : ''),
        type: 'memory',
        color,
        x: 400 + Math.cos(angle) * radius,
        y: 300 + Math.sin(angle) * radius,
        connections: 0,
      });

      // Create tag nodes
      mem.tags.forEach((tag) => {
        if (!tagNodes.has(tag)) {
          const tagAngle = Math.random() * Math.PI * 2;
          const tagRadius = 80 + Math.random() * 60;
          tagNodes.set(tag, nodes.length);
          nodes.push({
            id: `tag:${tag}`,
            label: `#${tag}`,
            type: 'tag',
            color: TYPE_COLORS.tag,
            x: 400 + Math.cos(tagAngle) * tagRadius,
            y: 300 + Math.sin(tagAngle) * tagRadius,
            connections: 0,
          });
        }
        edges.push({ source: mem.id, target: `tag:${tag}`, label: 'tagged' });
      });

      // Create source nodes
      const src = mem.source || 'overlord';
      if (!sourceNodes.has(src)) {
        sourceNodes.set(src, nodes.length);
        nodes.push({
          id: `source:${src}`,
          label: src,
          type: 'source',
          color: SOURCE_COLORS[src] || TYPE_COLORS.source,
          x: 400 + (Math.random() - 0.5) * 300,
          y: 300 + (Math.random() - 0.5) * 300,
          connections: 0,
        });
      }
      edges.push({ source: mem.id, target: `source:${src}`, label: 'from' });
    });

    // Count connections
    edges.forEach((edge) => {
      const srcNode = nodes.find(n => n.id === edge.source);
      const tgtNode = nodes.find(n => n.id === edge.target);
      if (srcNode) srcNode.connections++;
      if (tgtNode) tgtNode.connections++;
    });

    return { nodes, edges };
  }, []);

  // ─── Load graph data ──────────────────────────────────────────────────────

  const loadGraph = useCallback(async () => {
    setIsLoadingGraph(true);
    const mems = await syncFromVault();
    if (mems.length > 0) {
      const data = generateGraphData(mems);
      setGraphData(data);
    }
    setIsLoadingGraph(false);
  }, [syncFromVault, generateGraphData]);

  useEffect(() => {
    if (isOpen && viewMode === 'graph') {
      loadGraph();
    }
  }, [isOpen, viewMode, loadGraph]);

  // ─── Slide generation ─────────────────────────────────────────────────────

  const [slidingId, setSlidingId] = useState<string | null>(null);
  const [slideUrl, setSlideUrl] = useState<string | null>(null);

  const handleSlide = useCallback(async (memoryId: string) => {
    setSlidingId(memoryId);
    setSlideUrl(null);
    try {
      const res = await fetch('/api/slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoryId, format: 'html' }),
      });
      const data = await res.json();
      if (data.success && data.htmlUrl) {
        setSlideUrl(data.htmlUrl);
        addToast({ type: 'success', message: 'Slide deck generated!' });
      } else {
        addToast({ type: 'error', message: data.error || 'Failed to generate slide' });
      }
    } catch {
      addToast({ type: 'error', message: 'Network error generating slide' });
    } finally {
      setSlidingId(null);
    }
  }, [addToast]);

  // ─── Canvas rendering ─────────────────────────────────────────────────────

  useEffect(() => {
    if (viewMode !== 'graph' || !graphData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Clear
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Draw edges
    graphData.edges.forEach((edge) => {
      const src = graphData.nodes.find(n => n.id === edge.source);
      const tgt = graphData.nodes.find(n => n.id === edge.target);
      if (!src || !tgt) return;

      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      ctx.lineTo(tgt.x, tgt.y);
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.2)';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Draw nodes
    graphData.nodes.forEach((node) => {
      const isSelected = selectedGraphNode === node.id;
      const radius = node.type === 'memory' ? 6 + node.connections : 5;

      // Glow
      if (isSelected) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 8, 0, Math.PI * 2);
        ctx.fillStyle = node.color + '30';
        ctx.fill();
      }

      // Node
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Label
      ctx.font = node.type === 'memory' ? '10px Inter' : '9px Inter';
      ctx.fillStyle = isSelected ? '#f1f5f9' : '#94a3b8';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + radius + 12);
    });
  }, [viewMode, graphData, selectedGraphNode]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleAdd = async () => {
    if (!content.trim()) return;
    const tagList = tags.split(',').map((t) => t.trim()).filter(Boolean);
    addMemory({ content: content.trim(), tags: tagList, source, pinned: false });
    setContent('');
    setTags('');
    setShowForm(false);
    addToast({ type: 'success', message: 'Memory saved to galaxy + Obsidian vault' });

    // Sync to vault via API
    try {
      await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, source, type: 'fact', tags: tagList }),
      });
    } catch {
      // Will sync next time
    }
  };

  const togglePin = (mem: Memory) => {
    updateMemory(mem.id, { pinned: !mem.pinned });
  };

  const handleDelete = async (id: string) => {
    deleteMemory(id);
    addToast({ type: 'info', message: 'Memory deleted' });
    try {
      await fetch(`/api/memory?id=${id}`, { method: 'DELETE' });
    } catch { /* ok */ }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10 flex bg-[var(--bg)]">
      {/* Sidebar — filters */}
      <div className="w-64 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Brain className="w-4 h-4 text-[var(--accent)]" />
            Memory Galaxy
          </h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex border-b border-[var(--border)]">
          {(['list', 'graph', 'cognee', 'wiki'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex-1 py-2 text-[10px] font-medium uppercase tracking-wider transition-colors ${
                viewMode === mode
                  ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {mode === 'graph' ? <Network className="w-3 h-3 mx-auto mb-0.5" /> : null}
              {mode}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="p-3 border-b border-[var(--border)]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..."
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>
        </div>

        {/* Filters toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between px-4 py-2 text-xs text-[var(--text-muted)] hover:text-[var(--text)] border-b border-[var(--border)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5" />
            Filters
          </span>
          {showFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showFilters && (
          <div className="p-3 border-b border-[var(--border)] space-y-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">Tag</label>
              <select
                value={filterTag || ''}
                onChange={(e) => setFilterTag(e.target.value || null)}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="">All tags</option>
                {allTags.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-1 block">Source</label>
              <select
                value={filterSource || ''}
                onChange={(e) => setFilterSource(e.target.value || null)}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="">All sources</option>
                {allSources.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            {(filterTag || filterSource) && (
              <button
                onClick={() => { setFilterTag(null); setFilterSource(null); }}
                className="text-[10px] text-[var(--accent)] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Vault sync button */}
        <div className="p-3 border-b border-[var(--border)]">
          <button
            onClick={loadGraph}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingGraph ? 'animate-spin' : ''}`} />
            Sync from Vault
          </button>
          {vaultMemories.length > 0 && (
            <p className="text-[10px] text-[var(--text-muted)] mt-1 text-center">
              {vaultMemories.length} files in Obsidian
            </p>
          )}
        </div>

        {/* Stats */}
        <div className="mt-auto px-4 py-3 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
          {filtered.length} memory{filtered.length !== 1 ? 'ies' : ''} · {allTags.length} tags · {allSources.length} sources
          {graphData && ` · ${graphData.nodes.length} graph nodes`}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-6 py-3 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-medium text-[var(--text)]">
            {viewMode === 'list' && (searchQuery ? `Results for "${searchQuery}"` : 'All Memories')}
            {viewMode === 'graph' && 'Memory Graph'}
            {viewMode === 'cognee' && 'Cognee Knowledge Graph'}
            {viewMode === 'wiki' && 'Wiki — Search & Maintenance'}
          </h3>
          <div className="flex items-center gap-2">
            {viewMode === 'graph' && (
              <button
                onClick={loadGraph}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Memory
            </button>
          </div>
        </div>

        {/* Add form */}
        {showForm && (
          <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What should the agents remember?"
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
              autoFocus
            />
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Tags (comma-separated)"
                className="flex-1 px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="steve">Steve</option>
                <option value="david">David</option>
                <option value="josh">Josh</option>
                <option value="fathom">Fathom</option>
                <option value="system">System</option>
              </select>
              <button
                onClick={handleAdd}
                disabled={!content.trim()}
                className="px-4 py-1.5 text-xs rounded bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
              >
                Cancel
              </button>
            </div>
            <p className="text-[10px] text-[var(--text-muted)]">
              <Link2 className="w-3 h-3 inline mr-1" />
              Auto-saved to Obsidian vault → cognified into knowledge graph
            </p>
          </div>
        )}

        {/* Content area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'list' && (
            <div className="h-full overflow-y-auto p-6 space-y-3">
              {filtered.length === 0 ? (
                <div className="text-center py-12">
                  <Sparkles className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-20 mb-3" />
                  <p className="text-sm text-[var(--text-muted)]">
                    {searchQuery ? 'No memories match your search' : 'No memories yet. Add one to start building the knowledge base.'}
                  </p>
                </div>
              ) : (
                filtered.map((mem) => (
                  <MemoryCard
                    key={mem.id}
                    memory={mem}
                    expanded={expandedId === mem.id}
                    onToggle={() => setExpandedId(expandedId === mem.id ? null : mem.id)}
                    onPin={() => togglePin(mem)}
                    onDelete={() => handleDelete(mem.id)}
                    onSlide={() => handleSlide(mem.id)}
                    isSliding={slidingId === mem.id}
                  />
                ))
              )}
            </div>
          )}

          {viewMode === 'graph' && (
            <div className="h-full relative">
              {isLoadingGraph ? (
                <div className="flex items-center justify-center h-full">
                  <RefreshCw className="w-8 h-8 text-[var(--accent)] animate-spin" />
                </div>
              ) : graphData && graphData.nodes.length > 0 ? (
                <>
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                    onClick={(e) => {
                      const rect = canvasRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      const clicked = graphData.nodes.find(
                        n => Math.hypot(n.x - x, n.y - y) < 15
                      );
                      setSelectedGraphNode(clicked?.id || null);
                    }}
                  />
                  {selectedGraphNode && (
                    <div className="absolute bottom-4 left-4 right-4 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                      {(() => {
                        const node = graphData.nodes.find(n => n.id === selectedGraphNode);
                        if (!node) return null;
                        const connectedEdges = graphData.edges.filter(
                          e => e.source === node.id || e.target === node.id
                        );
                        const connectedNodes = connectedEdges.map(e => {
                          const otherId = e.source === node.id ? e.target : e.source;
                          return graphData.nodes.find(n => n.id === otherId);
                        }).filter(Boolean);
                        return (
                          <div>
                            <p className="text-sm text-[var(--text)] font-medium">{node.label}</p>
                            <p className="text-[10px] text-[var(--text-muted)] mt-1">
                              {connectedNodes.length} connections · Type: {node.type}
                            </p>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {connectedNodes.slice(0, 8).map(n => (
                                <span key={n!.id} className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                                  {n!.label}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b5cf6]" /> Memory</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#f59e0b]" /> Tag</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3b82f6]" /> Source</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Network className="w-12 h-12 text-[var(--text-muted)] opacity-20 mb-3" />
                  <p className="text-sm text-[var(--text-muted)] mb-2">No graph data yet</p>
                  <button
                    onClick={loadGraph}
                    className="px-4 py-2 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
                  >
                    Load from Obsidian Vault
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'wiki' && (
            <div className="h-full overflow-y-auto p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Wiki Search */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-[var(--accent)]" />
                    Wiki Search
                  </h3>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
                      <input
                        type="text"
                        value={wikiQuery}
                        onChange={(e) => setWikiQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleWikiSearch()}
                        placeholder="Search across 1,200+ wiki pages..."
                        className="w-full pl-7 pr-3 py-2 text-sm rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>
                    <button
                      onClick={handleWikiSearch}
                      disabled={wikiSearching || wikiQuery.length < 2}
                      className="px-4 py-2 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
                    >
                      {wikiSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Search'}
                    </button>
                  </div>
                  {wikiResults.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-[10px] text-[var(--text-muted)]">{wikiResults.length} results</p>
                      {wikiResults.map((r) => (
                        <div key={r.id} className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-3 h-3 text-[var(--accent)]" />
                            <span className="text-sm font-medium text-[var(--text)]">{r.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                              {r.type}
                            </span>
                            {r.score > 5 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                                ★ {r.score}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[var(--text-muted)] mb-1">{r.relativePath}</p>
                          <p className="text-xs text-[var(--text)] line-clamp-2">{r.snippet}</p>
                          {r.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {r.tags.slice(0, 5).map((tag) => (
                                <span key={tag} className="text-[9px] px-1 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Health Check */}
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-3">
                    <Heart className="w-4 h-4 text-[#ec4899]" />
                    Health Check
                  </h3>
                  <button
                    onClick={handleLintRun}
                    disabled={lintRunning}
                    className="px-4 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 transition-colors"
                  >
                    {lintRunning ? <><RefreshCw className="w-3.5 h-3.5 animate-spin inline mr-1" /> Running...</> : 'Run Health Check'}
                  </button>
                  {lintSummary && (
                    <div className="mt-3 grid grid-cols-4 gap-3">
                      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                        <p className="text-lg font-bold text-[var(--text)]">{lintSummary.totalFiles}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Files</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                        <p className="text-lg font-bold text-[var(--error)]">{lintSummary.errors}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Errors</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                        <p className="text-lg font-bold text-[#f59e0b]">{lintSummary.warnings}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Warnings</p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-center">
                        <p className="text-lg font-bold text-[var(--accent)]">{lintSummary.info}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">Info</p>
                      </div>
                    </div>
                  )}
                  {lintSummary && lintSummary.byCheck && Object.keys(lintSummary.byCheck).length > 0 && (
                    <div className="mt-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2">Issues by Category</p>
                      <div className="space-y-1">
                        {Object.entries(lintSummary.byCheck).sort(([,a],[,b]) => b - a).map(([check, count]) => (
                          <div key={check} className="flex items-center justify-between text-xs">
                            <span className="text-[var(--text)]">{check}</span>
                            <span className="text-[var(--text-muted)]">{count}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact & File to Wiki */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-3">
                      <Zap className="w-4 h-4 text-[#10b981]" />
                      Compact
                    </h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCompact(false)}
                        disabled={compactRunning}
                        className="w-full px-4 py-2 text-xs rounded-lg border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-tertiary)] disabled:opacity-50 transition-colors"
                      >
                        {compactRunning ? 'Running...' : 'Dry Run (Preview)'}
                      </button>
                      <button
                        onClick={() => handleCompact(true)}
                        disabled={compactRunning}
                        className="w-full px-4 py-2 text-xs rounded-lg bg-[#10b981] text-white hover:opacity-80 disabled:opacity-50 transition-colors"
                      >
                        Apply Compaction
                      </button>
                      <p className="text-[10px] text-[var(--text-muted)]">
                        Merge overlapping pages, rebuild index, prune orphans
                      </p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2 mb-3">
                      <FileDown className="w-4 h-4 text-[#3b82f6]" />
                      File to Wiki
                    </h3>
                    {!showFileForm ? (
                      <button
                        onClick={() => setShowFileForm(true)}
                        className="px-4 py-2 text-xs rounded-lg bg-[#3b82f6] text-white hover:opacity-80 transition-colors"
                      >
                        New Entry
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={fileToWikiTitle}
                          onChange={(e) => setFileToWikiTitle(e.target.value)}
                          placeholder="Title"
                          className="w-full px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none"
                        />
                        <textarea
                          value={fileToWikiContent}
                          onChange={(e) => setFileToWikiContent(e.target.value)}
                          placeholder="Content to file into wiki..."
                          rows={3}
                          className="w-full px-3 py-1.5 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <select
                            value={fileToWikiCategory}
                            onChange={(e) => setFileToWikiCategory(e.target.value)}
                            className="px-2 py-1 text-xs rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
                          >
                            <option value="robbi">Robbi</option>
                            <option value="mcf">MCF</option>
                            <option value="fathom">Fathom</option>
                            <option value="consulting">Consulting</option>
                            <option value="shared">Shared</option>
                            <option value="concepts">Concepts</option>
                          </select>
                          <button
                            onClick={handleFileToWiki}
                            disabled={!fileToWikiContent.trim()}
                            className="px-3 py-1 text-xs rounded bg-[#3b82f6] text-white hover:opacity-80 disabled:opacity-30"
                          >
                            File
                          </button>
                          <button
                            onClick={() => setShowFileForm(false)}
                            className="px-3 py-1 text-xs rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'cognee' && (
            <CogneeGraphPanel />
          )}
        </div>
      </div>

      {/* Slide Preview Modal */}
      {slideUrl && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="relative w-[90%] h-[85%] rounded-xl overflow-hidden bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
              <span className="text-sm font-medium text-gray-700">🎬 Slide Preview</span>
              <div className="flex items-center gap-2">
                <a
                  href={slideUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-xs rounded bg-[var(--accent)] text-white hover:opacity-80 transition-opacity"
                >
                  Open Fullscreen
                </a>
                <button
                  onClick={() => setSlideUrl(null)}
                  className="px-3 py-1 text-xs rounded bg-gray-200 text-gray-600 hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={slideUrl}
              className="flex-1 w-full border-0"
              title="Slide Preview"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Memory Card ────────────────────────────────────────────────────────────

function MemoryCard({
  memory,
  expanded,
  onToggle,
  onPin,
  onDelete,
  onSlide,
  isSliding,
}: {
  memory: Memory;
  expanded: boolean;
  onToggle: () => void;
  onPin: () => void;
  onDelete: () => void;
  onSlide: () => void;
  isSliding: boolean;
}) {
  return (
    <div className={`rounded-lg border ${memory.pinned ? 'border-[var(--accent)]' : 'border-[var(--border)]'} bg-[var(--bg-secondary)] overflow-hidden`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-[var(--bg-tertiary)] transition-colors"
      >
        <Brain className={`w-4 h-4 mt-0.5 flex-shrink-0 ${memory.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm text-[var(--text)] ${expanded ? '' : 'line-clamp-2'}`}>
            {memory.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              {memory.source}
            </span>
            {memory.tags.map((tag) => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {tag}
              </span>
            ))}
            <span className="text-[10px] text-[var(--text-muted)] ml-auto">
              {new Date(memory.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
      </button>
      {expanded && (
        <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-end gap-2">
          <button
            onClick={onSlide}
            disabled={isSliding}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[#f59e0b] transition-colors disabled:opacity-50"
            title="Generate slide deck from this memory"
          >
            {isSliding ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span className="text-sm">🎬</span>}
          </button>
          <button
            onClick={onPin}
            className={`p-1.5 rounded hover:bg-[var(--bg-tertiary)] transition-colors ${memory.pinned ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}
            title={memory.pinned ? 'Unpin' : 'Pin'}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Cognee Graph Panel ─────────────────────────────────────────────────────

function CogneeGraphPanel() {
  const [stats, setStats] = useState<{ nodes: number; edges: number; data: number; memories: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    try {
      // Query cognee_db directly via API
      const res = await fetch('/api/memory/stats');
      const data = await res.json();
      if (data.success) {
        setStats(data);
      }
    } catch {
      // Stats not available
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <Eye className="w-10 h-10 mx-auto text-[var(--accent)] opacity-40 mb-2" />
          <h3 className="text-lg font-semibold text-[var(--text)]">Cognee Knowledge Graph</h3>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Unified view: Obsidian memories + codebase structure + business context
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-6 h-6 text-[var(--accent)] animate-spin mx-auto" />
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[var(--accent)]">{stats.nodes}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Graph Nodes</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[#10b981]">{stats.edges}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Relationships</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[#3b82f6]">{stats.data}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Data Items</p>
            </div>
            <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-2xl font-bold text-[#f59e0b]">{stats.memories}</p>
              <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">Vault Files</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--text-muted)]">Stats unavailable. Run cognify first.</p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <h4 className="text-sm font-medium text-[var(--text)] mb-2">Pipeline</h4>
          <div className="space-y-2 text-xs text-[var(--text-muted)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#10b981]" />
              Overlord agents create memories → auto-saved to Obsidian vault
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
              Cognee cognifies vault files → extracts entities + relationships
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
              Graph nodes = entities (people, companies, concepts, decisions)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#f59e0b]" />
              Graph edges = relationships (works-at, decided-on, tagged-with)
            </div>
          </div>
        </div>

        <button
          onClick={loadStats}
          className="w-full py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
        >
          Refresh Stats
        </button>
      </div>
    </div>
  );
}
