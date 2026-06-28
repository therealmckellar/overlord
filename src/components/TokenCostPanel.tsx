'use client';

import { useState, useEffect, useCallback } from 'react';
import { DollarSign, TrendingUp, Cpu, AlertTriangle, Download, ChevronDown, ChevronUp, Lightbulb, BarChart3, Zap } from 'lucide-react';

interface ModelCost {
  model: string;
  tokens: number;
  cost: number;
  requests: number;
}

interface AgentCost {
  agent: string;
  tokens: number;
  cost: number;
}

interface DailyTrend {
  day: string;
  tokens: number;
  cost: number;
}

interface Suggestion {
  title: string;
  savings: string;
  detail: string;
  priority: 'info' | 'warning' | 'success';
}

interface TokenData {
  totalTokens: number;
  totalCost: number;
  totalRequests: number;
  modelBreakdown: ModelCost[];
  agentBreakdown: AgentCost[];
  dailyTrend: DailyTrend[];
  suggestions: Suggestion[];
  budgetUsed: number;
  budgetLimit: number;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}

function formatCost(n: number): string {
  if (n === 0) return 'FREE';
  return `$${n.toFixed(3)}`;
}

export function TokenCostPanel() {
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModel, setExpandedModel] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d'>('7d');

  const loadData = useCallback(async () => {
    try {
      const res = await fetch('/api/tokens');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently fail — stats are non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60_000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadData]);

  const exportCSV = useCallback(() => {
    if (!data) return;
    const rows = [
      ['Model', 'Tokens', 'Cost', 'Requests'],
      ...data.modelBreakdown.map((m) => [m.model, m.tokens.toString(), m.cost.toString(), m.requests.toString()]),
      [],
      ['Agent', 'Tokens', 'Cost'],
      ...data.agentBreakdown.map((a) => [a.agent, a.tokens.toString(), a.cost.toString()]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `token-costs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 p-6">
        <div className="w-8 h-8 rounded-lg bg-[var(--accent)] animate-pulse" />
        <p className="text-xs text-[var(--text-muted)]">Loading cost data...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-6">
        <AlertTriangle className="w-6 h-6 text-[var(--warning)]" />
        <p className="text-sm text-[var(--text-secondary)]">Cost data unavailable</p>
        <button onClick={loadData} className="text-xs text-[var(--accent)] hover:underline">Retry</button>
      </div>
    );
  }

  const budgetPercent = (data.budgetUsed / data.budgetLimit) * 100;
  const maxModelTokens = Math.max(...data.modelBreakdown.map((m) => m.tokens));
  const maxDailyTokens = Math.max(...data.dailyTrend.map((d) => d.tokens));

  return (
    <div className="flex flex-col h-full overflow-y-auto p-4 gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-base font-semibold">Token Cost Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--bg-tertiary)] hover:bg-[var(--border)] transition-colors"
            title="Export CSV"
          >
            <Download className="w-3 h-3" />
            CSV
          </button>
          <div className="flex rounded-md overflow-hidden border border-[var(--border)]">
            <button
              onClick={() => setTimeRange('7d')}
              className={`px-2 py-1 text-xs transition-colors ${timeRange === '7d' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'}`}
            >
              7d
            </button>
            <button
              onClick={() => setTimeRange('30d')}
              className={`px-2 py-1 text-xs transition-colors ${timeRange === '30d' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-tertiary)] hover:bg-[var(--border)]'}`}
            >
              30d
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">Total Cost</p>
          <p className="text-lg font-bold text-[var(--accent)]">{formatCost(data.totalCost)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">Total Tokens</p>
          <p className="text-lg font-bold">{formatTokens(data.totalTokens)}</p>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">Requests</p>
          <p className="text-lg font-bold">{data.totalRequests}</p>
        </div>
        <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">Avg Cost/Req</p>
          <p className="text-lg font-bold">{data.totalRequests > 0 ? `$${(data.totalCost / data.totalRequests).toFixed(4)}` : 'FREE'}</p>
        </div>
      </div>

      {/* Budget Bar */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Budget
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            ${data.budgetUsed.toFixed(2)} / ${data.budgetLimit}/mo
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${budgetPercent > 80 ? 'bg-[var(--error)]' : budgetPercent > 50 ? 'bg-[var(--warning)]' : 'bg-[var(--success)]'}`}
            style={{ width: `${Math.min(budgetPercent, 100)}%` }}
          />
        </div>
        <p className="text-xs text-[var(--text-muted)] mt-1">{budgetPercent.toFixed(1)}% used this month</p>
      </div>

      {/* Daily Trend Chart */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <BarChart3 className="w-4 h-4 text-[var(--accent)]" /> Daily Trend
        </h3>
        <div className="flex items-end gap-1 h-24">
          {data.dailyTrend.map((d) => (
            <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full rounded-t-sm bg-[var(--accent)] opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                style={{ height: `${(d.tokens / maxDailyTokens) * 100}%` }}
                title={`${d.day}: ${formatTokens(d.tokens)} tokens, ${formatCost(d.cost)}`}
              />
              <span className="text-[10px] text-[var(--text-muted)]">{d.day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Model Breakdown */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <Cpu className="w-4 h-4 text-[var(--accent)]" /> Model Breakdown
        </h3>
        <div className="space-y-2">
          {data.modelBreakdown
            .sort((a, b) => b.tokens - a.tokens)
            .map((m) => (
              <div key={m.model}>
                <button
                  onClick={() => setExpandedModel(expandedModel === m.model ? null : m.model)}
                  className="w-full flex items-center gap-2 p-1.5 rounded-md hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium truncate max-w-[180px]">{m.model.split('/').pop()}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[var(--text-muted)]">{formatTokens(m.tokens)}</span>
                        <span className={`text-xs font-medium ${m.cost === 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                          {formatCost(m.cost)}
                        </span>
                        {expandedModel === m.model ? (
                          <ChevronUp className="w-3 h-3 text-[var(--text-muted)]" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[var(--accent)]"
                        style={{ width: `${(m.tokens / maxModelTokens) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>
                {expandedModel === m.model && (
                  <div className="pl-3 pb-2 text-xs text-[var(--text-muted)] space-y-1">
                    <p>Full: {m.model}</p>
                    <p>Requests: {m.requests}</p>
                    <p>Tokens/Request: {formatTokens(Math.round(m.tokens / m.requests))}</p>
                    <p>Cost per 1M tokens: {m.tokens > 0 ? `$${((m.cost / m.tokens) * 1_000_000).toFixed(2)}` : 'FREE'}</p>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Agent Breakdown */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <Zap className="w-4 h-4 text-[var(--accent)]" /> Cost by Agent
        </h3>
        <div className="space-y-1.5">
          {data.agentBreakdown
            .sort((a, b) => b.tokens - a.tokens)
            .map((a) => (
              <div key={a.agent} className="flex items-center justify-between p-1.5 rounded-md hover:bg-[var(--bg-tertiary)]">
                <span className="text-xs truncate max-w-[200px]">{a.agent}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-muted)]">{formatTokens(a.tokens)}</span>
                  <span className={`text-xs font-medium ${a.cost === 0 ? 'text-[var(--success)]' : 'text-[var(--warning)]'}`}>
                    {formatCost(a.cost)}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Optimization Suggestions */}
      <div className="p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-1">
          <Lightbulb className="w-4 h-4 text-[var(--warning)]" /> Optimization Suggestions
        </h3>
        <div className="space-y-2">
          {data.suggestions.map((s, i) => (
            <div key={i} className="p-2 rounded-md bg-[var(--bg-tertiary)] border-l-2 border-l-[var(--accent)]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{s.title}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded ${
                  s.priority === 'warning' ? 'bg-[var(--warning)]/20 text-[var(--warning)]' :
                  s.priority === 'success' ? 'bg-[var(--success)]/20 text-[var(--success)]' :
                  'bg-[var(--accent)]/20 text-[var(--accent)]'
                }`}>
                  Save {s.savings}
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">{s.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
