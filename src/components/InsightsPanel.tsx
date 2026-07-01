'use client';

import React, { useState, useMemo } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { Zap, Target, TrendingDown, Lightbulb, ArrowRight, AlertCircle } from 'lucide-react';

// Types based on IMPLEMENTATION_PLAN_CLUSTER_B.md
interface SystemBottleneck {
  metric: 'verbosity' | 'latency' | 'retries' | 'hallucinations' | 'context';
  score: number;
  trend: 'improving' | 'stable' | 'degrading';
}

interface InsightCard {
  id: string;
  title: string;
  category: 'cost' | 'performance' | 'quality';
  description: string;
  impact: string;
  actionable: boolean;
}

interface PromptOptimization {
  original: string;
  suggested: string;
  reasoning: string;
  expectedGain: string;
}

// Mock Data
const generateMockBottlenecks = (): SystemBottleneck[] => [
  { metric: 'verbosity', score: 72, trend: 'degrading' },
  { metric: 'latency', score: 45, trend: 'stable' },
  { metric: 'retries', score: 30, trend: 'improving' },
  { metric: 'hallucinations', score: 12, trend: 'stable' },
  { metric: 'context', score: 58, trend: 'degrading' },
];

const generateMockInsights = (): InsightCard[] => [
  {
    id: 'ins-1',
    title: 'Redundant Tool Calls',
    category: 'performance',
    description: 'Agents are repeatedly calling "get_user_profile" within the same turn.',
    impact: 'Saving $12/day & -200ms latency',
    actionable: true,
  },
  {
    id: 'ins-2',
    title: 'Prompt Verbosity Leak',
    category: 'cost',
    description: 'System prompts for "Researcher" agent contain 200+ tokens of redundant instructions.',
    impact: 'Reducing token burn by 15%',
    actionable: true,
  },
  {
    id: 'ins-3',
    title: 'Hallucination Pattern',
    category: 'quality',
    description: 'Frequent failure in "Fact-Check" tool when processing legal PDFs.',
    impact: 'Improving reliability by 20%',
    actionable: false,
  },
];

const generateMockOptimizations = (): PromptOptimization[] => [
  {
    original: 'Please provide a detailed and comprehensive analysis of the following text, making sure to include all possible points...',
    suggested: 'Analyze the following text concisely. Extract key points and evidence only.',
    reasoning: 'Excessive politeness and phrasing increase input tokens without adding semantic value.',
    expectedGain: 'Reduce Latency by 15%',
  },
  {
    original: 'You are an expert researcher. Your goal is to find information...',
    suggested: 'Expert Researcher: Synthesize evidence from sources. Prioritize primary data.',
    reasoning: 'Direct role-setting reduces steering drift in long contexts.',
    expectedGain: 'Improve Accuracy by 10%',
  },
];

export default function InsightsPanel() {
  const bottlenecks = useMemo(() => generateMockBottlenecks(), []);
  const insights = useMemo(() => generateMockInsights(), []);
  const optimizations = useMemo(() => generateMockOptimizations(), []);

  return (
    <div className="flex flex-col h-full gap-4 p-4 bg-transparent overflow-y-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bottleneck Radar (Simulated as a Gauge List) */}
        <PanelWrapper title="Bottleneck Radar">
          <div className="space-y-4">
            {bottlenecks.map((b) => (
              <div key={b.metric} className="flex items-center gap-4">
                <span className="text-xs text-slate-400 w-24 capitalize">{b.metric}</span>
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full transition-all duration-1000 ${b.score > 60 ? 'bg-red-500' : b.score > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${b.score}%` }} 
                  />
                </div>
                <div className="flex items-center gap-2 w-20 justify-end">
                  <span className="text-xs font-mono text-slate-300">{b.score}</span>
                  <span className={`text-[10px] ${b.trend === 'improving' ? 'text-green-400' : b.trend === 'degrading' ? 'text-red-400' : 'text-slate-500'}`}>
                    {b.trend === 'improving' ? '↑' : b.trend === 'degrading' ? '↓' : '→'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>

        {/* Agent Efficiency Matrix (2x2 Simplified) */}
        <PanelWrapper title="Efficiency Matrix (Cost vs Performance)">
          <div className="grid grid-cols-2 grid-rows-2 gap-2 h-48">
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-2 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-green-500 font-bold uppercase mb-1">High Perf / Low Cost</span>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="px-1.5 py-0.5 bg-green-500/20 text-green-300 text-[10px] rounded border border-green-500/30">Sentinel-01</span>
              </div>
            </div>
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-yellow-500 font-bold uppercase mb-1">High Perf / High Cost</span>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-300 text-[10px] rounded border border-yellow-500/30">Researcher-Prime</span>
              </div>
            </div>
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-2 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-red-500 font-bold uppercase mb-1">Low Perf / Low Cost</span>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="px-1.5 py-0.5 bg-red-500/20 text-red-300 text-[10px] rounded border border-red-500/30">Tuner-01</span>
              </div>
            </div>
            <div className="bg-slate-500/5 border border-slate-500/20 rounded-lg p-2 flex flex-col justify-center items-center text-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase mb-1">Low Perf / High Cost</span>
              <div className="flex flex-wrap gap-1 justify-center">
                <span className="px-1.5 py-0.5 bg-slate-500/20 text-slate-300 text-[10px] rounded border border-slate-500/30">Legacy-Proxy</span>
              </div>
            </div>
          </div>
        </PanelWrapper>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pattern Detection Feed */}
        <PanelWrapper title="Intelligence Feed">
          <div className="space-y-3">
            {insights.map((ins) => (
              <div key={ins.id} className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 group hover:border-indigo-500/50 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      ins.category === 'cost' ? 'bg-yellow-500' : ins.category === 'performance' ? 'bg-blue-500' : 'bg-purple-500'
                    }`} />
                    <span className="text-xs font-semibold text-slate-200">{ins.title}</span>
                  </div>
                  {ins.actionable && (
                    <button className="text-[10px] px-2 py-0.5 bg-indigo-600 text-white rounded hover:bg-indigo-500 transition-colors">
                      Optimize Now
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-2">{ins.description}</p>
                <div className="flex items-center gap-1 text-[10px] text-green-400 font-medium">
                  <TrendingDown className="w-3 h-3" /> {ins.impact}
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>

        {/* Heuristic Table */}
        <PanelWrapper title="Prompt Optimizations">
          <div className="space-y-4">
            {optimizations.map((opt, i) => (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block mb-1">Original</span>
                    <p className="text-xs text-slate-400 line-clamp-2 italic">{opt.original}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-indigo-400 uppercase block mb-1">Suggested</span>
                    <p className="text-xs text-slate-200 font-medium">{opt.suggested}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-[10px] text-slate-500">{opt.reasoning}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                    {opt.expectedGain}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
