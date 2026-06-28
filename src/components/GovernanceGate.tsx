'use client';

import React, { useState } from 'react';
import { useGovernanceStore } from '@/stores/governanceStore';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function GovernanceGate() {
  const { isGateOpen, pendingAction, setGateOpen } = useGovernanceStore();
  const [need, setNeed] = useState('');
  const [risk, setRisk] = useState('');
  const [owner, setOwner] = useState('');
  const [overrideMode, setOverrideMode] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  if (!isGateOpen || !pendingAction) return null;

  const handleApprove = async () => {
    if (need.length < 10 || risk.length < 10 || !owner) {
      alert('Please provide detailed Need and Risk (min 10 chars) and select an Owner.');
      return;
    }

    const res = await fetch('/api/governance/approve', {
      method: 'POST',
      body: JSON.stringify({
        action: pendingAction.action,
        need,
        risk,
        owner,
        user: 'current_user',
      }),
    });

    if (res.ok) {
      pendingAction.resolve(true);
      setGateOpen(false);
      setNeed(''); setRisk(''); setOwner('');
    }
  };

  const handleOverride = async () => {
    if (overrideReason.length < 10) {
      alert('Please provide a detailed reason for the override.');
      return;
    }

    const res = await fetch('/api/governance/override', {
      method: 'POST',
      body: JSON.stringify({
        action: pendingAction.action,
        reason: overrideReason,
        user: 'current_user',
      }),
    });

    if (res.ok) {
      pendingAction.resolve(true);
      setGateOpen(false);
      setOverrideReason('');
    }
  };

  const handleCancel = () => {
    pendingAction.resolve(false);
    setGateOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[var(--bg-tertiary)] border border-[var(--border)] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3">
          <AlertTriangle className="text-amber-500" />
          <h3 className="text-lg font-bold text-white">Governance Gate Required</h3>
        </div>

        <div className="p-6 space-y-6">
          <div className="p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
            <p className="text-xs text-amber-200 font-mono truncate">
              Action: {pendingAction.action}
            </p>
          </div>

          {!overrideMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase">Need</label>
                <textarea
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  placeholder="What problem does this solve?"
                  value={need}
                  onChange={(e) => setNeed(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase">Risk</label>
                <textarea
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  placeholder="What's the worst that could happen?"
                  value={risk}
                  onChange={(e) => setRisk(e.target.value)}
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase">Owner</label>
                <select
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-[var(--accent)] outline-none"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                >
                  <option value="">Select responsible party...</option>
                  <option value="admin">Administrator</option>
                  <option value="lead-dev">Lead Developer</option>
                  <option value="security-officer">Security Officer</option>
                  <option value="ai-agent-overlord">AI Agent Overlord</option>
                </select>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-red-400 mb-1 uppercase">Override Reason</label>
              <textarea
                className="w-full bg-[var(--bg-secondary)] border border-red-500/30 rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-red-500 outline-none"
                placeholder="Explain why this bypass is necessary..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="p-6 bg-[var(--bg-secondary)] border-t border-[var(--border)] flex flex-col gap-3">
          <div className="flex gap-3">
            {!overrideMode ? (
              <>
                <button
                  onClick={handleApprove}
                  className="flex-1 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle size={16} /> Approve Action
                </button>
                <button
                  onClick={() => setOverrideMode(true)}
                  className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Request Override
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleOverride}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle size={16} /> Execute Override
                </button>
                <button
                  onClick={() => setOverrideMode(false)}
                  className="px-4 py-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Request Approval
                </button>
              </>
            )}
          </div>
          <button
            onClick={handleCancel}
            className="w-full py-2 text-xs text-[var(--text-muted)] hover:text-white transition-colors"
          >
            Abort Operation
          </button>
        </div>
      </div>
    </div>
  );
}
