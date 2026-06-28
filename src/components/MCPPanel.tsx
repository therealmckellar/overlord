'use client';

import React, { useState } from 'react';
import { useConnectorStore, type MCPServer } from '@/stores/connectorStore';
import { Plug, Plus, Trash2, RefreshCw, Power, Zap, AlertTriangle, CheckCircle, XCircle, Settings } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
  connected: { color: '#10b981', icon: <CheckCircle className="w-4 h-4" />, label: 'Connected' },
  disconnected: { color: '#6b7280', icon: <XCircle className="w-4 h-4" />, label: 'Disconnected' },
  error: { color: '#ef4444', icon: <AlertTriangle className="w-4 h-4" />, label: 'Error' },
  testing: { color: '#f59e0b', icon: <RefreshCw className="w-4 h-4 animate-spin" />, label: 'Testing' },
};

const TRANSPORT_LABELS: Record<string, string> = {
  stdio: 'Stdio (local process)',
  sse: 'SSE (HTTP stream)',
  http: 'HTTP (JSON-RPC)',
};

export function MCPPanel() {
  const mcpServers = useConnectorStore((s) => s.mcpServers);
  const addMCPServer = useConnectorStore((s) => s.addMCPServer);
  const updateMCPServer = useConnectorStore((s) => s.updateMCPServer);
  const deleteMCPServer = useConnectorStore((s) => s.deleteMCPServer);
  const testMCPServer = useConnectorStore((s) => s.testMCPServer);

  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Add form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [transport, setTransport] = useState<'stdio' | 'sse' | 'http'>('sse');
  const [apiKey, setApiKey] = useState('');
  const [desc, setDesc] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return;
    addMCPServer({ name: name.trim(), url: url.trim(), transport, enabled: true, apiKey: apiKey.trim() || undefined, description: desc.trim() || undefined });
    setName(''); setUrl(''); setTransport('sse'); setApiKey(''); setDesc('');
    setShowAdd(false);
  };

  const connected = mcpServers.filter(s => s.enabled && s.status === 'connected').length;
  const errored = mcpServers.filter(s => s.status === 'error').length;

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Plug className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>MCP Servers</h2>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: '#10b98122', color: '#10b981' }}>{connected} active</span>
          {errored > 0 && <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: '#ef444422', color: '#ef4444' }}>{errored} errors</span>}
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'white' }}>
          <Plus className="w-4 h-4" /> Add Server
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>New MCP Server</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Browser Rendering" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>URL / Command</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:8080 or /path/to/server" className="w-full px-3 py-2 rounded-lg text-sm border font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Transport</label>
              <select value={transport} onChange={(e) => setTransport(e.target.value as 'stdio' | 'sse' | 'http')} className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}>
                <option value="sse">SSE (HTTP stream)</option>
                <option value="stdio">Stdio (local process)</option>
                <option value="http">HTTP (JSON-RPC)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>API Key (optional)</label>
              <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" placeholder="Bearer token or API key" className="w-full px-3 py-2 rounded-lg text-sm border font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Description (optional)</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What this MCP server provides" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAdd} disabled={!name.trim() || !url.trim()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'white', opacity: !name.trim() || !url.trim() ? 0.5 : 1 }}>Add</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Server list */}
      {mcpServers.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Plug className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No MCP servers configured</p>
          <p className="text-sm mt-1">Add an MCP server to connect external tools and data sources</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mcpServers.map(server => {
            const statusConf = STATUS_CONFIG[server.status] || STATUS_CONFIG.disconnected;
            const isExpanded = expandedId === server.id;

            return (
              <div key={server.id} className="rounded-xl" style={{ background: 'var(--bg-secondary)', border: `1px solid ${server.status === 'error' ? '#ef4444' : server.enabled ? 'var(--accent)' : 'var(--border)'}` }}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div style={{ color: statusConf.color }}>{statusConf.icon}</div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{server.name}</h3>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <span className="font-mono truncate">{server.url}</span>
                        <span className="px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-tertiary)' }}>{transport}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateMCPServer(server.id, { enabled: !server.enabled })} className="p-1.5 rounded" style={{ color: server.enabled ? '#10b981' : 'var(--text-muted)' }} title={server.enabled ? 'Disable' : 'Enable'}>
                      <Power className="w-4 h-4" />
                    </button>
                    <button onClick={() => testMCPServer(server.id)} className="p-1.5 rounded" style={{ color: 'var(--text-secondary)' }} title="Test connection">
                      <Zap className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : server.id)} className="p-1.5 rounded" style={{ color: 'var(--text-secondary)' }} title="Details">
                      <Settings className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteMCPServer(server.id)} className="p-1.5 rounded hover:text-red-400" style={{ color: 'var(--text-muted)' }} title="Delete">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    {server.description && (
                      <div className="pt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{server.description}</div>
                    )}
                    <div className="pt-2">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Transport: </span>
                      <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{TRANSPORT_LABELS[server.transport] || server.transport}</span>
                    </div>
                    {server.apiKey && (
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>API Key: </span>
                        <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>••••••••</code>
                      </div>
                    )}
                    {server.headers && Object.keys(server.headers).length > 0 && (
                      <div>
                        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Custom Headers: </span>
                        <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{Object.keys(server.headers).length} header(s)</code>
                      </div>
                    )}
                    {server.lastTested && (
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Last tested: {new Date(server.lastTested).toLocaleString()}</div>
                    )}
                    {server.errorMessage && (
                      <div className="text-xs" style={{ color: '#ef4444' }}>Error: {server.errorMessage}</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MCPPanel;
