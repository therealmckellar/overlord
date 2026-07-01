'use client';

import React, { useState, useMemo } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { AlertTriangle, Search, XCircle, Play, RotateCcw, Terminal, ChevronRight, ChevronDown, Zap } from 'lucide-react';

// Types based on IMPLEMENTATION_PLAN_CLUSTER_B.md
interface FailureEvent {
  traceId: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  errorCode: string;
  message: string;
  agentId: string;
  missionId: string;
  stackTrace: string;
}

interface TraceStep {
  stepId: string;
  timestamp: string;
  component: string;
  action: string;
  status: 'success' | 'error';
  payload: {
    request: any;
    response: any;
  };
}

interface RCASummary {
  hypothesis: string;
  evidence: string[];
  suggestedFix: string;
  confidence: number;
}

// Mock Data
const generateMockFailures = (): FailureEvent[] => [
  {
    traceId: 'tr-9901',
    timestamp: new Date().toISOString(),
    severity: 'critical',
    errorCode: 'ERR_TOOL_TIMEOUT',
    message: 'Unexpected token in Tool: PythonExec - Process exceeded 30s limit',
    agentId: 'agent-01',
    missionId: 'mission-alpha',
    stackTrace: 'Error: Timeout at internal/process/task_queues.js:95:5\n    at async executeTool (tool_runtime.ts:142:12)\n    at async Agent.step (agent_core.ts:88:4)',
  },
  {
    traceId: 'tr-9902',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    severity: 'high',
    errorCode: 'ERR_LLM_HALLUCINATION',
    message: 'Latency Spike: 4.2s on LLM-Call - Response format invalid for JSON parser',
    agentId: 'agent-03',
    missionId: 'mission-beta',
    stackTrace: 'JSONParseError: Unexpected token < in JSON at position 0\n    at JSON.parse (<anonymous>)\n    at parseLLMResponse (parser.ts:22:10)',
  },
  {
    traceId: 'tr-9903',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    severity: 'medium',
    errorCode: 'ERR_API_403',
    message: 'Access Denied: Search tool returned 403 Forbidden for domain "internal.docs"',
    agentId: 'agent-02',
    missionId: 'mission-alpha',
    stackTrace: 'HttpError: 403 Forbidden\n    at searchProvider.ts:45:18\n    at async Tool.call (tool.ts:12:4)',
  },
];

const generateTraceFor = (traceId: string): TraceStep[] => [
  { stepId: 's1', timestamp: '10:00:01', component: 'Orchestrator', action: 'Plan Generation', status: 'success', payload: { request: { goal: 'Audit API' }, response: { plan: ['search', 'execute'] } } },
  { stepId: 's2', timestamp: '10:00:02', component: 'MCP-Server', action: 'Tool Call: search', status: 'success', payload: { request: { query: 'api endpoints' }, response: { results: ['/api/v1/user', '/api/v1/auth'] } } },
  { stepId: 's3', timestamp: '10:00:05', component: 'PythonExec', action: 'Tool Call: scan_port', status: 'error', payload: { request: { target: 'internal.docs' }, response: { error: 'Timeout' } } },
];

const generateRCA = (errorCode: string): RCASummary => {
  if (errorCode === 'ERR_TOOL_TIMEOUT') {
    return {
      hypothesis: 'Recursive loop in PythonExec script caused process hang.',
      evidence: ['CPU spiked to 100% before timeout', 'Input contains nested array of 1000+ elements'],
      suggestedFix: 'Implement strict recursion depth limits in PythonExec tool definition.',
      confidence: 0.85,
    };
  }
  return {
    hypothesis: 'Upstream API instability.',
    evidence: ['Multiple 5xx errors observed in neighboring agents'],
    suggestedFix: 'Increase retry backoff strategy.',
    confidence: 0.6,
  };
};

export default function FailureLogsPanel() {
  const [failures] = useState(generateMockFailures());
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);

  const selectedFailure = failures.find(f => f.traceId === selectedTraceId);
  const trace = selectedTraceId ? generateTraceFor(selectedTraceId) : [];
  const rca = selectedFailure ? generateRCA(selectedFailure.errorCode) : null;

  return (
    <div className="flex h-full overflow-hidden bg-transparent">
      {/* Error Aggregator */}
      <div className="w-1/3 border-r border-slate-800 flex flex-col bg-slate-900/20">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400" /> Failure Logs
          </h3>
          <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full border border-red-500/20">
            {failures.length} Active
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {failures.map(f => (
            <div 
              key={f.traceId}
              onClick={() => setSelectedTraceId(f.traceId)}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                selectedTraceId === f.traceId 
                ? 'bg-indigo-500/10 border-indigo-500/50 shadow-[0_0_10px_rgba(79,70,229,0.1)]' 
                : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  f.severity === 'critical' ? 'bg-red-500/20 text-red-400' : 
                  f.severity === 'high' ? 'bg-orange-500/20 text-orange-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {f.severity}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{f.traceId}</span>
              </div>
              <p className="text-xs text-slate-200 line-clamp-2 mb-2">{f.message}</p>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span className="flex items-center gap-1">🤖 {f.agentId}</span>
                <span>{new Date(f.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trace & Analysis View */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFailure ? (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* RCA Summary Panel */}
            <PanelWrapper title="AI-Powered Root Cause Analysis" className="border-indigo-500/30 bg-indigo-500/5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase">
                    <Zap className="w-3 h-3" /> Hypothesis
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{rca?.hypothesis}</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300 uppercase">
                    <Search className="w-3 h-3" /> Evidence
                  </div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    {rca?.evidence.map((e, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-indigo-500">•</span> {e}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-500/20 flex justify-between items-center">
                <div className="text-xs">
                  <span className="text-slate-500">Suggested Fix: </span>
                  <span className="text-slate-200 italic">{rca?.suggestedFix}</span>
                </div>
                <div className="text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30">
                  Confidence: {(rca?.confidence || 0) * 100}%
                </div>
              </div>
            </PanelWrapper>

            {/* Trace Viewer */}
            <PanelWrapper title="Execution Trace">
              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-0 before:bottom-0 before:w-px before:bg-slate-800">
                {trace.map((step, i) => (
                  <div key={step.stepId} className="relative group">
                    <div className={`absolute -left-[13px] top-1 w-2 h-2 rounded-full ${
                      step.status === 'success' ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_5px_rgba(239,68,68,0.5)]'
                    }`} />
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-slate-500">{step.timestamp}</span>
                          <span className="text-xs font-medium text-slate-300">{step.component}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                            step.status === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {step.action}
                          </span>
                        </div>
                        <div className="mt-2">
                          <details className="group">
                            <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-300 flex items-center gap-1">
                              <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                              View Payload
                            </summary>
                            <div className="mt-2 p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[10px] text-indigo-300 overflow-x-auto">
                              <div className="mb-2 text-slate-500">// Request</div>
                              <pre>{JSON.stringify(step.payload.request, null, 2)}</pre>
                              <div className="mt-2 mb-2 text-slate-500">// Response</div>
                              <pre>{JSON.stringify(step.payload.response, null, 2)}</pre>
                            </div>
                          </details>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PanelWrapper>

            {/* Quick Fix Hub */}
            <div className="flex gap-3 justify-end">
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
                <RotateCcw className="w-3 h-3" /> Clear Cache
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-slate-700">
                <Terminal className="w-3 h-3" /> Restart Agent
              </button>
              <button className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                <Play className="w-3 h-3" /> Force Re-run Step
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-500 gap-3">
            <div className="p-4 rounded-full bg-slate-800/50">
              <Search className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-sm">Select a failure log to analyze the trace</p>
          </div>
        )}
      </div>
    </div>
  );
}
