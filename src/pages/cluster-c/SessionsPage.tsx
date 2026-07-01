'use client';

import React, { useState } from 'react';
import { PanelWrapper } from '@/components/ui/PanelWrapper';
import { 
  History, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight, 
  FileText,
  Search,
  Calendar
} from 'lucide-react';

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

interface Snapshot {
  turnIndex: number;
  activeContext: string[];
  memoryState: any;
}

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  messages: Message[];
  stateSnapshots: Snapshot[];
  outcome: 'success' | 'failure' | 'incomplete';
  tokenCost: number;
}

// --- Mock Data ---
const MOCK_SESSIONS: Session[] = [
  {
    id: 'sess-2026-06-28',
    startTime: '2026-06-28T09:00:00Z',
    endTime: '2026-06-28T11:30:00Z',
    outcome: 'success',
    tokenCost: 142000,
    messages: [
      { id: 'm1', role: 'user', content: 'Research the current state of Room Temperature Superconductors.', timestamp: '09:00:00' },
      { id: 'm2', role: 'agent', content: 'Initiating deep research loop across 12 sources...', timestamp: '09:01:00' },
      { id: 'm3', role: 'system', content: 'Accessing MCP-Filesystem: read /docs/physics/superconductors.md', timestamp: '09:02:00' },
      { id: 'm4', role: 'agent', content: 'Found conflicting reports on the 2025 LK-99 update. Verifying with arXiv.', timestamp: '09:05:00' },
      { id: 'm5', role: 'agent', content: 'Synthesis complete. High confidence in the Nitrogen-doped Lutetium hydride findings.', timestamp: '11:20:00' },
    ],
    stateSnapshots: [
      { turnIndex: 0, activeContext: ['Physics', 'Materials Science'], memoryState: {} },
      { turnIndex: 1, activeContext: ['arXiv', 'Deep Research'], memoryState: {} },
      { turnIndex: 2, activeContext: ['Filesystem', 'Internal Docs'], memoryState: {} },
      { turnIndex: 3, activeContext: ['Conflict Resolution', 'Verification'], memoryState: {} },
      { turnIndex: 4, activeContext: ['Final Synthesis'], memoryState: {} },
    ],
  },
  {
    id: 'sess-2026-06-29',
    startTime: '2026-06-29T14:00:00Z',
    endTime: '2026-06-29T15:45:00Z',
    outcome: 'failure',
    tokenCost: 89000,
    messages: [
      { id: 'm1', role: 'user', content: 'Automate my email triage for the next 24h.', timestamp: '14:00:00' },
      { id: 'm2', role: 'agent', content: 'Setting up trigger listeners...', timestamp: '14:01:00' },
      { id: 'm3', role: 'system', content: 'Error: SMTP server authentication failed.', timestamp: '14:05:00' },
      { id: 'm4', role: 'agent', content: 'I was unable to complete the task due to authentication failure.', timestamp: '14:10:00' },
    ],
    stateSnapshots: [
      { turnIndex: 0, activeContext: ['Email Triage'], memoryState: {} },
      { turnIndex: 1, activeContext: ['SMTP Config'], memoryState: {} },
      { turnIndex: 2, activeContext: ['Error Handling'], memoryState: {} },
      { turnIndex: 3, activeContext: ['Termination'], memoryState: {} },
    ],
  },
];

export default function SessionsPage() {
  const [selectedSession, setSelectedSession] = useState<Session | null>(MOCK_SESSIONS[0]);
  const [playbackIndex, setPlaybackIndex] = useState(0);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlaybackIndex(parseInt(e.target.value));
  };

  return (
    <div className="grid grid-cols-12 gap-4 p-6 bg-slate-950 min-h-screen text-slate-200">
      {/* Header */}
      <div className="col-span-12 flex items-center justify-between bg-slate-900/50 border border-slate-800 p-4 rounded-xl glass-panel inner-bevel">
        <div className="flex items-center gap-3">
          <History className="text-indigo-400 w-5 h-5" />
          <h1 className="text-lg font-semibold">Session Archives</h1>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search archives..." 
              className="bg-slate-950 border border-slate-800 rounded-md pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500/50 w-64"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-md text-xs hover:bg-indigo-500/20 transition-all">
            <Calendar size={14} /> Filter by Date
          </button>
        </div>
      </div>

      {/* Session List */}
      <div className="col-span-4 space-y-4">
        <PanelWrapper title="Archive List">
          <div className="flex flex-col gap-3">
            {MOCK_SESSIONS.map(session => (
              <div 
                key={session.id} 
                onClick={() => {
                  setSelectedSession(session);
                  setPlaybackIndex(0);
                }}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  selectedSession?.id === session.id 
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300' 
                  : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-mono">{session.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase ${
                    session.outcome === 'success' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {session.outcome}
                  </span>
                </div>
                <div className="flex justify-between items-end text-[10px]">
                  <span>{new Date(session.startTime).toLocaleDateString()}</span>
                  <span className="font-mono opacity-60">{session.tokenCost.toLocaleString()} tokens</span>
                </div>
              </div>
            ))}
          </div>
        </PanelWrapper>
      </div>

      {/* Playback UI */}
      <div className="col-span-8 space-y-4">
        {selectedSession ? (
          <>
            <PanelWrapper title="Time-Travel Playback">
              <div className="flex flex-col gap-6">
                {/* Scrubber */}
                <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPlaybackIndex(prev => Math.max(0, prev - 1))}
                      className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button className="p-2 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition-all">
                      <Play size={16} />
                    </button>
                    <button 
                      onClick={() => setPlaybackIndex(prev => Math.min(selectedSession.messages.length - 1, prev + 1))}
                      className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button 
                      onClick={() => setPlaybackIndex(0)}
                      className="p-2 bg-slate-800 rounded-md hover:bg-slate-700 transition-all"
                    >
                      <RotateCcw size={16} />
                    </button>
                  </div>
                  <div className="flex-grow relative group">
                    <input 
                      type="range" 
                      min="0" 
                      max={selectedSession.messages.length - 1} 
                      value={playbackIndex} 
                      onChange={handleScrub}
                      className="w-full accent-indigo-500 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer" 
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono text-indigo-400 opacity-0 group-hover:opacity-100 transition-all">
                      Turn {playbackIndex + 1} / {selectedSession.messages.length}
                    </div>
                  </div>
                </div>

                {/* Message View */}
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-6 h-[400px] overflow-y-auto space-y-4">
                  {selectedSession.messages.slice(0, playbackIndex + 1).map((msg, i) => (
                    <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-bold uppercase ${
                          msg.role === 'user' ? 'text-slate-500' : msg.role === 'agent' ? 'text-indigo-400' : 'text-slate-600'
                        }`}>
                          {msg.role}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono">{msg.timestamp}</span>
                      </div>
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        msg.role === 'user' ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 
                        msg.role === 'agent' ? 'bg-slate-900 text-slate-300 border border-slate-800' : 
                        'bg-slate-900/30 text-slate-500 italic border border-slate-800'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {/* End of current playback window */}
                  <div className="flex justify-center py-4">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-ping" />
                  </div>
                </div>
              </div>
            </PanelWrapper>

            <PanelWrapper title="Context Snapshot">
              <div className="grid grid-cols-3 gap-4">
                {selectedSession.stateSnapshots[playbackIndex] ? (
                  <>
                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase mb-2">Active Concepts</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSession.stateSnapshots[playbackIndex].activeContext.map(ctx => (
                          <span key={ctx} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px]">
                            {ctx}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-500 uppercase mb-2">Memory State</p>
                      <div className="text-xs font-mono text-slate-400 italic">
                        {JSON.stringify(selectedSession.stateSnapshots[playbackIndex].memoryState)}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg">
                    <p className="text-[10px] text-slate-500 uppercase mb-2">Prompt Weight</p>
                    <div className="flex items-center gap-3">
                      <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                        <div className="bg-indigo-500 h-full w-1/3" />
                      </div>
                      <span className="text-xs font-mono text-slate-300">33%</span>
                    </div>
                  </div>
                </>
                ) : (
                  <div className="col-span-3 text-center py-10 text-slate-500 italic text-sm">No snapshot available for this turn</div>
                )}
              </div>
            </PanelWrapper>
          </>
        ) : (
          <div className="flex items-center justify-center h-full py-20 text-slate-500 italic text-sm">
            Select a session to analyze playback
          </div>
        )}
      </div>
    </div>
  );
}
