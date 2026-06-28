'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Hash, RefreshCw, Send, ExternalLink, Users, MessageSquare } from 'lucide-react';

interface Channel {
  id: string;
  name: string;
  platform: string;
  type: 'channel' | 'dm' | 'group';
  target: string; // Resolved send target
  lastActive?: string;
  unread?: number;
}

interface ChannelDirectory {
  platforms: Record<string, { channels: Channel[]; contacts: Channel[] }>;
  lastUpdated: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  discord: '💬',
  telegram: '✈️',
  slack: '📱',
  signal: '🔔',
  matrix: '🧮',
  whatsapp: '📲',
  email: '📧',
  sms: '📩',
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  channel: <Hash className="w-3 h-3" />,
  dm: <Users className="w-3 h-3" />,
  group: <MessageSquare className="w-3 h-3" />,
};

export function ChannelsPanel() {
  const [directory, setDirectory] = useState<ChannelDirectory>({ platforms: {}, lastUpdated: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [search, setSearch] = useState('');

  const fetchDirectory = useCallback(async () => {
    try {
      const res = await fetch('/api/channels');
      if (res.ok) {
        const data = await res.json();
        setDirectory(data);
      } else {
        setError('Failed to load channel directory');
      }
    } catch {
      setError('Hermes API unreachable');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDirectory(); }, [fetchDirectory]);

  // Flatten all channels/contacts across platforms
  const allEntries: (Channel & { platform: string })[] = [];
  for (const [platform, data] of Object.entries(directory.platforms)) {
    for (const ch of data.channels || []) {
      allEntries.push({ ...ch, platform });
    }
    for (const ct of data.contacts || []) {
      allEntries.push({ ...ct, platform });
    }
  }

  const platforms = ['all', ...Object.keys(directory.platforms)];
  const filtered = allEntries.filter(entry => {
    if (filterPlatform !== 'all' && entry.platform !== filterPlatform) return false;
    if (filterType !== 'all' && entry.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return entry.name.toLowerCase().includes(q) || entry.target.toLowerCase().includes(q) || entry.platform.toLowerCase().includes(q);
    }
    return true;
  });

  const totalChannels = allEntries.filter(e => e.type === 'channel').length;
  const totalContacts = allEntries.filter(e => e.type === 'dm' || e.type === 'group').length;

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Hash className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Channels</h2>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{totalChannels} channels</span>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{totalContacts} contacts</span>
        </div>
        <button
          onClick={() => { setLoading(true); fetchDirectory(); }}
          className="p-2 rounded-lg"
          style={{ background: 'var(--bg-tertiary)' }}
          aria-label="Refresh channels"
        >
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          {platforms.map(p => <option key={p} value={p}>{p === 'all' ? 'All Platforms' : p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          <option value="all">All Types</option>
          <option value="channel">Channels</option>
          <option value="dm">DMs</option>
          <option value="group">Groups</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search channels..."
          className="px-3 py-1.5 rounded-lg text-sm border flex-1 min-w-[150px]"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef444422', color: '#ef4444' }}>{error}</div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Hash className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No channels found</p>
          <p className="text-sm mt-1">Start the Hermes gateway to discover channels</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => (
            <div
              key={`${entry.platform}:${entry.id}`}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:opacity-90 transition-opacity"
              style={{ background: 'var(--bg-secondary)' }}
            >
              <span className="text-lg">{PLATFORM_ICONS[entry.platform] || '📡'}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {TYPE_ICONS[entry.type]}
                  <span className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{entry.name}</span>
                  {entry.unread && entry.unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-xs" style={{ background: 'var(--accent)', color: 'white' }}>{entry.unread}</span>
                  )}
                </div>
                <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{entry.target}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{entry.platform}</span>
                <button className="p-1 rounded" style={{ color: 'var(--text-muted)' }} title="Send message">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {directory.lastUpdated && (
        <div className="mt-4 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
          Last updated: {new Date(directory.lastUpdated).toLocaleString()}
        </div>
      )}
    </div>
  );
}

export default ChannelsPanel;
