'use client';

import React, { useState } from 'react';
import { useConnectorStore, type WebhookEndpoint } from '@/stores/connectorStore';
import { Webhook, Plus, Trash2, Send, Eye, EyeOff, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode }> = {
  connected: { color: '#10b981', icon: <CheckCircle className="w-4 h-4" /> },
  disconnected: { color: '#6b7280', icon: <XCircle className="w-4 h-4" /> },
  error: { color: '#ef4444', icon: <AlertTriangle className="w-4 h-4" /> },
  testing: { color: '#f59e0b', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
};

const EVENT_TYPES = [
  'session.start', 'session.end', 'tool.call', 'tool.result',
  'agent.error', 'agent.complete', 'deploy.start', 'deploy.complete', 'deploy.fail',
  'cron.tick', 'cron.complete', 'cron.fail', 'message.received', 'message.sent',
  'custom',
];

export function WebhooksPanel() {
  const webhooks = useConnectorStore((s) => s.webhooks);
  const addWebhook = useConnectorStore((s) => s.addWebhook);
  const updateWebhook = useConnectorStore((s) => s.updateWebhook);
  const deleteWebhook = useConnectorStore((s) => s.deleteWebhook);
  const testWebhook = useConnectorStore((s) => s.testWebhook);

  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  // Add form
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [events, setEvents] = useState<string[]>(['session.start']);
  const [customEvent, setCustomEvent] = useState('');

  const handleAdd = () => {
    if (!name.trim() || !url.trim()) return;
    const allEvents = customEvent.trim() ? [...events, customEvent.trim()] : events;
    addWebhook({ name: name.trim(), url: url.trim(), secret: secret.trim() || 'auto-generated', events: allEvents, enabled: true });
    setName(''); setUrl(''); setSecret(''); setEvents(['session.start']); setCustomEvent('');
    setShowAdd(false);
  };

  const toggleEvent = (event: string) => {
    setEvents(prev => prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]);
  };

  const connected = webhooks.filter(w => w.enabled && w.status === 'connected').length;
  const errored = webhooks.filter(w => w.status === 'error').length;

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Webhook className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Webhooks</h2>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: '#10b98122', color: '#10b981' }}>{connected} active</span>
          {errored > 0 && <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: '#ef444422', color: '#ef4444' }}>{errored} errors</span>}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'white' }}
        >
          <Plus className="w-4 h-4" /> Add Webhook
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--accent)' }}>
          <h3 className="font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>New Webhook Endpoint</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Slack Notification" className="w-full px-3 py-2 rounded-lg text-sm border" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>URL</label>
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://hooks.slack.com/..." className="w-full px-3 py-2 rounded-lg text-sm border font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Secret (optional)</label>
              <input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Auto-generated if empty" type="password" className="w-full px-3 py-2 rounded-lg text-sm border font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Events</label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_TYPES.filter(e => e !== 'custom').map(event => (
                  <button
                    key={event}
                    onClick={() => toggleEvent(event)}
                    className="px-2 py-1 rounded text-xs"
                    style={{
                      background: events.includes(event) ? 'var(--accent)' : 'var(--bg-tertiary)',
                      color: events.includes(event) ? 'white' : 'var(--text-secondary)',
                    }}
                  >{event}</button>
                ))}
              </div>
              <input value={customEvent} onChange={(e) => setCustomEvent(e.target.value)} placeholder="Custom event name..." className="mt-2 w-full px-3 py-1.5 rounded-lg text-xs border font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={handleAdd} disabled={!name.trim() || !url.trim()} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--accent)', color: 'white', opacity: !name.trim() || !url.trim() ? 0.5 : 1 }}>Create</button>
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Webhook list */}
      {webhooks.length === 0 ? (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          <Webhook className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No webhooks configured</p>
          <p className="text-sm mt-1">Add a webhook to receive real-time event notifications</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map(webhook => {
            const statusConf = STATUS_CONFIG[webhook.status] || STATUS_CONFIG.disconnected;
            const isExpanded = expandedId === webhook.id;
            const isSecretVisible = showSecret[webhook.id];

            return (
              <div key={webhook.id} className="rounded-xl" style={{ background: 'var(--bg-secondary)', border: `1px solid ${webhook.status === 'error' ? '#ef4444' : 'var(--border)'}` }}>
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div style={{ color: statusConf.color }}>{statusConf.icon}</div>
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{webhook.name}</h3>
                      <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{webhook.url}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateWebhook(webhook.id, { enabled: !webhook.enabled })}
                      className="px-2 py-1 rounded text-xs"
                      style={{ background: webhook.enabled ? '#10b98122' : 'var(--bg-tertiary)', color: webhook.enabled ? '#10b981' : 'var(--text-muted)' }}
                    >{webhook.enabled ? 'ON' : 'OFF'}</button>
                    <button onClick={() => testWebhook(webhook.id)} className="p-1.5 rounded" style={{ color: 'var(--text-secondary)' }} title="Test"><Send className="w-4 h-4" /></button>
                    <button onClick={() => setExpandedId(isExpanded ? null : webhook.id)} className="p-1.5 rounded" style={{ color: 'var(--text-secondary)' }} title="Details">
                      {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteWebhook(webhook.id)} className="p-1.5 rounded hover:text-red-400" style={{ color: 'var(--text-muted)' }} title="Delete"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="pt-3">
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Secret: </span>
                      <code className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>
                        {isSecretVisible ? webhook.secret : '••••••••'}
                      </code>
                      <button onClick={() => setShowSecret(prev => ({ ...prev, [webhook.id]: !prev[webhook.id] }))} className="ml-2 text-xs underline" style={{ color: 'var(--text-muted)' }}>
                        {isSecretVisible ? 'hide' : 'show'}
                      </button>
                    </div>
                    <div>
                      <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Events: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {webhook.events.map(event => (
                          <span key={event} className="px-1.5 py-0.5 rounded text-xs" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{event}</span>
                        ))}
                      </div>
                    </div>
                    {webhook.lastTriggered && (
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}</div>
                    )}
                    {webhook.errorMessage && (
                      <div className="text-xs" style={{ color: '#ef4444' }}>Error: {webhook.errorMessage}</div>
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

export default WebhooksPanel;
