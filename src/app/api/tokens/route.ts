import { NextResponse } from 'next/server';

// Token cost data — in production this would query a DB
// For now, structured to match what the dashboard stats API already calculates
export async function GET() {
  // Simulated per-model breakdown based on available models
  // In production, this would aggregate from session logs
  const modelBreakdown = [
    { model: 'openrouter/owl-alpha', tokens: 2_450_000, cost: 0.245, requests: 145 },
    { model: 'openai/gpt-oss-120b:free', tokens: 1_820_000, cost: 0.0, requests: 89 },
    { model: 'moonshotai/kimi-k2.6:free', tokens: 980_000, cost: 0.0, requests: 52 },
    { model: 'google/gemma-4-31b-it:free', tokens: 1_150_000, cost: 0.0, requests: 67 },
    { model: 'nvidia/nemotron-3-super-120b-a12b:free', tokens: 760_000, cost: 0.0, requests: 34 },
    { model: 'nex-agi/nex-n2-pro:free', tokens: 540_000, cost: 0.0, requests: 28 },
    { model: 'openai/gpt-oss-20b:free', tokens: 320_000, cost: 0.0, requests: 18 },
  ];

  const totalTokens = modelBreakdown.reduce((sum, m) => sum + m.tokens, 0);
  const totalCost = modelBreakdown.reduce((sum, m) => sum + m.cost, 0);
  const totalRequests = modelBreakdown.reduce((sum, m) => sum + m.requests, 0);

  // Per-agent breakdown
  const agentBreakdown = [
    { agent: 'Hermes (Orchestrator)', tokens: 1_850_000, cost: 0.185 },
    { agent: 'Builder (120b)', tokens: 2_100_000, cost: 0.0 },
    { agent: 'Planner (Nemotron)', tokens: 1_420_000, cost: 0.0 },
    { agent: 'SDR (Gemma)', tokens: 980_000, cost: 0.0 },
    { agent: 'Docs (Gemma-31b)', tokens: 760_000, cost: 0.0 },
    { agent: 'Researcher (Kimi)', tokens: 540_000, cost: 0.0 },
    { agent: 'Trading (Nemotron)', tokens: 370_000, cost: 0.06 },
  ];

  // Daily trend (last 7 days)
  const dailyTrend = [
    { day: 'Mon', tokens: 1_120_000, cost: 0.12 },
    { day: 'Tue', tokens: 1_450_000, cost: 0.15 },
    { day: 'Wed', tokens: 980_000, cost: 0.08 },
    { day: 'Thu', tokens: 1_680_000, cost: 0.18 },
    { day: 'Fri', tokens: 1_340_000, cost: 0.14 },
    { day: 'Sat', tokens: 760_000, cost: 0.06 },
    { day: 'Sun', tokens: 690_000, cost: 0.05 },
  ];

  // Optimization suggestions
  const suggestions = [
    {
      title: 'Switch Planner to gemma-4-26b',
      savings: '100%',
      detail: 'Planner uses Nemotron-550b (free). Already optimal.',
      priority: 'info',
    },
    {
      title: 'Use gpt-oss-20b for simple queries',
      savings: '~90%',
      detail: '70% of Hermes queries are simple routing. Consider a cheaper model.',
      priority: 'warning',
    },
    {
      title: 'Batch enrichment requests',
      savings: '~40%',
      detail: 'SDR makes individual API calls. Batch 10 at once for better rates.',
      priority: 'success',
    },
  ];

  return NextResponse.json({
    totalTokens,
    totalCost,
    totalRequests,
    modelBreakdown,
    agentBreakdown,
    dailyTrend,
    suggestions,
    budgetUsed: 5.2,
    budgetLimit: 50,
  });
}
