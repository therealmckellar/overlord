'use client';

import React, { useState } from 'react';
import { useDeploymentStore, AgentDeployment, DeploymentStatus } from '@/stores/deploymentStore';
import { useAgentStore } from '@/stores/agentStore';

const STATUS_COLORS: Record<DeploymentStatus, string> = {
  pending: '#6b7280',
  building: '#f59e0b',
  deploying: '#3b82f6',
  live: '#10b981',
  failed: '#ef4444',
  rolled_back: '#8b5cf6',
};

export default function AgentDeploymentPanel() {
  const deployments = useDeploymentStore((s) => s.deployments);
  const addDeployment = useDeploymentStore((s) => s.addDeployment);
  const rollbackDeployment = useDeploymentStore((s) => s.rollbackDeployment);
  const addDeployLog = useDeploymentStore((s) => s.addDeployLog);
  const updateDeployment = useDeploymentStore((s) => s.updateDeployment);
  const agents = useAgentStore((s) => s.agents);

  const [showDeploy, setShowDeploy] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedEnv, setSelectedEnv] = useState<'staging' | 'production'>('staging');
  const [expandedDeployment, setExpandedDeployment] = useState<string | null>(null);

  const handleDeploy = () => {
    if (!selectedAgentId) return;
    const agent = agents.find((a) => a.id === selectedAgentId);
    if (!agent) return;
    const id = addDeployment(agent.name, selectedAgentId, selectedEnv);

    // Simulate deployment pipeline
    setTimeout(() => {
      updateDeployment(id, { status: 'building' });
      addDeployLog(id, '[INFO] Build started', 'info');
    }, 500);
    setTimeout(() => {
      addDeployLog(id, '[INFO] Compiling...', 'info');
    }, 1500);
    setTimeout(() => {
      addDeployLog(id, '[SUCCESS] Build complete', 'success');
      updateDeployment(id, { status: 'deploying' });
    }, 3000);
    setTimeout(() => {
      addDeployLog(id, `[INFO] Deploying to ${selectedEnv}...`, 'info');
    }, 3500);
    setTimeout(() => {
      addDeployLog(id, `[SUCCESS] Deployment live`, 'success');
      updateDeployment(id, {
        status: 'live',
        completedAt: Date.now(),
        endpoint: `https://api.mckellar.dev/agents/${agent.name.toLowerCase()}`,
      });
    }, 5000);

    setShowDeploy(false);
    setSelectedAgentId('');
  };

  const formatTime = (ts: number) => {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleTimeString();
  };

  const formatDuration = (start: number, end: number | null) => {
    if (!end) return 'In progress...';
    const s = Math.round((end - start) / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid #1e293b',
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
            🚀 Deployments
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
            {deployments.length} total · {deployments.filter((d) => d.status === 'live').length} live
          </p>
        </div>
        <button
          onClick={() => setShowDeploy(true)}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: '#3b82f6',
            color: '#fff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          🚀 Deploy Agent
        </button>
      </div>

      {/* Deploy Form */}
      {showDeploy && (
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={selectedAgentId}
              onChange={(e) => setSelectedAgentId(e.target.value)}
              style={{
                flex: 1,
                minWidth: '180px',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            >
              <option value="">Select agent...</option>
              {agents.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.model})</option>
              ))}
            </select>
            <select
              value={selectedEnv}
              onChange={(e) => setSelectedEnv(e.target.value as 'staging' | 'production')}
              style={{
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: '#1e293b',
                color: '#f1f5f9',
                fontSize: '13px',
              }}
            >
              <option value="staging">Staging</option>
              <option value="production">Production</option>
            </select>
            <button
              onClick={handleDeploy}
              disabled={!selectedAgentId}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: 'none',
                background: selectedAgentId ? '#10b981' : '#334155',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: selectedAgentId ? 'pointer' : 'not-allowed',
              }}
            >
              Deploy
            </button>
            <button
              onClick={() => setShowDeploy(false)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #334155',
                background: 'transparent',
                color: '#94a3b8',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Deployment List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {deployments.map((deploy) => (
          <div
            key={deploy.id}
            style={{
              marginBottom: '12px',
              borderRadius: '8px',
              border: '1px solid #1e293b',
              background: '#0f172a',
              overflow: 'hidden',
            }}
          >
            {/* Deployment Header */}
            <div
              onClick={() => setExpandedDeployment(expandedDeployment === deploy.id ? null : deploy.id)}
              style={{
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                borderBottom: expandedDeployment === deploy.id ? '1px solid #1e293b' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '16px' }}>
                  {deploy.status === 'live' ? '🟢' :
                   deploy.status === 'failed' ? '🔴' :
                   deploy.status === 'building' ? '🟡' :
                   deploy.status === 'deploying' ? '🔵' :
                   deploy.status === 'rolled_back' ? '🟣' : '⚪'}
                </span>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>
                    {deploy.agentName} <span style={{ color: '#64748b', fontWeight: 400 }}>{deploy.version}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {deploy.environment} · {formatDuration(deploy.startedAt, deploy.completedAt)}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  color: STATUS_COLORS[deploy.status],
                  background: `${STATUS_COLORS[deploy.status]}20`,
                  padding: '3px 8px',
                  borderRadius: '4px',
                }}>
                  {deploy.status.toUpperCase()}
                </span>
                {deploy.endpoint && (
                  <span style={{
                    fontSize: '10px',
                    color: '#64748b',
                    background: '#1e293b',
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}>
                    {deploy.endpoint.replace('https://', '')}
                  </span>
                )}
              </div>
            </div>

            {/* Expanded Details */}
            {expandedDeployment === deploy.id && (
              <div style={{ padding: '12px 16px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  marginBottom: '12px',
                }}>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Started:</span>{' '}
                    <span style={{ color: '#94a3b8' }}>{formatTime(deploy.startedAt)}</span>
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Duration:</span>{' '}
                    <span style={{ color: '#94a3b8' }}>{formatDuration(deploy.startedAt, deploy.completedAt)}</span>
                  </div>
                  <div style={{ fontSize: '11px' }}>
                    <span style={{ color: '#64748b' }}>Rollback:</span>{' '}
                    <span style={{ color: '#94a3b8' }}>{deploy.rollbackVersion || 'N/A'}</span>
                  </div>
                </div>

                {/* Logs */}
                <div style={{
                  background: '#0a0f1a',
                  borderRadius: '6px',
                  padding: '8px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.6',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}>
                  {deploy.logs.map((log) => (
                    <div key={log.id} style={{
                      color:
                        log.level === 'error' ? '#ef4444' :
                        log.level === 'success' ? '#10b981' :
                        log.level === 'warning' ? '#f59e0b' : '#94a3b8',
                    }}>
                      <span style={{ color: '#475569' }}>{formatTime(log.timestamp)}</span> {log.text}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {(deploy.status === 'live' || deploy.status === 'failed') && deploy.rollbackVersion && (
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => rollbackDeployment(deploy.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #8b5cf6',
                        background: 'transparent',
                        color: '#8b5cf6',
                        fontSize: '11px',
                        cursor: 'pointer',
                      }}
                    >
                      ↩ Rollback to {deploy.rollbackVersion}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
