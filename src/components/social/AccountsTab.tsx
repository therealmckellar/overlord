'use client';

import { useState, useEffect } from 'react';
import { useSocialStore } from '@/stores/socialStore';
import { Plus, Trash2, RefreshCw, ExternalLink } from 'lucide-react';

const PLATFORMS = [
  { id: 'x', name: 'X / Twitter', icon: '𝕏', color: 'bg-black/20' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', color: 'bg-blue-600/20' },
  { id: 'instagram', name: 'Instagram', icon: '📷', color: 'bg-pink-500/20' },
  { id: 'facebook', name: 'Facebook', icon: 'f', color: 'bg-blue-500/20' },
  { id: 'tiktok', name: 'TikTok', icon: '♪', color: 'bg-red-500/20' },
  { id: 'youtube', name: 'YouTube', icon: '▶', color: 'bg-red-600/20' },
  { id: 'reddit', name: 'Reddit', icon: '🤖', color: 'bg-orange-500/20' },
];

export function AccountsTab() {
  const accounts = useSocialStore((s) => s.accounts);
  const disconnectAccount = useSocialStore((s) => s.disconnectAccount);
  const syncAccounts = useSocialStore((s) => s.syncAccounts);
  const [connecting, setConnecting] = useState<string | null>(null);

  // Connection modal state
  const [activePlatform, setActivePlatform] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [accountName, setAccountName] = useState('');
  const [username, setUsername] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    syncAccounts();
  }, [syncAccounts]);

  const handleConnect = async () => {
    if (!activePlatform) return;
    const platform = activePlatform.id;
    setConnecting(platform);
    try {
      const res = await fetch(`/api/social/accounts/connect/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          account_name: accountName.trim() || activePlatform.name, 
          platform_user_id: username.trim() || null, 
          access_token: accessToken.trim() || null 
        }),
      });
      if (res.ok) {
        await syncAccounts();
      }
    } catch {
      // silent
    } finally {
      setConnecting(null);
      setActivePlatform(null);
      setAccountName('');
      setUsername('');
      setAccessToken('');
    }
  };

  const handleDisconnect = async (id: string) => {
    await disconnectAccount(id);
    await syncAccounts();
  };

  const connectedByPlatform = new Map(accounts.filter((a) => a.status === 'connected').map((a) => [a.platform, a]));

  return (
    <div className="p-4 space-y-4 relative">
      {/* Platform Grid */}
      <div>
        <h3 className="text-xs font-medium text-[var(--text-muted)] mb-3 uppercase tracking-wider">Connect Platforms</h3>
        <div className="grid grid-cols-2 gap-3">
          {PLATFORMS.map((p) => {
            const connected = connectedByPlatform.get(p.id);
            return (
              <div
                key={p.id}
                className="p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center gap-3"
              >
                <div className={`w-9 h-9 rounded-lg ${p.color} flex items-center justify-center text-sm font-bold text-[var(--text)]`}>
                  {p.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-[var(--text)] truncate">{p.name}</div>
                  <div className={`text-[10px] ${connected ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}>
                    {connected ? (connected.account_name || 'Connected') : 'Not connected'}
                  </div>
                </div>
                {connected ? (
                  <button
                    onClick={() => handleDisconnect(connected.id)}
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                    title="Disconnect"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => setActivePlatform(p)}
                    disabled={connecting === p.id}
                    className="px-2 py-1 text-[10px] rounded bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {connecting === p.id ? '...' : 'Connect'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Connection Modal Overlay */}
      {activePlatform && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activePlatform.icon}</span>
              <h3 className="text-sm font-semibold text-[var(--text)]">Connect {activePlatform.name}</h3>
            </div>
            
            <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
              Enter your account information to establish a connection. Integrations use local credential storage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Account Name / Alias
                </label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="e.g. My Company Account"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  Username / Handle
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. @username"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                  API Key / Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Optional credentials token"
                  className="w-full px-2.5 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  setActivePlatform(null);
                  setAccountName('');
                  setUsername('');
                  setAccessToken('');
                }}
                className="px-3 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleConnect}
                disabled={connecting === activePlatform.id}
                className="px-3 py-1.5 text-xs rounded bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-50 font-medium"
              >
                {connecting === activePlatform.id ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vertical Manager */}
      <VerticalManager />
    </div>
  );
}

function VerticalManager() {
  const verticals = useSocialStore((s) => s.verticals);
  const addVertical = useSocialStore((s) => s.addVertical);
  const deleteVertical = useSocialStore((s) => s.deleteVertical);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    addVertical(name.trim(), description.trim());
    setName('');
    setDescription('');
    setShowAdd(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">Verticals</h3>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-1 px-2 py-1 text-[10px] rounded bg-[var(--accent)] text-white hover:opacity-90"
        >
          <Plus className="w-3 h-3" />
          Add
        </button>
      </div>

      {showAdd && (
        <div className="mb-3 p-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Vertical name (e.g., Commercial Funding)"
            className="w-full px-2 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full px-2 py-1.5 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-xs rounded bg-[var(--success)] text-white hover:opacity-90 disabled:opacity-50"
          >
            Save Vertical
          </button>
        </div>
      )}

      <div className="space-y-2">
        {verticals.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)] text-center py-4">
            No verticals yet. Add one to start tracking trends and mentions.
          </p>
        ) : (
          verticals.map((v) => (
            <div key={v.id} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--text)]">{v.name}</div>
                {v.description && <div className="text-[10px] text-[var(--text-muted)] truncate">{v.description}</div>}
              </div>
              <button
                onClick={() => deleteVertical(v.id)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--error)]"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
