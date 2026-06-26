'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useLoopStore, type LoopTask } from '@/stores/loopStore';
import {
  LOOP_PATTERNS,
  getPatternsByLane,
  getPatternsByReadiness,
  getPatternsByRisk,
  estimateMonthlyCost,
  getReadinessScore,
  getLaneLabel,
  getAllLanes,
  type LoopPattern,
  type BusinessLane,
  type ReadinessLevel,
  type RiskLevel,
} from '@/lib/loop-patterns';
import { useUIStore } from '@/stores/uiStore';
import {
  Layers, Play, Clock, DollarSign, Shield, AlertTriangle,
  CheckCircle2, XCircle, Zap, ChevronRight, Search,
  Sparkles, Activity, Target, Eye, EyeOff, X
} from 'lucide-react';

interface PatternGalleryProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PatternGallery({ isOpen, onClose }: PatternGalleryProps) {
  const createLoopFromPattern = useLoopStore((s) => s.createLoopFromPattern);
  const loops = useLoopStore((s) => s.loops);
  const addToast = useUIStore((s) => s.addToast);

  const [selectedLane, setSelectedLane] = useState<BusinessLane | 'all'>('all');
  const [selectedReadiness, setSelectedReadiness] = useState<ReadinessLevel | 'all'>('all');
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPatternId, setExpandedPatternId] = useState<string | null>(null);
  const [showCostProjection, setShowCostProjection] = useState(false);

  const filteredPatterns = useMemo(() => {
    let patterns = LOOP_PATTERNS;

    if (selectedLane !== 'all') {
      patterns = patterns.filter(p => p.lane === selectedLane || p.lane === 'shared');
    }
    if (selectedReadiness !== 'all') {
      patterns = getPatternsByReadiness(selectedReadiness);
    }
    if (selectedRisk !== 'all') {
      patterns = patterns.filter(p => p.riskLevel === selectedRisk);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      patterns = patterns.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q))
      );
    }

    return patterns;
  }, [selectedLane, selectedReadiness, selectedRisk, searchQuery]);

  const totalMonthlyCost = useMemo(() => {
    if (!showCostProjection) return 0;
    return filteredPatterns.reduce((sum, p) => sum + estimateMonthlyCost(p), 0);
  }, [filteredPatterns, showCostProjection]);

  const activePatternIds = useMemo(() => {
    return new Set(loops.filter(l => l.patternId).map(l => l.patternId));
  }, [loops]);

  const handleInstantiate = useCallback((pattern: LoopPattern) => {
    const id = createLoopFromPattern(pattern);
    addToast({
      type: 'success',
      message: `Loop "${pattern.name}" instantiated from template`,
      duration: 3000,
    });
    setExpandedPatternId(id);
  }, [createLoopFromPattern, addToast]);

  const getReadinessBadge = (level: ReadinessLevel) => {
    switch (level) {
      case 'L1': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-blue-500/10 text-blue-400 font-medium">L1 Report</span>;
      case 'L2': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-400 font-medium">L2 Assisted</span>;
      case 'L3': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/10 text-green-400 font-medium">L3 Unattended</span>;
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'low': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/10 text-green-400 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Low</span>;
      case 'medium': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-yellow-500/10 text-yellow-400 flex items-center gap-0.5"><AlertTriangle className="w-2.5 h-2.5" /> Med</span>;
      case 'high': return <span className="px-1.5 py-0.5 text-[10px] rounded bg-red-500/10 text-red-400 flex items-center gap-0.5"><XCircle className="w-2.5 h-2.5" /> High</span>;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-10 flex bg-[var(--bg)]">
      {/* Left panel — Pattern library */}
      <div className="w-96 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[var(--border)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--accent)]" />
              Pattern Templates
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)]">
                {filteredPatterns.length}
              </span>
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowCostProjection(!showCostProjection)}
                className={`p-1 rounded transition-colors ${showCostProjection ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'}`}
                title="Show cost projection"
              >
                <DollarSign className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patterns..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-1 flex-wrap">
            <select
              value={selectedLane}
              onChange={(e) => setSelectedLane(e.target.value as BusinessLane | 'all')}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text)] focus:outline-none"
            >
              <option value="all">All Lanes</option>
              {getAllLanes().map(lane => (
                <option key={lane} value={lane}>{getLaneLabel(lane)}</option>
              ))}
            </select>
            <select
              value={selectedReadiness}
              onChange={(e) => setSelectedReadiness(e.target.value as ReadinessLevel | 'all')}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text)] focus:outline-none"
            >
              <option value="all">All Levels</option>
              <option value="L1">L1 Report</option>
              <option value="L2">L2 Assisted</option>
              <option value="L3">L3 Unattended</option>
            </select>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value as RiskLevel | 'all')}
              className="bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[10px] text-[var(--text)] focus:outline-none"
            >
              <option value="all">All Risk</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        {/* Pattern list */}
        <div className="flex-1 overflow-y-auto">
          {filteredPatterns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] p-6">
              <Layers className="w-10 h-10 mb-3 opacity-20" />
              <p className="text-sm">No patterns match filters</p>
            </div>
          ) : (
            filteredPatterns.map((pattern) => {
              const isExpanded = expandedPatternId === pattern.id;
              const isInstantiated = activePatternIds.has(pattern.id);
              const score = getReadinessScore(pattern);
              const monthlyCost = estimateMonthlyCost(pattern);

              return (
                <div
                  key={pattern.id}
                  className={`border-b border-[var(--border)] transition-colors ${isExpanded ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'}`}
                >
                  <div
                    className="px-4 py-3 cursor-pointer"
                    onClick={() => setExpandedPatternId(isExpanded ? null : pattern.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-xs font-medium text-[var(--text)] truncate">{pattern.name}</span>
                          {isInstantiated && (
                            <CheckCircle2 className="w-3 h-3 text-[var(--success)] flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-[var(--text-muted)] line-clamp-2">{pattern.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {getReadinessBadge(pattern.readinessLevel)}
                          {getRiskBadge(pattern.riskLevel)}
                          <span className="text-[10px] text-[var(--text-muted)] flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {pattern.cadence}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-[var(--text-muted)] flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)] pt-3">
                      {/* Meta */}
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="bg-[var(--bg)] rounded p-2">
                          <span className="text-[var(--text-muted)]">Lane</span>
                          <p className="text-[var(--text)] font-medium mt-0.5">{getLaneLabel(pattern.lane)}</p>
                        </div>
                        <div className="bg-[var(--bg)] rounded p-2">
                          <span className="text-[var(--text-muted)]">Readiness Score</span>
                          <p className="text-[var(--text)] font-medium mt-0.5">{score}/100</p>
                        </div>
                        <div className="bg-[var(--bg)] rounded p-2">
                          <span className="text-[var(--text-muted)]">Tokens/iter</span>
                          <p className="text-[var(--text)] font-medium mt-0.5">{pattern.estimatedTokensPerIteration.toLocaleString()}</p>
                        </div>
                        <div className="bg-[var(--bg)] rounded p-2">
                          <span className="text-[var(--text-muted)]">Est. Monthly Cost</span>
                          <p className="text-[var(--text)] font-medium mt-0.5">${monthlyCost.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Requirements */}
                      <div className="flex gap-2 text-[10px]">
                        {pattern.requiresSubAgents && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> Sub-agents
                          </span>
                        )}
                        {pattern.requiresMCP && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 flex items-center gap-0.5">
                            <Activity className="w-2.5 h-2.5" /> MCP
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] flex items-center gap-0.5">
                          <Target className="w-2.5 h-2.5" /> Gate: {pattern.humanGateOn}
                        </span>
                      </div>

                      {/* Prompt preview */}
                      <div className="bg-[var(--bg)] rounded p-2">
                        <span className="text-[10px] text-[var(--text-muted)] block mb-1">Prompt Preview</span>
                        <pre className="text-[10px] text-[var(--text-secondary)] font-mono whitespace-pre-wrap line-clamp-4">{pattern.prompt}</pre>
                      </div>

                      {/* Tags */}
                      <div className="flex gap-1 flex-wrap">
                        {pattern.tags.map(tag => (
                          <span key={tag} className="px-1.5 py-0.5 text-[9px] rounded bg-[var(--border)] text-[var(--text-muted)]">
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Action */}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleInstantiate(pattern); }}
                        className="w-full px-3 py-2 text-xs bg-[var(--accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {isInstantiated ? 'Instantiate Again' : 'Instantiate from Template'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Cost projection footer */}
        {showCostProjection && (
          <div className="px-4 py-3 border-t border-[var(--border)] bg-[var(--bg)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-muted)]">Projected monthly cost ({filteredPatterns.length} patterns)</span>
              <span className="text-sm font-bold text-[var(--accent)]">${totalMonthlyCost.toFixed(2)}/mo</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-1">
              Based on cadence × tokens × $0.01/1k tokens. Actual cost varies by model.
            </p>
          </div>
        )}
      </div>

      {/* Right panel — Quick start or empty */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
          <div className="text-center space-y-4 max-w-md px-8">
            <Layers className="w-16 h-16 mx-auto opacity-10" />
            <h3 className="text-lg font-semibold text-[var(--text)]">Loop Pattern Templates</h3>
            <p className="text-sm text-[var(--text-muted)]">
              Pre-built loop configurations based on the Loop Engineering framework.
              Instantiate a template to get a ready-to-run loop with prompts, cost estimates, and readiness scoring.
            </p>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text)] mb-1">🎯 By Lane</p>
                <p className="text-[10px] text-[var(--text-muted)]">Filter patterns for David, Josh, Steve, Fathom, or shared infrastructure</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text)] mb-1">📊 Readiness</p>
                <p className="text-[10px] text-[var(--text-muted)]">L1 = report only, L2 = assisted fixes, L3 = fully unattended</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text)] mb-1">💰 Cost Control</p>
                <p className="text-[10px] text-[var(--text-muted)]">Toggle dollar icon to see monthly cost projections per pattern</p>
              </div>
              <div className="bg-[var(--bg-secondary)] rounded-lg p-3 border border-[var(--border)]">
                <p className="text-xs font-medium text-[var(--text)] mb-1">⚡ Instant Run</p>
                <p className="text-[10px] text-[var(--text-muted)]">One-click to create a loop from any template — prompt, cadence, scoring all pre-filled</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
