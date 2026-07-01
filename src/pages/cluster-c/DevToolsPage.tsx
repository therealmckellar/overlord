'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  Terminal, 
  Activity, 
  Search, 
  Cpu, 
  HardDrive, 
  Network, 
  ChevronRight, 
  AlertTriangle,
  Code
} from 'lucide-react';

// --- Types ---
interface ApiCall {
  id: string;
  timestamp: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  status: number;
  request: any;
  response: any;
  durationMs: number;
}

interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  server: string;
  message: string;
}

// --- Mock Data ---
const MOCK_API_CALLS: ApiCall[] = [
  { 
    id: 'call-1', 
    timestamp: '14:20:01', 
    endpoint: '/v1/mcp/filesystem/read', 
    method: 'POST', 
    status: 200, 
    durationMs: 45, 
    request: { path: '/home/rmckellar/project/main.py' }, 
    response: { content: 'import os...' } 
  },
  { 
    id: 'call-2', 
    timestamp: '14:20:05', 
    endpoint: '/v1/mcp/github/search', 
    method: 'POST', 
    status: 500, 
    durationMs: 1200, 
    request: { query: 'hermes-agent' }, 
    response: { error: 'Rate limit exceeded', code: 'GITHUB_API_429' } 
  },
  { 
    id: 'call-3', 
    timestamp: '14:21:10', 
    endpoint: '/v1/internal/state/update', 
    method: 'PUT', 
    status: 200, 
    durationMs: 12, 
    request: { key: 'session_id', value: 'sess-992' }, 
    response: { status: 'ok' } 
  },
];

const MOCK_LOGS: LogEntry[] = [
  { timestamp: '14:20:01', level: 'INFO', server: 'filesystem', message: 'Reading file /home/rmckellar/project/main.py' },
  { timestamp: '14:20:05', level: 'ERROR', server: 'github', message: 'MCP-Server-Connection-Timeout: Failed to reach GitHub API' },
  { timestamp: '14:20:06', level: 'WARN', server: 'github', message: 'Retrying request in 5s... (Attempt 1/3)' },
  { timestamp: '14:21:10', level: 'DEBUG', server: 'core', message: 'Updating session state for sess-992' },
  { timestamp: '14:22:00', level: 'INFO', server: 'browser', message: 'Successfully navigated to https://docs.firecrawl.dev' },
];

export default function DevToolsPage() {
  const [selectedCall, setSelectedCall] = useState<ApiCall | null>(null);

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <Terminal className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">System DevTools</h1>
        </div>
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-md text-xs text-slate-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Core System: Healthy
          </div>
          <button className="px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md text-xs hover:bg-indigo-500/20 transition-all">
            Clear All Logs
          </button>
        </div>
      </div>

      {/* System Internals Dashboard */}
      <div className="col-span-12 grid grid-cols-4 gap-4">
        <PanelWrapper title="CPU Load">
          <div className="flex items-center justify-between">
            <Cpu className="text-indigo-400 w-5 h-5" />
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-slate-200">12.4%</p>
              <p className="text-[10px] text-slate-500 uppercase">Peak: 42%</p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[12.4%]" />
          </div>
        </PanelWrapper>
        <PanelWrapper title="Memory Usage">
          <div className="flex items-center justify-between">
            <HardDrive className="text-indigo-400 w-5 h-5" />
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-slate-200">1.2 GB</p>
              <p className="text-[10px] text-slate-500 uppercase">Limit: 8 GB</p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[15%]" />
          </div>
        </PanelWrapper>
        <PanelWrapper title="Network Latency">
          <div className="flex items-center justify-between">
            <Network className="text-indigo-400 w-5 h-5" />
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-slate-200">24ms</p>
              <p className="text-[10px] text-slate-500 uppercase">Avg: 31ms</p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[40%]" />
          </div>
        </PanelWrapper>
        <PanelWrapper title="Token Velocity">
          <div className="flex items-center justify-between">
            <Activity className="text-indigo-400 w-5 h-5" />
            <div className="text-right">
              <p className="text-xl font-mono font-bold text-slate-200">84 tps</p>
              <p className="text-[10px] text-slate-500 uppercase">Burst: 120</p>
            </div>
          </div>
          <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="bg-indigo-500 h-full w-[60%]" />
          </div>
        </PanelWrapper>
      </div>

      {/* API Inspector */}
      <div className="col-span-8">
        <PanelWrapper title="API Inspector">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800">
                  <th className="pb-2 font-medium">Timestamp</th>
                  <th className="pb-2 font-medium">Method</th>
                  <th className="pb-2 font-medium">Endpoint</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Duration</th>
                  <th className="pb-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {MOCK_API_CALLS.map((call) => (
                  <tr 
                    key={call.id} 
                    className={`group cursor-pointer hover:bg-indigo-500/5 transition-colors ${selectedCall?.id === call.id ? 'bg-indigo-500/10' : ''}`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <td className="py-3 text-slate-400">{call.timestamp}</td>
                    <td className="py-3">
                      <span className={`px-1.5 py-0.5 rounded ${
                        call.method === 'GET' ? 'bg-blue-500/10 text-blue-400' : 
                        call.method === 'POST' ? 'bg-green-500/10 text-green-400' : 
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {call.method}
                      </span>
                    </td>
                    <td className="py-3 text-slate-300">{call.endpoint}</td>
                    <td className="py-3">
                      <span className={`font-bold ${call.status >= 400 ? 'text-red-400' : 'text-green-400'}`}>
                        {call.status}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500">{call.durationMs}ms</td>
                    <td className="py-3 text-right">
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-400 transition-colors" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PanelWrapper>
      </div>

      {/* Call Detail / JSON Viewer */}
      <div className="col-span-4">
        <PanelWrapper title="Call Details">
          {selectedCall ? (
            <div className="space-y-4">
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase mb-2">Request Payload</p>
                <pre className="text-xs text-indigo-300 font-mono overflow-auto max-h-32">
                  {JSON.stringify(selectedCall.request, null, 2)}
                </pre>
              </div>
              <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                <p className="text-[10px] text-slate-500 uppercase mb-2">Response Payload</p>
                <pre className="text-xs text-green-300 font-mono overflow-auto max-h-32">
                  {JSON.stringify(selectedCall.response, null, 2)}
                </pre>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-slate-500 font-mono">ID: {selectedCall.id}</span>
                <span className="text-xs text-slate-500 font-mono">Latency: {selectedCall.durationMs}ms</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic text-center py-20">Select a call to inspect</div>
          )}
        </PanelWrapper>
      </div>

      {/* MCP Server Logs */}
      <div className="col-span-8">
        <PanelWrapper title="MCP Server Log Aggregator">
          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs h-64 overflow-y-auto space-y-1">
            {MOCK_LOGS.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-slate-600">[{log.timestamp}]</span>
                <span className="text-indigo-400 font-bold w-20 text-right">[{log.server}]</span>
                <span className={`font-bold ${
                  log.level === 'ERROR' ? 'text-red-400' : log.level === 'WARN' ? 'text-yellow-400' : 'text-indigo-400'
                }`}>
                  {log.level}
                </span>
                <span className="text-slate-300">{log.message}</span>
              </div>
            ))}
            <div className="flex gap-3 animate-pulse">
              <span className="text-slate-600">[NOW]</span>
              <span className="text-indigo-400 font-bold w-20 text-right">[core]</span>
              <span className="text-indigo-400 font-bold">INFO</span>
              <span className="text-slate-500 italic">Monitoring all MCP servers...</span>
            </div>
          </div>
        </PanelWrapper>
      </div>

      {/* Debug Console */}
      <div className="col-span-4">
        <PanelWrapper title="Debug Console">
          <div className="flex flex-col gap-3">
            <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 h-32 overflow-y-auto font-mono text-xs text-slate-400">
              <p>&gt; system.reset_mcp_server('github')</p>
              <p className="text-green-400">OK: GitHub server reset successfully.</p>
              <p>&gt; core.get_internal_state()</p>
              <p className="text-indigo-400">{`{ "active_sessions": 4, "token_usage": "1.2M" }`}</p>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Execute raw system call..." 
                className="w-full bg-slate-950 border border-slate-800 rounded-md pl-3 pr-10 py-2 text-xs focus:outline-none focus:border-indigo-500/50 font-mono"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-indigo-400 hover:bg-indigo-500/20 rounded transition-all">
                <Code size={16} />
              </button>
            </div>
          </div>
        </PanelWrapper>
      </div>
    </div>
  );
}
