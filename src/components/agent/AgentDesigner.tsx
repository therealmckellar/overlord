'use client';

import React, { useState, useCallback } from 'react';
import { useAgentStore, type AgentPreset } from '@/stores/agentStore';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import { Save, Rocket, Trash2, Play, FileCode } from 'lucide-react';

const AVAILABLE_TOOLS = [
  { id: 'web_search', label: 'Web Search' },
  { id: 'file_read', label: 'File Read' },
  { id: 'file_write', label: 'File Write' },
  { id: 'terminal', label: 'Terminal' },
  { id: 'browser', label: 'Browser Automation' },
  { id: 'image_gen', label: 'Image Generation' },
  { id: 'tts', label: 'Text to Speech' },
];

const ROLES = ['Researcher', 'Executor', 'Analyst', 'Writer', 'Coder', 'Specialist'] as const;
const OUTPUT_FORMATS = ['markdown', 'json', 'html', 'plain'] as const;

export function AgentDesigner() {
  const presets = useAgentStore((s) => s.presets);
  const savePreset = useAgentStore((s) => s.savePreset);
  const loadPreset = useAgentStore((s) => s.loadPreset);
  const deletePreset = useAgentStore((s) => s.deletePreset);
  const deployAgent = useAgentStore((s) => s.deployAgent);

  const [name, setName] = useState('');
  const [role, setRole] = useState('Researcher');
  const [model, setModel] = useState(UNIQUE_MODELS[0]?.value || 'google/gemma-4-31b-it:free');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant specialized in {{role}}. Your task is to {{task}}.');
  const [tools, setTools] = useState<string[]>(['web_search', 'file_read']);
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);
  const [deployStatus, setDeployStatus] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);

  const toggleTool = useCallback((toolId: string) => {
    setTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!name.trim()) return;
    const preset: AgentPreset = {
      id: Math.random().toString(36).substr(2, 9),
      name: name.trim() || `${role} Agent`,
      config: { name: name.trim(), role, model, systemPrompt, tools, outputFormat, temperature, maxTokens },
      createdAt: Date.now(),
    };
    savePreset(preset);
  }, [name, role, model, systemPrompt, tools, outputFormat, temperature, maxTokens, savePreset]);

  const handleLoadPreset = useCallback((id: string) => {
    const preset = loadPreset(id);
    if (preset) {
      setName(preset.config.name);
      setRole(preset.config.role);
      setModel(preset.config.model);
      setSystemPrompt(preset.config.systemPrompt);
      setTools(preset.config.tools);
      setOutputFormat(preset.config.outputFormat);
      setTemperature(preset.config.temperature);
      setMaxTokens(preset.config.maxTokens);
      setShowPresets(false);
    }
  }, [loadPreset]);

  const handleDeploy = useCallback(async () => {
    setDeployStatus('deploying');
    try {
      const jobId = await deployAgent({ name: name.trim() || `${role} Agent`, role, model, systemPrompt, tools, outputFormat, temperature, maxTokens });
      setDeployStatus(`deployed:${jobId}`);
      setTimeout(() => setDeployStatus(null), 5000);
    } catch {
      setDeployStatus('error');
      setTimeout(() => setDeployStatus(null), 3000);
    }
  }, [name, role, model, systemPrompt, tools, outputFormat, temperature, maxTokens, deployAgent]);

  const compiledPrompt = systemPrompt
    .replace(/\{\{role\}\}/g, role)
    .replace(/\{\{task\}\}/g, '[Your task will appear here]');

  return (
    <div className="absolute inset-0 z-10 flex bg-[var(--bg)] overflow-hidden">
      {/* Left: Configuration Form */}
      <div className="w-1/2 border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[var(--accent)]" />
            Agent Designer
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresets(!showPresets)}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              Presets ({presets.length})
            </button>
            <button
              onClick={handleSavePreset}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors flex items-center gap-1"
            >
              <Save className="w-3 h-3" /> Save
            </button>
            <button
              onClick={handleDeploy}
              disabled={deployStatus === 'deploying'}
              className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
            >
              <Rocket className="w-3 h-3" /> Deploy
            </button>
          </div>
        </div>

        {/* Presets dropdown */}
        {showPresets && presets.length > 0 && (
          <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {presets.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-1 px-2 rounded hover:bg-[var(--bg-tertiary)]">
                  <button
                    onClick={() => handleLoadPreset(p.id)}
                    className="text-xs text-[var(--text)] hover:text-[var(--accent)] text-left flex-1"
                  >
                    {p.name}
                  </button>
                  <button
                    onClick={() => deletePreset(p.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deploy status */}
        {deployStatus && (
          <div className={`px-6 py-2 text-xs border-b border-[var(--border)] ${
            deployStatus.startsWith('deployed') ? 'text-[var(--success)] bg-[var(--success)]/5' : deployStatus === 'error' ? 'text-red-400 bg-red-500/5' : 'text-[var(--accent)] bg-[var(--accent)]/5'
          }`}>
            {deployStatus.startsWith('deployed') ? '✓ Agent deployed successfully!' : deployStatus === 'error' ? '✗ Deployment failed' : 'Deploying agent...'}
          </div>
        )}

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. SEO Researcher, Cold Email Writer"
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder:text-[var(--text-muted)]/50"
            />
          </div>

          {/* Role + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {UNIQUE_MODELS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">System Prompt</label>
            <textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={6}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Use {'{{role}}'} and {'{{task}}'} as placeholders</p>
          </div>

          {/* Tools */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <label
                  key={tool.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${
                    tools.includes(tool.id)
                      ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                      : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tools.includes(tool.id)}
                    onChange={() => toggleTool(tool.id)}
                    className="sr-only"
                  />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                    tools.includes(tool.id) ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'
                  }`}>
                    {tools.includes(tool.id) && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[var(--text)]">{tool.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Output Format + Temperature + Max Tokens */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Output</label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              >
                {OUTPUT_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Temp: {temperature.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full mt-2 accent-[var(--accent)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Max Tokens</label>
              <input
                type="number"
                min="1000"
                max="100000"
                step="1000"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)}
                className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview Panel */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Play className="w-4 h-4 text-[var(--accent)]" />
            Compiled Prompt Preview
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">System Prompt</h4>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">
                {compiledPrompt}
              </pre>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">Configuration JSON</h4>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">
{JSON.stringify({
  name: name || `${role} Agent`,
  role,
  model,
  tools,
  outputFormat,
  temperature,
                  maxTokens,
                }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
