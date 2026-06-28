'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Settings, Search, RefreshCw, Save, ChevronDown, ChevronRight, RotateCcw } from 'lucide-react';

interface ConfigField {
  key: string;
  type: string;
  default: unknown;
  description: string;
  category: string;
  sensitive?: boolean;
  options?: string[];
}

interface ConfigSchema {
  fields: Record<string, ConfigField>;
  category_order: string[];
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  general: <Settings className="w-4 h-4" />,
  agent: <span>🤖</span>,
  terminal: <span>💻</span>,
  display: <span>🎨</span>,
  delegation: <span>👥</span>,
  memory: <span>🧠</span>,
  compression: <span>📦</span>,
  security: <span>🔐</span>,
  browser: <span>🌐</span>,
  voice: <span>🎙️</span>,
  tts: <span>🔊</span>,
  stt: <span>👂</span>,
  logging: <span>📋</span>,
  discord: <span>💬</span>,
  auxiliary: <span>🔧</span>,
  kanban: <span>📊</span>,
  model_catalog: <span>📖</span>,
  openrouter: <span>🔀</span>,
  sessions: <span>📜</span>,
  tool_loop_guardrails: <span>🛡️</span>,
  tool_output: <span>📄</span>,
  updates: <span>🔄</span>,
  curator: <span>✨</span>,
};

export function ConfigEditorPanel() {
  const [config, setConfig] = useState<Record<string, unknown>>({});
  const [schema, setSchema] = useState<ConfigSchema | null>(null);
  const [defaults, setDefaults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [dirty, setDirty] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [configRes, schemaRes, defaultsRes] = await Promise.all([
        fetch('/api/config'),
        fetch('/api/config/schema'),
        fetch('/api/config/defaults'),
      ]);
      if (configRes.ok) setConfig(await configRes.json());
      if (schemaRes.ok) setSchema(await schemaRes.json());
      if (defaultsRes.ok) setDefaults(await defaultsRes.json());
    } catch (e) {
      setError('Failed to load config — Hermes daemon may not be running');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (schema) {
      const initial: Record<string, boolean> = {};
      for (const cat of schema.category_order) {
        initial[cat] = cat === 'general' || cat === 'agent';
      }
      setExpandedCategories(initial);
    }
  }, [schema]);

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const getValue = (key: string): unknown => {
    if (key in dirty) return dirty[key];
    return getNested(config, key);
  };

  const setValue = (key: string, value: unknown) => {
    setDirty(prev => ({ ...prev, [key]: value }));
  };

  const resetField = (key: string) => {
    setDirty(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetToDefault = (key: string) => {
    setValue(key, defaults[key] ?? '');
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: dirty }),
      });
      if (!res.ok) throw new Error('Save failed');
      setConfig(prev => ({ ...prev, ...dirty }));
      setDirty({});
    } catch (e) {
      setError('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const getNested = (obj: Record<string, unknown>, path: string): unknown => {
    const parts = path.split('.');
    let current: unknown = obj;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in (current as Record<string, unknown>)) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
    return current;
  };

  const isDirty = Object.keys(dirty).length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-secondary)' }}>
        <RefreshCw className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="p-6" style={{ color: 'var(--text-secondary)' }}>
        <p>Config schema unavailable — Hermes API not reachable.</p>
        <p className="text-sm mt-2 opacity-60">Ensure the Hermes gateway is running with the API server enabled.</p>
      </div>
    );
  }

  // Group fields by category
  const categoryFields: Record<string, [string, ConfigField][]> = {};
  for (const [key, field] of Object.entries(schema.fields)) {
    if (!categoryFields[field.category]) categoryFields[field.category] = [];
    categoryFields[field.category].push([key, field]);
  }

  // Filter by search
  const filteredCategories = schema.category_order.filter(cat => {
    if (!categoryFields[cat]) return false;
    if (!search) return true;
    return categoryFields[cat].some(([key, field]) =>
      key.toLowerCase().includes(search.toLowerCase()) ||
      field.description.toLowerCase().includes(search.toLowerCase())
    );
  });

  const renderField = (key: string, field: ConfigField) => {
    const value = getValue(key);
    const isChanged = key in dirty;
    const isSensitive = field.sensitive || key.toLowerCase().includes('key') || key.toLowerCase().includes('token') || key.toLowerCase().includes('secret');
    const displayValue = isSensitive && typeof value === 'string' && value.length > 0 ? '••••••••' : String(value ?? '');

    if (field.type === 'boolean') {
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setValue(key, e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{String(value)}</span>
        </label>
      );
    }

    if (field.options && field.options.length > 0) {
      return (
        <select
          value={String(value ?? '')}
          onChange={(e) => setValue(key, e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      );
    }

    if (field.type === 'number' || field.type === 'integer') {
      return (
        <input
          type="number"
          value={String(value ?? 0)}
          onChange={(e) => setValue(key, field.type === 'integer' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0)}
          className="w-full px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
      );
    }

    return (
      <input
        type={isSensitive ? 'password' : 'text'}
        value={isSensitive ? (value as string || '') : displayValue}
        onChange={(e) => setValue(key, e.target.value)}
        placeholder={String(field.default ?? '')}
        className="w-full px-3 py-1.5 rounded-lg text-sm border font-mono"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', borderColor: isChanged ? 'var(--accent)' : 'var(--border)' }}
      />
    );
  };

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Config Editor</h2>
          {isDirty && (
            <span className="px-2 py-0.5 text-xs rounded-full" style={{ background: 'var(--accent)', color: 'white' }}>
              {Object.keys(dirty).length} unsaved
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setLoading(true); fetchData(); }}
            className="p-2 rounded-lg"
            style={{ background: 'var(--bg-tertiary)' }}
            aria-label="Refresh config"
          >
            <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          </button>
          {isDirty && (
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'white' }}
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search config keys..."
          className="w-full pl-9 pr-3 py-2 rounded-lg text-sm border"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef4444' }}>
          {error}
        </div>
      )}

      {/* Category sections */}
      <div className="space-y-2">
        {filteredCategories.map(category => {
          const fields = categoryFields[category] || [];
          const filteredFields = search
            ? fields.filter(([key, field]) =>
                key.toLowerCase().includes(search.toLowerCase()) ||
                field.description.toLowerCase().includes(search.toLowerCase())
              )
            : fields;
          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className="rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {CATEGORY_ICONS[category] || <Settings className="w-4 h-4" />}
                  <span className="font-medium text-sm capitalize" style={{ color: 'var(--text-primary)' }}>{category.replace(/_/g, ' ')}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>{filteredFields.length}</span>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4" style={{ color: 'var(--text-muted)' }} /> : <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3">
                  {filteredFields.map(([key, field]) => {
                    const isChanged = key in dirty;
                    return (
                      <div key={key} className="flex items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <code className="text-xs font-mono" style={{ color: isChanged ? 'var(--accent)' : 'var(--text-primary)' }}>{key}</code>
                            {isChanged && (
                              <button onClick={() => resetField(key)} className="text-xs underline" style={{ color: 'var(--text-muted)' }}>revert</button>
                            )}
                          </div>
                          <p className="text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>{field.description}</p>
                          {renderField(key, field)}
                        </div>
                        <button
                          onClick={() => resetToDefault(key)}
                          className="mt-5 p-1 rounded" style={{ color: 'var(--text-muted)' }}
                          title="Reset to default"
                        >
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ConfigEditorPanel;
