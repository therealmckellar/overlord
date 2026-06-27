'use client';

import React from 'react';
import { useSharedMemoryStore } from '@/stores/sharedMemoryStore';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useDeploymentStore } from '@/stores/deploymentStore';
import { useSpaceStore } from '@/stores/spaceStore';
import { useAgentStore } from '@/stores/agentStore';

export default function AnalyticsDashboard() {
  const memory = useSharedMemoryStore((s) => s.memory);
  const goals = useSharedMemoryStore((s) => s.goals);
  const journal = useSharedMemoryStore((s) => s.journal);
  const sessions = useSharedMemoryStore((s) => s.sessions);
  const tasks = useKanbanStore((s) => s.tasks);
  const deployments = useDeploymentStore((s) => s.deployments);
  const spaces = useSpaceStore((s) => s.spaces);
  const agents = useAgentStore((s) => s.agents);

  // Compute analytics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const activeGoals = goals.filter((g) => g.status === 'active').length;
  const completedGoals = goals.filter((g) => g.status === 'completed').length;
  const avgGoalProgress = goals.length > 0 ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0;

  // Agent counts from agentStore (source of truth)
  const activeAgents = agents.filter((a) => a.status === 'active').length;
  const totalAgents = agents.length;

  const liveDeployments = deployments.filter((d) => d.status === 'live').length;
  const buildingDeployments = deployments.filter((d) => d.status === 'building' || d.status === 'deploying').length;
  const failedDeployments = deployments.filter((d) => d.status === 'failed').length;
  const deploySuccessRate = deployments.length > 0 ? Math.round((liveDeployments / deployments.length) * 100) : 0;

  // Running agents = active from agentStore + live deployments
  const runningAgents = activeAgents + liveDeployments;

  const totalSessions = sessions.length;
  const recentJournal = journal.filter((j) => j.timestamp > Date.now() - 86400000 * 7).length;

  const builtCount = journal.filter((j) => j.type === 'built').length;
  const blockedCount = journal.filter((j) => j.type === 'blocked').length;
  const learnedCount = journal.filter((j) => j.type === 'learned').length;

  // Agent activity breakdown
  const agentActivity: Record<string, number> = {};
  sessions.forEach((s) => {
    agentActivity[s.agentName] = (agentActivity[s.agentName] || 0) + 1;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
          📊 Analytics
        </h2>
        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
          System-wide performance metrics
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {/* Top Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          marginBottom: '20px',
        }}>
          {[
            { label: 'Task Completion', value: `${taskCompletionRate}%`, sub: `${completedTasks}/${totalTasks}`, color: '#10b981' },
            { label: 'Goal Progress', value: `${avgGoalProgress}%`, sub: `${activeGoals} active`, color: '#3b82f6' },
            { label: 'Agent Activity', value: `${runningAgents}/${totalAgents}`, sub: `${buildingDeployments} building · ${failedDeployments} failed`, color: '#f59e0b' },
            { label: 'Deploy Success', value: `${deploySuccessRate}%`, sub: `${liveDeployments} live`, color: '#8b5cf6' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '14px',
              borderRadius: '8px',
              background: '#0f172a',
              border: '1px solid #1e293b',
            }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>{stat.label}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Task Breakdown */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
              📋 Task Breakdown
            </div>
            {[
              { label: 'Done', count: completedTasks, total: totalTasks, color: '#10b981' },
              { label: 'In Progress', count: inProgressTasks, total: totalTasks, color: '#f59e0b' },
              { label: 'To Do / Review', count: totalTasks - completedTasks - inProgressTasks, total: totalTasks, color: '#64748b' },
            ].map((item) => (
              <div key={item.label} style={{ marginBottom: '10px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  marginBottom: '4px',
                }}>
                  <span style={{ color: '#94a3b8' }}>{item.label}</span>
                  <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{item.count}</span>
                </div>
                <div style={{
                  height: '6px',
                  background: '#1e293b',
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${item.total > 0 ? (item.count / item.total) * 100 : 0}%`,
                    background: item.color,
                    borderRadius: '3px',
                  }} />
                </div>
              </div>
            ))}
          </div>

          {/* Journal Activity */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
              📓 Activity (7 days)
            </div>
            {[
              { label: 'Built', count: builtCount, color: '#10b981', icon: '🔨' },
              { label: 'Learned', count: learnedCount, color: '#f59e0b', icon: '💡' },
              { label: 'Blocked', count: blockedCount, color: '#ef4444', icon: '🚧' },
            ].map((item) => (
              <div key={item.label} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 0',
                borderBottom: '1px solid #1e293b',
              }}>
                <span style={{ fontSize: '16px' }}>{item.icon}</span>
                <span style={{ flex: 1, fontSize: '12px', color: '#94a3b8' }}>{item.label}</span>
                <span style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  color: item.color,
                }}>
                  {item.count}
                </span>
              </div>
            ))}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '10px',
              fontSize: '11px',
              color: '#64748b',
            }}>
              <span>Total journal entries</span>
              <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{journal.length}</span>
            </div>
          </div>

          {/* Deployment Status */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
              🚀 Deployment Status
            </div>
            {deployments.map((deploy) => (
              <div key={deploy.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '6px 0',
              }}>
                <span style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: deploy.status === 'live' ? '#10b981' : deploy.status === 'failed' ? '#ef4444' : deploy.status === 'building' || deploy.status === 'deploying' ? '#f59e0b' : '#8b5cf6',
                }} />
                <span style={{ flex: 1, fontSize: '12px', color: '#e2e8f0' }}>{deploy.agentName}</span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: deploy.status === 'live' ? '#10b981' : deploy.status === 'failed' ? '#ef4444' : '#f59e0b',
                }}>
                  {deploy.status.toUpperCase()}
                </span>
                <span style={{ fontSize: '10px', color: '#64748b' }}>
                  {deploy.environment}
                </span>
              </div>
            ))}
          </div>

          {/* Memory & Knowledge */}
          <div style={{
            padding: '14px',
            borderRadius: '8px',
            background: '#0f172a',
            border: '1px solid #1e293b',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#e2e8f0', marginBottom: '12px' }}>
              🧠 Memory & Knowledge
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}>
              {[
                { label: 'Memory Entries', value: memory.length, color: '#8b5cf6' },
                { label: 'Live Deploys', value: liveDeployments, color: '#10b981' },
                { label: 'Active Goals', value: activeGoals, color: '#3b82f6' },
                { label: 'Spaces', value: spaces.length, color: '#f59e0b' },
              ].map((item) => (
                <div key={item.label} style={{
                  padding: '10px',
                  borderRadius: '6px',
                  background: '#1e293b',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: item.color }}>{item.value}</div>
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Top Memory Sources */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px' }}>Top Memory Sources</div>
              {Object.entries(
                memory.reduce<Record<string, number>>((acc, m) => {
                  acc[m.source] = (acc[m.source] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([source, count]) => (
                  <div key={source} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    padding: '3px 0',
                  }}>
                    <span style={{ color: '#94a3b8' }}>{source}</span>
                    <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
