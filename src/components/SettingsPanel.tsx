'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useConnectorStore, type APIKey, type MCPServer, type WebhookEndpoint } from '@/stores/connectorStore';
import { THEME_LIST, THEME_LABELS, getThemeCSSVars } from '@/utils/themes';
import type { ThemeName } from '@/types';

const STATUS_DOT: Record<string, string> = {
  connected: '#10b981',
  disconnected: '#6b7280',
  error: '#ef4444',
  testing: '#f59e0b',
};

type SettingsSection = 'apiKeys' | 'mcp' | 'webhooks' | 'models' | 'notifications' | 'security' | 'system';

const SECTION_ICONS: Record<SettingsSection, string> = {
  apiKeys: '🔑',
  mcp: '🔌',
  webhooks: '🪝',
  models: '🧠',
  notifications: '🔔',
  security: '🛡️',
  system: '⚙️',
};

const SECTION_DESCS: Record<SettingsSection, string> = {
  apiKeys: 'LLM provider credentials & API keys',
  mcp: 'Model Context Protocol servers & tool connectors',
  webhooks: 'Event-driven HTTP endpoints for automations',
  models: 'Default model, temperature & token settings',
  notifications: 'Desktop alerts, sounds & daily digest schedule',
  security: 'Access control, session timeout & lockdown',
  system: 'Agent limits, logging, compaction & debug',
};

export default function SettingsPanel() {
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const addToast = useUIStore((s) => s.addToast);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const availableModels = useUIStore((s) => s.availableModels);
  const setAvailableModels = useUIStore((s) => s.setAvailableModels);
  const reasoningEffort = useUIStore((s) => s.reasoningEffort);
  const setReasoningEffort = useUIStore((s) => s.setReasoningEffort);

  const apiKeys = useConnectorStore((s) => s.apiKeys);
  const mcpServers = useConnectorStore((s) => s.mcpServers);
  const webhooks = useConnectorStore((s) => s.webhooks);
  const modelDefaults = useConnectorStore((s) => s.modelDefaults);
  const notifications = useConnectorStore((s) => s.notifications);
  const security = useConnectorStore((s) => s.security);
  const system = useConnectorStore((s) => s.system);
  const addAPIKey = useConnectorStore((s) => s.addAPIKey);
  const updateAPIKey = useConnectorStore((s) => s.updateAPIKey);
  const deleteAPIKey = useConnectorStore((s) => s.deleteAPIKey);
  const testAPIKey = useConnectorStore((s) => s.testAPIKey);
  const addMCPServer = useConnectorStore((s) => s.addMCPServer);
  const updateMCPServer = useConnectorStore((s) => s.updateMCPServer);
  const deleteMCPServer = useConnectorStore((s) => s.deleteMCPServer);
  const testMCPServer = useConnectorStore((s) => s.testMCPServer);
  const addWebhook = useConnectorStore((s) => s.addWebhook);
  const updateWebhook = useConnectorStore((s) => s.updateWebhook);
  const deleteWebhook = useConnectorStore((s) => s.deleteWebhook);
  const testWebhook = useConnectorStore((s) => s.testWebhook);
  const updateModelDefaults = useConnectorStore((s) => s.updateModelDefaults);
  const updateNotifications = useConnectorStore((s) => s.updateNotifications);
  const updateSecurity = useConnectorStore((s) => s.updateSecurity);
  const updateSystem = useConnectorStore((s) => s.updateSystem);

  const [activeSection, setActiveSection] = useState<SettingsSection>('apiKeys');
  const [showAddKey, setShowAddKey] = useState(false);
  const [showAddMCP, setShowAddMCP] = useState(false);
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  // API Key form
  const [keyName, setKeyName] = useState('');
  const [keyService, setKeyService] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [keyBaseUrl, setKeyBaseUrl] = useState('');
  const [keyModel, setKeyModel] = useState('');

  // MCP form
  const [mcpName, setMcpName] = useState('');
  const [mcpUrl, setMcpUrl] = useState('');
  const [mcpTransport, setMcpTransport] = useState<'stdio' | 'sse' | 'http'>('http');
  const [mcpDesc, setMcpDesc] = useState('');
  const [mcpApiKey, setMcpApiKey] = useState('');

  // Webhook form
  const [whName, setWhName] = useState('');
  const [whUrl, setWhUrl] = useState('');
  const [whSecret, setWhSecret] = useState('');
  const [whEvents, setWhEvents] = useState<string[]>(['task.complete', 'task.failed']);

  const handleAddKey = () => {
    if (!keyName.trim() || !keyValue.trim()) return;
    addAPIKey({
      name: keyName,
      service: keyService || keyName.toLowerCase().replace(/\s+/g, '_'),
      key: keyValue,
      baseUrl: keyBaseUrl || undefined,
      model: keyModel || undefined,
      enabled: true,
    });
    setKeyName(''); setKeyService(''); setKeyValue(''); setKeyBaseUrl(''); setKeyModel('');
    setShowAddKey(false);
    addToast({ type: 'success', message: `API key "${keyName}" added`, duration: 3000 });
  };

  const handleAddMCP = () => {
    if (!mcpName.trim() || !mcpUrl.trim()) return;
    addMCPServer({
      name: mcpName,
      url: mcpUrl,
      transport: mcpTransport,
      description: mcpDesc || undefined,
      enabled: true,
      apiKey: mcpApiKey || undefined,
    });
    setMcpName(''); setMcpUrl(''); setMcpTransport('http'); setMcpDesc(''); setMcpApiKey('');
    setShowAddMCP(false);
    addToast({ type: 'success', message: `MCP server "${mcpName}" added`, duration: 3000 });
  };

  const handleAddWebhook = () => {
    if (!whName.trim() || !whUrl.trim()) return;
    addWebhook({
      name: whName,
      url: whUrl,
      secret: whSecret || '',
      events: whEvents,
      enabled: true,
    });
    setWhName(''); setWhUrl(''); setWhSecret(''); setWhEvents(['task.complete', 'task.failed']);
    setShowAddWebhook(false);
    addToast({ type: 'success', message: `Webhook "${whName}" added`, duration: 3000 });
  };

  const handleTestKey = async (id: string) => {
    const success = await testAPIKey(id);
    addToast({ type: success ? 'success' : 'error', message: success ? 'Connection successful' : 'Connection failed', duration: 3000 });
  };

  const handleTestMCP = async (id: string) => {
    const success = await testMCPServer(id);
    addToast({ type: success ? 'success' : 'error', message: success ? 'MCP server reachable' : 'MCP server unreachable', duration: 3000 });
  };

  const handleTestWebhook = async (id: string) => {
    const success = await testWebhook(id);
    addToast({ type: success ? 'success' : 'error', message: success ? 'Webhook ping sent successfully' : 'Webhook endpoint unreachable', duration: 3000 });
  };

  // Shared styles
  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid var(--border)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text)',
    fontSize: '13px',
    marginBottom: '8px',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    marginBottom: '4px',
    display: 'block',
  };

  const cardStyle: React.CSSProperties = {
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    marginBottom: '12px',
  };

  const sectionList: SettingsSection[] = ['apiKeys', 'mcp', 'webhooks', 'models', 'notifications', 'security', 'system'];

  const renderThemeSwitcher = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
      {THEME_LIST.filter((t) => t !== 'system').map((t) => {
        const vars = getThemeCSSVars(t);
        const isActive = theme === t;
        return (
          <button
            key={t}
            onClick={() => setTheme(t as ThemeName)}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: `2px solid ${isActive ? vars['--accent'] : vars['--border']}`,
              background: vars['--bg-secondary'],
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
          >
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: vars['--accent'] }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: vars['--bg'] }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: vars['--success'] }} />
              <div style={{ width: '16px', height: '16px', borderRadius: '4px', background: vars['--error'] }} />
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: vars['--text'], textTransform: 'capitalize' }}>
              {THEME_LABELS[t as ThemeName]}
            </div>
            {isActive && <div style={{ fontSize: '11px', color: vars['--accent'], marginTop: '4px' }}>✓ Active</div>}
          </button>
        );
      })}
    </div>
  );

  const renderToggle = (value: boolean, onChange: (v: boolean) => void, label: string) => (
    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text)', cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: '36px', height: '20px', borderRadius: '10px',
          background: value ? 'var(--accent)' : 'var(--bg-tertiary)',
          position: 'relative', transition: 'background 0.15s', cursor: 'pointer',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          background: '#fff', position: 'absolute', top: '1px',
          left: value ? '17px' : '1px',
          transition: 'left 0.15s',
        }} />
      </div>
      {label}
    </label>
  );

  const renderNumberInput = (value: number, onChange: (v: number) => void, label: string, min?: number, max?: number) => (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        style={{ ...inputStyle, marginBottom: 0 }}
      />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      {/* Settings Sidebar */}
      <div style={{
        width: '220px',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-secondary)',
        overflowY: 'auto',
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>⚙️ Settings</h2>
          <p style={{ margin: '4px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
            {apiKeys.length} keys · {mcpServers.length} MCP · {webhooks.length} hooks
          </p>
        </div>
        <nav style={{ flex: 1, padding: '8px' }}>
          {sectionList.map((s) => (
            <button
              key={s}
              onClick={() => setActiveSection(s)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '6px',
                border: 'none',
                background: activeSection === s ? 'var(--accent)' : 'transparent',
                color: activeSection === s ? '#fff' : 'var(--text)',
                fontSize: '12px',
                cursor: 'pointer',
                marginBottom: '2px',
                transition: 'background 0.15s',
              }}
            >
              <span style={{ marginRight: '8px' }}>{SECTION_ICONS[s]}</span>
              <span style={{ fontWeight: 600 }}>{s.charAt(0).toUpperCase() + s.slice(1)}</span>
              <div style={{ fontSize: '10px', color: activeSection === s ? 'rgba(255,255,255,0.7)' : 'var(--text-muted)', marginTop: '2px', paddingLeft: '24px' }}>
                {SECTION_DESCS[s]}
              </div>
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Theme: <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{theme}</span>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px', maxWidth: '720px' }}>

        {/* THEME (always shown at top) */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🎨 Theme</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            Select a dashboard theme. Changes apply immediately.
          </p>
          {renderThemeSwitcher()}
        </div>

        <div style={{ height: '1px', background: 'var(--border)', margin: '0 0 24px' }} />

        {/* API KEYS SECTION */}
        {activeSection === 'apiKeys' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🔑 API Keys</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Manage provider credentials for LLM and other services. Keys are stored in browser localStorage.
                </p>
              </div>
              <button onClick={() => setShowAddKey(true)} style={btnStyle}>+ Add Key</button>
            </div>

            {showAddKey && (
              <div style={formCardStyle}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Add New API Key</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input style={inputStyle} value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="Name (e.g. OpenRouter)" />
                  <input style={inputStyle} value={keyService} onChange={(e) => setKeyService(e.target.value)} placeholder="Service ID (e.g. openrouter)" />
                  <input style={{ ...inputStyle, gridColumn: '1 / -1' }} value={keyValue} onChange={(e) => setKeyValue(e.target.value)} placeholder="API Key" type="password" />
                  <input style={inputStyle} value={keyBaseUrl} onChange={(e) => setKeyBaseUrl(e.target.value)} placeholder="Base URL (optional)" />
                  <input style={inputStyle} value={keyModel} onChange={(e) => setKeyModel(e.target.value)} placeholder="Default model (optional)" />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <button onClick={handleAddKey} style={btnSmallStyle}>Save</button>
                  <button onClick={() => setShowAddKey(false)} style={{ ...btnSmallStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </div>
            )}

            {apiKeys.length === 0 ? (
              <div style={emptyStateStyle}>No API keys configured. Click "Add Key" to add your first provider credential.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {apiKeys.map((key) => (
                  <APIKeyCard apiKey={key} onUpdate={(u) => updateAPIKey(key.id, u)} onDelete={() => { deleteAPIKey(key.id); addToast({ type: 'info', message: `"${key.name}" deleted`, duration: 2000 }); }} onTest={() => handleTestKey(key.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MCP SERVERS SECTION */}
        {activeSection === 'mcp' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🔌 MCP Servers</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Connect external tool servers via Model Context Protocol for extended agent capabilities.
                </p>
              </div>
              <button onClick={() => setShowAddMCP(true)} style={btnStyle}>+ Add Server</button>
            </div>

            {showAddMCP && (
              <div style={formCardStyle}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Add MCP Server</div>
                <input style={inputStyle} value={mcpName} onChange={(e) => setMcpName(e.target.value)} placeholder="Server name (e.g. Browser Rendering)" />
                <input style={inputStyle} value={mcpUrl} onChange={(e) => setMcpUrl(e.target.value)} placeholder="Server URL (e.g. http://localhost:3001/mcp)" />
                <select value={mcpTransport} onChange={(e) => setMcpTransport(e.target.value as 'stdio' | 'sse' | 'http')} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="http">HTTP</option>
                  <option value="sse">SSE</option>
                  <option value="stdio">stdio</option>
                </select>
                <input style={inputStyle} value={mcpApiKey} onChange={(e) => setMcpApiKey(e.target.value)} placeholder="API Key (optional)" type="password" />
                <input style={inputStyle} value={mcpDesc} onChange={(e) => setMcpDesc(e.target.value)} placeholder="Description (optional)" />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddMCP} style={btnSmallStyle}>Save</button>
                  <button onClick={() => setShowAddMCP(false)} style={{ ...btnSmallStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </div>
            )}

            {mcpServers.length === 0 ? (
              <div style={emptyStateStyle}>No MCP servers configured. Click "Add Server" to connect external tools.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {mcpServers.map((server) => (
                  <MCPCard server={server} onUpdate={(u) => updateMCPServer(server.id, u)} onDelete={() => { deleteMCPServer(server.id); addToast({ type: 'info', message: `"${server.name}" removed`, duration: 2000 }); }} onTest={() => handleTestMCP(server.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* WEBHOOKS SECTION */}
        {activeSection === 'webhooks' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🪝 Webhooks</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Send HTTP notifications to external systems when events occur. Useful for Zapier, n8n, or custom automations.
                </p>
              </div>
              <button onClick={() => setShowAddWebhook(true)} style={btnStyle}>+ Add Webhook</button>
            </div>

            {showAddWebhook && (
              <div style={formCardStyle}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Add Webhook Endpoint</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <input style={inputStyle} value={whName} onChange={(e) => setWhName(e.target.value)} placeholder="Name (e.g. Slack notifications)" />
                  <input style={inputStyle} value={whUrl} onChange={(e) => setWhUrl(e.target.value)} placeholder="Endpoint URL" />
                  <input style={{ ...inputStyle, gridColumn: '1 / -1' }} value={whSecret} onChange={(e) => setWhSecret(e.target.value)} placeholder="Signing secret (optional)" type="password" />
                </div>
                <div>
                  <label style={labelStyle}>Events to trigger</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {['task.complete', 'task.failed', 'agent.error', 'deploy.success', 'deploy.failed', 'agent.spawned', 'loop.complete'].map((evt) => (
                      <label key={evt} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: whEvents.includes(evt) ? 'var(--accent)' : 'var(--bg-tertiary)', color: whEvents.includes(evt) ? '#fff' : 'var(--text-secondary)', cursor: 'pointer' }}>
                        <input type="checkbox" checked={whEvents.includes(evt)} onChange={() => setWhEvents(whEvents.includes(evt) ? whEvents.filter(e => e !== evt) : [...whEvents, evt])} style={{ display: 'none' }} />
                        {evt}
                      </label>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleAddWebhook} style={btnSmallStyle}>Save</button>
                  <button onClick={() => setShowAddWebhook(false)} style={{ ...btnSmallStyle, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>Cancel</button>
                </div>
              </div>
            )}

            {webhooks.length === 0 ? (
              <div style={emptyStateStyle}>
                No webhooks configured. Click "Add Webhook" to send event notifications to external systems.
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--bg-tertiary)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <strong style={{ color: 'var(--text)' }}>Quick-connect integrations:</strong>
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Zapier', 'n8n', 'Make', 'Slack', 'Discord'].map(p => (
                      <span key={p} style={{ padding: '4px 10px', borderRadius: '4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer' }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {webhooks.map((wh) => (
                  <WebhookCard webhook={wh} onUpdate={(u) => updateWebhook(wh.id, u)} onDelete={() => { deleteWebhook(wh.id); addToast({ type: 'info', message: `"${wh.name}" removed`, duration: 2000 }); }} onTest={() => handleTestWebhook(wh.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* MODEL DEFAULTS SECTION */}
        {activeSection === 'models' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🧠 Model Configuration</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Set default model parameters for agent operations. These apply unless overridden per-task.
            </p>

            <div style={cardStyle}>
              <label style={labelStyle}>Default Model</label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <label style={{ ...labelStyle, marginTop: '16px' }}>Fallback Model</label>
              <select
                value={modelDefaults.fallbackModel}
                onChange={(e) => updateModelDefaults({ fallbackModel: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {availableModels.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>

              <label style={{ ...labelStyle, marginTop: '16px' }}>Reasoning Effort</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setReasoningEffort(level)}
                    style={{
                      flex: 1, padding: '8px', borderRadius: '6px',
                      border: `1px solid ${reasoningEffort === level ? 'var(--accent)' : 'var(--border)'}`,
                      background: reasoningEffort === level ? 'var(--accent)' : 'transparent',
                      color: reasoningEffort === level ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600, textTransform: 'capitalize',
                    }}
                  >
                    {level}
                  </button>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                {renderNumberInput(modelDefaults.defaultTemperature, (v) => updateModelDefaults({ defaultTemperature: v }), 'Temperature', 0, 2)}
                {renderNumberInput(modelDefaults.defaultMaxTokens, (v) => updateModelDefaults({ defaultMaxTokens: v }), 'Max Tokens', 1, 128000)}
              </div>

              <div style={{ marginTop: '16px' }}>
                {renderToggle(modelDefaults.autoSelectModel, (v) => updateModelDefaults({ autoSelectModel: v }), 'Auto-select best available model per task')}
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS SECTION */}
        {activeSection === 'notifications' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🔔 Notifications</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Control when and how Overlord sends alerts to you.
            </p>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>General</div>
              {renderToggle(notifications.desktopEnabled, (v) => updateNotifications({ desktopEnabled: v }), 'Desktop notifications')}
              {renderToggle(notifications.soundEnabled, (v) => updateNotifications({ soundEnabled: v }), 'Sound alerts')}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Task Events</div>
              {renderToggle(notifications.taskComplete, (v) => updateNotifications({ taskComplete: v }), 'Task completed successfully')}
              {renderToggle(notifications.taskFailed, (v) => updateNotifications({ taskFailed: v }), 'Task failed / error')}
              {renderToggle(notifications.agentError, (v) => updateNotifications({ agentError: v }), 'Agent runtime error')}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Deploy Events</div>
              {renderToggle(notifications.deploySuccess, (v) => updateNotifications({ deploySuccess: v }), 'Deployment successful')}
              {renderToggle(notifications.deployFailed, (v) => updateNotifications({ deployFailed: v }), 'Deployment failed')}
            </div>

            <div style={cardStyle}>
              <label style={labelStyle}>Daily Digest Time</label>
              <input
                type="time"
                value={notifications.dailyDigestTime}
                onChange={(e) => updateNotifications({ dailyDigestTime: e.target.value })}
                style={{ ...inputStyle, marginBottom: 0 }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Receive a daily summary of agent activity at this time (24h format).
              </div>
            </div>
          </div>
        )}

        {/* SECURITY SECTION */}
        {activeSection === 'security' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>🛡️ Security</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Manage access control and protect your Overlord instance.
            </p>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Access Control</div>
              {renderToggle(security.lockdownMode, (v) => updateSecurity({ lockdownMode: v }), '🔒 Lockdown Mode (block all external requests)')}
              {renderToggle(security.allowLocalhostOnly, (v) => updateSecurity({ allowLocalhostOnly: v }), 'Allow localhost connections only')}
              <div style={{ marginTop: '12px' }}>
                {renderNumberInput(security.sessionTimeout, (v) => updateSecurity({ sessionTimeout: v }), 'Session timeout (minutes)', 5, 480)}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Two-Factor Auth</div>
              {renderToggle(security.twoFactorEnabled, (v) => updateSecurity({ twoFactorEnabled: v }), 'Require 2FA for login')}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
                When enabled, 2FA is required on every login attempt. Recovery codes are generated once.
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>IP Whitelist</div>
              <label style={labelStyle}>Allowed IP addresses (one per line)</label>
              <textarea
                value={security.ipWhitelist.join('\n')}
                onChange={(e) => updateSecurity({ ipWhitelist: e.target.value.split('\n').filter(Boolean) })}
                placeholder="127.0.0.1&#10;192.168.1.0/24"
                rows={3}
                style={{ ...inputStyle, marginBottom: 0, resize: 'vertical', fontFamily: 'monospace', fontSize: '12px' }}
              />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Leave empty to allow all IPs. CIDR notation supported.
              </div>
            </div>
          </div>
        )}

        {/* SYSTEM SECTION */}
        {activeSection === 'system' && (
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>⚙️ System</h3>
            <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Configure system behavior for optimal agent operations.
            </p>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Agent Limits</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {renderNumberInput(system.maxConcurrentAgents, (v) => updateSystem({ maxConcurrentAgents: v }), 'Max concurrent agents', 1, 10)}
                {renderNumberInput(system.maxLoopIterations, (v) => updateSystem({ maxLoopIterations: v }), 'Max loop iterations', 1, 500)}
              </div>
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Data & Logging</div>
              {renderNumberInput(system.logRetentionDays, (v) => updateSystem({ logRetentionDays: v }), 'Log retention (days)', 1, 365)}
              {renderNumberInput(system.autoSaveInterval, (v) => updateSystem({ autoSaveInterval: v }), 'Auto-save interval (seconds)', 5, 300)}
            </div>

            <div style={cardStyle}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>Performance</div>
              {renderToggle(system.compactionEnabled, (v) => updateSystem({ compactionEnabled: v }), 'Enable context compaction (recommended for long sessions)')}
              {renderToggle(system.debugMode, (v) => updateSystem({ debugMode: v }), 'Debug mode (verbose logging)')}
            </div>

            <div style={{ ...cardStyle, border: '1px solid var(--accent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>Export Configuration</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Download all settings as JSON backup</div>
                </div>
                <button
                  onClick={() => {
                    const config = {
                      apiKeys: apiKeys.map(k => ({ ...k, key: '***REDACTED***' })),
                      mcpServers: mcpServers.map(s => ({ ...s, apiKey: s.apiKey ? '***' : undefined })),
                      webhooks: webhooks.map(w => ({ ...w, secret: '***' })),
                      modelDefaults, notifications, security, system, theme,
                    };
                    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'overlord-config.json'; a.click();
                    URL.revokeObjectURL(url);
                    addToast({ type: 'success', message: 'Configuration exported', duration: 2000 });
                  }}
                  style={{ ...btnSmallStyle, background: 'var(--accent)' }}
                >
                  📥 Export
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Button Styles ─── */
const btnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnSmallStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: '6px',
  border: 'none',
  background: 'var(--accent)',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
};

const formCardStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: '8px',
  border: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
  marginBottom: '20px',
};

const emptyStateStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '40px',
  color: 'var(--text-muted)',
  fontSize: '14px',
  border: '1px dashed var(--border)',
  borderRadius: '10px',
};

/* ─── API Key Card ─── */
function APIKeyCard({ apiKey, onUpdate, onDelete, onTest }: {
  apiKey: APIKey;
  onUpdate: (updates: Partial<APIKey>) => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const dotColor = STATUS_DOT[apiKey.status] || '#6b7280';
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '8px',
      border: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{apiKey.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {apiKey.service} {apiKey.model && `· ${apiKey.model}`}
          </div>
        </div>
        <code style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '3px 8px', borderRadius: '4px', flexShrink: 0 }}>
          {apiKey.key ? `${apiKey.key.slice(0, 8)}…${apiKey.key.slice(-4)}` : '—'}
        </code>
        {renderConnectToggle(apiKey.enabled, (v) => onUpdate({ enabled: v }))}
        <button onClick={onTest} style={pillBtnStyle}>Test</button>
        <button onClick={onDelete} style={{ ...pillBtnStyle, borderColor: 'var(--error)', color: 'var(--error)' }}>Delete</button>
      </div>
      {apiKey.errorMessage && (
        <div style={{ fontSize: '11px', color: 'var(--error)', marginTop: '6px', paddingLeft: '18px' }}>{apiKey.errorMessage}</div>
      )}
    </div>
  );
}

/* ─── MCP Server Card ─── */
function MCPCard({ server, onUpdate, onDelete, onTest }: {
  server: MCPServer;
  onUpdate: (updates: Partial<MCPServer>) => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const dotColor = STATUS_DOT[server.status] || '#6b7280';
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '8px',
      border: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{server.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {server.transport.toUpperCase()} · {server.url}
          </div>
        </div>
        {renderConnectToggle(server.enabled, (v) => onUpdate({ enabled: v }))}
        <button onClick={onTest} style={pillBtnStyle}>Test</button>
        <button onClick={onDelete} style={{ ...pillBtnStyle, borderColor: 'var(--error)', color: 'var(--error)' }}>Delete</button>
      </div>
      {server.description && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '18px' }}>{server.description}</div>
      )}
    </div>
  );
}

/* ─── Webhook Card ─── */
function WebhookCard({ webhook, onUpdate, onDelete, onTest }: {
  webhook: WebhookEndpoint;
  onUpdate: (updates: Partial<WebhookEndpoint>) => void;
  onDelete: () => void;
  onTest: () => void;
}) {
  const dotColor = STATUS_DOT[webhook.status] || '#6b7280';
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '8px',
      border: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>{webhook.name}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>{webhook.url}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {webhook.events.slice(0, 4).map((evt) => (
              <span key={evt} style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{evt}</span>
            ))}
            {webhook.events.length > 4 && (
              <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '3px', background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>+{webhook.events.length - 4} more</span>
            )}
          </div>
        </div>
        {renderConnectToggle(webhook.enabled, (v) => onUpdate({ enabled: v }))}
        <button onClick={onTest} style={pillBtnStyle}>Ping</button>
        <button onClick={onDelete} style={{ ...pillBtnStyle, borderColor: 'var(--error)', color: 'var(--error)' }}>Delete</button>
      </div>
      {webhook.lastTriggered && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px', paddingLeft: '18px' }}>
          Last triggered: {new Date(webhook.lastTriggered).toLocaleString()}
        </div>
      )}
    </div>
  );
}

/* ─── Tiny Shared Components ─── */
const pillBtnStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '4px',
  border: '1px solid var(--border)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: '11px',
  cursor: 'pointer',
  flexShrink: 0,
};

function renderConnectToggle(value: boolean, onChange: (v: boolean) => void) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', cursor: 'pointer', flexShrink: 0 }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: '30px', height: '16px', borderRadius: '8px',
          background: value ? 'var(--accent)' : 'var(--bg-tertiary)',
          position: 'relative', transition: 'background 0.15s', cursor: 'pointer',
          border: '1px solid var(--border)', flexShrink: 0,
        }}
      >
        <div style={{
          width: '14px', height: '14px', borderRadius: '50%',
          background: '#fff', position: 'absolute', top: '0px',
          left: value ? '14px' : '0px',
          transition: 'left 0.15s',
        }} />
      </div>
      On
    </label>
  );
}
