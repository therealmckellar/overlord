"use client";

import React, { useState, useEffect } from 'react';
import { useHandoffStore } from '@/stores/handoffStore';

export const HandoffPanel = () => {
  const { handoffs, activeHandoff, setActiveHandoff, setHandoffs } = useHandoffStore();
  const [selectedHandoff, setSelectedHandoff] = useState<any>(null);
  const [taskId, setTaskId] = useState<string>('');

  useEffect(() => {
    fetchPendingHandoffs();
  }, []);

  const fetchPendingHandoffs = async () => {
    const res = await fetch('/api/handoff');
    const data = await res.json();
    setHandoffs(data);
  };

  const fetchChain = async (tid: string) => {
    setTaskId(tid);
    const res = await fetch('/api/handoff/chain/' + tid);
    const data = await res.json();
    setHandoffs(data);
  };

  const handleResume = async (handoff: any) => {
    const res = await fetch('/api/handoff/' + handoff.id + '/accept', { method: 'POST' });
    if (res.ok) {
      setActiveHandoff(handoff);
      alert('Session resumed from ' + handoff.fromAgent);
    }
  };

  return (
    <div className="p-4 bg-zinc-900 text-zinc-100 rounded-lg border border-zinc-800 w-80 h-full flex flex-col gap-4 overflow-y-auto">
      <h2 className="text-lg font-bold border-b border-zinc-800 pb-2">Session Handoff</h2>
      
      <div className="flex flex-col gap-2">
        <label className="text-xs text-zinc-400">Task ID</label>
        <div className="flex gap-2">
          <input 
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm flex-1" 
            value={taskId} 
            onChange={(e) => setTaskId(e.target.value)} 
            placeholder="Enter Task ID..."
          />
          <button 
            onClick={() => fetchChain(taskId)}
            className="bg-zinc-700 hover:bg-zinc-600 px-2 py-1 rounded text-xs"
          >
            View Chain
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {handoffs.map((h, idx) => (
          <div key={h.id} className="p-2 bg-zinc-800 rounded border border-zinc-700 relative">
            <div className="text-xs font-medium flex justify-between items-center mb-1">
              <span>{h.fromAgent} &rarr; {h.toAgent}</span>
              <span className="text-[10px] text-zinc-500">{new Date(h.timestamp).toLocaleTimeString()}</span>
            </div>
            <p className="text-xs text-zinc-300 line-clamp-2 mb-2">{h.summary}</p>
            <button 
              onClick={() => setSelectedHandoff(h)}
              className="text-[10px] text-blue-400 hover:underline"
            >
              View Details
            </button>
            {idx < handoffs.length - 1 && (
              <div className="absolute -bottom-3 left-4 w-px h-3 bg-zinc-700" />
            )}
          </div>
        ))}
      </div>

      {selectedHandoff && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl max-w-lg w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Handoff Details</h3>
            <div className="space-y-4 text-sm">
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-bold">Summary</span>
                <p className="text-zinc-200">{selectedHandoff.summary}</p>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-bold">Files Modified</span>
                <ul className="list-disc list-inside text-zinc-300">
                  {selectedHandoff.filesModified?.map((f: string, i: number) => <li key={i}>{f}</li>) || <li>None</li>}
                </ul>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-bold">Decisions Made</span>
                <ul className="list-disc list-inside text-zinc-300">
                  {selectedHandoff.decisions?.map((d: string, i: number) => <li key={i}>{d}</li>) || <li>None</li>}
                </ul>
              </div>
              <div>
                <span className="text-zinc-500 block text-xs uppercase font-bold">Open Questions</span>
                <ul className="list-disc list-inside text-zinc-300">
                  {selectedHandoff.openQuestions?.map((q: string, i: number) => <li key={i}>{q}</li>) || <li>None</li>}
                </ul>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setSelectedHandoff(null)}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm"
              >
                Close
              </button>
              <button 
                onClick={() => handleResume(selectedHandoff)}
                className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-sm font-bold"
              >
                Resume Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
