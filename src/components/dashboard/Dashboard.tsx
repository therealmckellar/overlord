'use client';

import React, { useState, useEffect } from 'react';
import { TrendingWidget } from '@/components/dashboard/TrendingWidget';
import TaskEventFeed from '@/components/TaskEventFeed';

export default function Dashboard() {
  const [health, setHealth] = useState<{ status: string; agents?: number } | null>(null);

  useEffect(() => {
    // Fetch real health status
    fetch('/api/health')
      .then(r => r.json())
      .then(data => setHealth(data))
      .catch(() => setHealth({ status: 'unknown' }));

    // Fetch agent count
    fetch('/api/agents/status')
      .then(r => r.json())
      .then(data => setHealth(prev => ({ ...prev, status: prev?.status || 'ok', agents: data.agents?.length || 0 })))
      .catch(() => {});
  }, []);

  const handleOpenSocial = () => {
    window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'social' }));
  };

  return (
    <div className="flex flex-col gap-5 p-5 overflow-y-auto h-full animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">Command Center</h1>
          <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
            {health ? (
              <>
                Status: <span className={health.status === 'ok' ? 'text-[var(--success)]' : 'text-[var(--warning)]'}>
                  {health.status === 'ok' ? 'Connected' : health.status}
                </span>
                {health.agents !== undefined && (
                  <span className="ml-2">· {health.agents} agents</span>
                )}
              </>
            ) : (
              'Checking connection...'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'agentOffice' }))}
            className="btn btn-primary btn-sm"
          >
            🏢 Bot Office
          </button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'taskboard' }))}
            className="btn btn-secondary btn-sm"
          >
            📋 Task Board
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 flex-1 min-h-0">
        {/* Live Agent Activity Feed */}
        <div className="xl:col-span-2 card overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <TaskEventFeed />
          </div>
        </div>

        {/* Trending */}
        <div className="xl:col-span-1 card overflow-hidden flex flex-col">
          <TrendingWidget onOpenSocial={handleOpenSocial} />
        </div>
      </div>
    </div>
  );
}
