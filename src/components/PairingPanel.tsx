'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Key, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Trash2 } from 'lucide-react';

interface PairingRequest {
  code: string;
  platform: string;
  user_identifier: string;
  display_name?: string;
  created_at: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approved_by?: string;
  approved_at?: string;
}

interface PairingConfig {
  enabled: boolean;
  code_length: number;
  expiry_minutes: number;
  max_pending_per_platform: number;
  rate_limit_minutes: number;
  lockout_after_failures: number;
  lockout_duration_minutes: number;
}

export function PairingPanel() {
  const [requests, setRequests] = useState<PairingRequest[]>([]);
  const [config, setConfig] = useState<PairingConfig>({
    enabled: true, code_length: 8, expiry_minutes: 60, max_pending_per_platform: 3,
    rate_limit_minutes: 10, lockout_after_failures: 5, lockout_duration_minutes: 60,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchPairing = useCallback(async () => {
    try {
      const res = await fetch('/api/pairing');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
        if (data.config) setConfig(data.config);
      }
    } catch {
      setError('Hermes API unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPairing(); }, [fetchPairing]);

  const handleApprove = async (code: string) => {
    setProcessing(code);
    try {
      const res = await fetch('/api/pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', code }),
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.code === code ? { ...r, status: 'approved' as const, approved_at: new Date().toISOString() } : r));
      }
    } catch { /* ignore */ }
    setProcessing(null);
  };

  const handleDeny = async (code: string) => {
    setProcessing(code);
    try {
      const res = await fetch('/api/pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deny', code }),
      });
      if (res.ok) {
        setRequests(prev => prev.map(r => r.code === code ? { ...r, status: 'denied' as const } : r));
      }
    } catch { /* ignore */ }
    setProcessing(null);
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const resolvedRequests = requests.filter(r => r.status !== 'pending');

  const STATUS_STYLES: Record<string, { color: string; icon: React.ReactNode }> = {
    pending: { color: '#f59e0b', icon: <Clock className="w-4 h-4" /> },
    approved: { color: '#10b981', icon: <CheckCircle className="w-4 h-4" /> },
    denied: { color: '#ef4444', icon: <XCircle className="w-4 h-4" /> },
    expired: { color: '#6b7280', icon: <AlertTriangle className="w-4 h-4" /> },
  };

  const isExpired = (r: PairingRequest) => new Date(r.expires_at) < new Date();

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Pairing</h2>
          {pendingRequests.length > 0 && (
            <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: '#f59e0b22', color: '#f59e0b' }}>{pendingRequests.length} pending</span>
          )}
        </div>
        <button onClick={() => { setLoading(true); fetchPairing(); }} className="p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)' }} aria-label="Refresh">
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Config summary */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Configuration</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{config.code_length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Code Length</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{config.expiry_minutes}m</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Expiry</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{config.max_pending_per_platform}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Max Pending</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{config.lockout_after_failures}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Lockout After</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef444422', color: '#ef4444' }}>{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <>
          {/* Pending requests */}
          {pendingRequests.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-sm mb-3" style={{ color: '#f59e0b' }}>⏳ Pending Approval</h3>
              <div className="space-y-2">
                {pendingRequests.map(req => {
                  const expired = isExpired(req);
                  return (
                    <div key={req.code} className="p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid #f59e0b' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Key className="w-5 h-5" style={{ color: '#f59e0b' }} />
                          <code className="text-lg font-mono font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>{req.code}</code>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#f59e0b22', color: '#f59e0b' }}>{req.platform}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{req.display_name || req.user_identifier}</span>
                          <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>Expires {new Date(req.expires_at).toLocaleTimeString()}</span>
                        </div>
                        {!expired && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApprove(req.code)}
                              disabled={processing === req.code}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: '#10b981', color: 'white' }}
                            >Approve</button>
                            <button
                              onClick={() => handleDeny(req.code)}
                              disabled={processing === req.code}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium"
                              style={{ background: '#ef4444', color: 'white' }}
                            >Deny</button>
                          </div>
                        )}
                        {expired && <span className="text-xs" style={{ color: '#6b7280' }}>EXPIRED</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved history */}
          <div>
            <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>History</h3>
            {resolvedRequests.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No resolved pairing requests</p>
            ) : (
              <div className="space-y-1">
                {resolvedRequests.slice(0, 20).map(req => {
                  const statusStyle = STATUS_STYLES[isExpired(req) && req.status === 'pending' ? 'expired' : req.status] || STATUS_STYLES.denied;
                  return (
                    <div key={req.code} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-secondary)' }}>
                      <div style={{ color: statusStyle.color }}>{statusStyle.icon}</div>
                      <code className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{req.code}</code>
                      <span className="text-sm flex-1" style={{ color: 'var(--text-primary)' }}>{req.display_name || req.user_identifier}</span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.platform}</span>
                      <span className="text-xs capitalize" style={{ color: statusStyle.color }}>{isExpired(req) && req.status === 'pending' ? 'expired' : req.status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default PairingPanel;
