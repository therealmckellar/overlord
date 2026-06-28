'use client';

import React, { useState, useEffect } from 'react';
import { Puzzle, Download, RefreshCw, CheckCircle2, AlertCircle, Eye, EyeOff, Settings2 } from 'lucide-react';

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  enabled: boolean;
  configStatus: 'ok' | 'warning' | 'error';
}

export default function PluginPanel() {
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [installId, setInstallId] = useState('');
  const [forceInstall, setForceInstall] = useState(false);
  const [autoEnable, setAutoEnable] = useState(true);

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/plugins');
      const data = await res.json();
      setPlugins(data);
    } catch (e) {
      console.error('Failed to fetch plugins', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRescan = async () => {
    try {
      await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rescan' }),
      });
      await fetchPlugins();
    } catch (e) {
      console.error('Rescan failed', e);
    }
  };

  const handleInstall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!installId.trim()) return;
    // Mock install for now as API route not fully specified for actual installation
    alert(`Installing plugin ${installId}...`);
    setInstallId('');
  };

  const togglePlugin = async (id: string) => {
    // Mock toggle
    setPlugins(plugins.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-secondary)] text-[var(--text)]">
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Puzzle className="w-5 h-5 text-[var(--accent)]" />
          <h2 className="text-lg font-semibold">Plugin Hub</h2>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRescan}
            className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-md text-xs font-medium hover:bg-[var(--bg-tertiary)] transition-colors text-[var(--text-secondary)]"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Rescan
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {/* Global Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Memory Provider</label>
            <select className="w-full bg-transparent text-xs outline-none text-[var(--text-secondary)] cursor-pointer">
              <option>Vectorize (Cloudflare)</option>
              <option>Pinecone</option>
              <option>Milvus</option>
              <option>Local SQLite</option>
            </select>
          </div>
          <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Context Engine</label>
            <select className="w-full bg-transparent text-xs outline-none text-[var(--text-secondary)] cursor-pointer">
              <option>Semantic Ranker</option>
              <option>Hybrid Search</option>
              <option>Recency Weighted</option>
            </select>
          </div>
          <div className="p-3 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-lg flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold">Dashboard Visibility</div>
              <div className="text-xs text-[var(--text-secondary)]">Show plugins in main view</div>
            </div>
            <button className="w-10 h-5 bg-[var(--accent)] rounded-full relative transition-colors">
              <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full" />
            </button>
          </div>
        </div>

        {/* Install Form */}
        <div className="mb-8 p-4 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl">
          <form onSubmit={handleInstall} className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <label className="text-xs text-[var(--text-muted)]">Plugin ID / Repository URL</label>
              <input 
                value={installId}
                onChange={(e) => setInstallId(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md text-sm outline-none focus:border-[var(--accent)]"
                placeholder="e.g. hermes-plugin-web-search"
              />
            </div>
            <div className="flex items-center gap-4 pb-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={forceInstall} 
                  onChange={(e) => setForceInstall(e.target.checked)}
                  className="rounded border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent)]"
                />
                Force Install
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoEnable} 
                  onChange={(e) => setAutoEnable(e.target.checked)}
                  className="rounded border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--accent)]"
                />
                Auto-Enable
              </label>
            </div>
            <button 
              type="submit"
              className="px-4 py-2 bg-[var(--accent)] text-white rounded-md text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Install
            </button>
          </form>
        </div>

        {/* Plugins Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm text-[var(--text-muted)]">Loading plugins...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {plugins.map((plugin) => (
              <div key={plugin.id} className="p-4 bg-[var(--bg-tertiary)] border border-[var(--border)] rounded-xl hover:border-[var(--accent)] transition-all group">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-xl">
                      🧩
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm">{plugin.name}</h3>
                      <span className="text-[10px] text-[var(--text-muted)] font-mono">v{plugin.version}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => togglePlugin(plugin.id)}
                    className={`w-10 h-5 rounded-full relative transition-colors ${plugin.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'}`}
                  >
                    <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plugin.enabled ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mb-4 line-clamp-2 min-h-[32px]">
                  {plugin.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <div className="flex items-center gap-1.5">
                    {plugin.configStatus === 'ok' && <CheckCircle2 className="w-3 h-3 text-green-400" />}
                    {plugin.configStatus === 'warning' && <AlertCircle className="w-3 h-3 text-yellow-400" />}
                    {plugin.configStatus === 'error' && <AlertCircle className="w-3 h-3 text-red-400" />}
                    <span className="text-[10px] text-[var(--text-muted)]">Config: {plugin.configStatus}</span>
                  </div>
                  <button className="p-1.5 hover:bg-[var(--bg-secondary)] rounded text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                    <Settings2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {plugins.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <Puzzle className="w-12 h-12 text-[var(--border)] mb-3" />
                <p className="text-sm text-[var(--text-muted)]">No plugins installed.</p>
                <p className="text-xs text-[var(--text-muted)] opacity-60">Install a plugin using the ID above to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
