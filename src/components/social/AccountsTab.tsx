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

  useEffect(() => {
    syncAccounts();
  }, [syncAccounts]);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'social_connected') {
        setConnecting(null);
        syncAccounts();
      }
    };
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [syncAccounts]);

  const handleOAuthStart = (platformId: string) => {
    setConnecting(platformId);
    const width = 480;
    const height = 620;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `/api/social/accounts/connect/${platformId}`,
      `Connect ${platformId}`,
      `width=${width},height=${height},left=${left},top=${top},status=no,menubar=no,toolbar=no`
    );

    if (popup) {
      const timer = setInterval(() => {
        if (popup.closed) {
          clearInterval(timer);
          setConnecting(prev => prev === platformId ? null : prev);
        }
      }, 1000);
    } else {
      setConnecting(null);
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
                    onClick={() => handleOAuthStart(p.id)}
                    disabled={connecting !== null}
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
