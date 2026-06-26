'use client';

import React, { useState, useCallback } from 'react';
import { usePromptStore, CATEGORY_LABELS, CATEGORY_COLORS, type PromptCategory, type PromptTemplate } from '@/stores/promptStore';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import { Save, Rocket, Trash2, Play, FileCode, BookOpen, MessageSquare, ArrowRight, Plus, Search, X } from 'lucide-react';

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

type DesignerTab = 'agent' | 'prompts';

export function AgentDesigner() {
  const [activeTab, setActiveTab] = useState<DesignerTab>('agent');

  return (
    <div className="absolute inset-0 z-10 flex bg-[var(--bg)] overflow-hidden">
      <div className="flex flex-col w-full overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <button
            onClick={() => setActiveTab('agent')}
            className={`px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'agent'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" /> Agent Designer
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`px-4 py-2.5 text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'prompts'
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" /> Prompt Library
          </button>
        </div>

        {/* Tab content */}
        {activeTab === 'agent' && <AgentDesignerForm />}
        {activeTab === 'prompts' && <PromptLibrary />}
      </div>
    </div>
  );
}

// ── Agent Designer Form (original, kept intact) ──────────────────────────

function AgentDesignerForm() {
  const presets = [] as any[];
  const [name, setName] = useState('');
  const [role, setRole] = useState('Researcher');
  const [model, setModel] = useState(UNIQUE_MODELS[0]?.value || 'google/gemma-4-31b-it:free');
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant specialized in {{role}}. Your task is to {{task}}.');
  const [tools, setTools] = useState<string[]>(['web_search', 'file_read']);
  const [outputFormat, setOutputFormat] = useState('markdown');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(8192);

  const toggleTool = useCallback((toolId: string) => {
    setTools((prev) =>
      prev.includes(toolId) ? prev.filter((t) => t !== toolId) : [...prev, toolId]
    );
  }, []);

  const compiledPrompt = systemPrompt
    .replace(/\{\{role\}\}/g, role)
    .replace(/\{\{task\}\}/g, '[Your task will appear here]');

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Configuration Form */}
      <div className="w-1/2 border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-secondary)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <FileCode className="w-4 h-4 text-[var(--accent)]" /> Agent Config
          </h2>
          <button className="px-3 py-1.5 text-xs rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity flex items-center gap-1">
            <Rocket className="w-3 h-3" /> Deploy
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Agent Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SEO Researcher, Cold Email Writer" className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] placeholder:text-[var(--text-muted)]/50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                {ROLES.map((r) => (<option key={r} value={r}>{r}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
              <select value={model} onChange={(e) => setModel(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                {UNIQUE_MODELS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">System Prompt</label>
            <textarea value={systemPrompt} onChange={(e) => setSystemPrompt(e.target.value)} rows={6} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none" />
            <p className="text-[10px] text-[var(--text-muted)] mt-1">Use {'{{role}}'} and {'{{task}}'} as placeholders</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Tools</label>
            <div className="grid grid-cols-2 gap-2">
              {AVAILABLE_TOOLS.map((tool) => (
                <label key={tool.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-colors ${tools.includes(tool.id) ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] bg-[var(--bg)] hover:border-[var(--accent)]/50'}`}>
                  <input type="checkbox" checked={tools.includes(tool.id)} onChange={() => toggleTool(tool.id)} className="sr-only" />
                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${tools.includes(tool.id) ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border)]'}`}>
                    {tools.includes(tool.id) && (<svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>)}
                  </div>
                  <span className="text-xs text-[var(--text)]">{tool.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Output</label>
              <select value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                {OUTPUT_FORMATS.map((f) => (<option key={f} value={f}>{f}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Temp: {temperature.toFixed(2)}</label>
              <input type="range" min="0" max="1" step="0.05" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} className="w-full mt-2 accent-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Max Tokens</label>
              <input type="number" min="1000" max="100000" step="1000" value={maxTokens} onChange={(e) => setMaxTokens(parseInt(e.target.value) || 8192)} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
            </div>
          </div>
        </div>
      </div>

      {/* Right: Preview Panel */}
      <div className="w-1/2 flex flex-col overflow-hidden">
        <div className="px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Play className="w-4 h-4 text-[var(--accent)]" /> Compiled Preview
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">System Prompt</h4>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">{compiledPrompt}</pre>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">Configuration JSON</h4>
            <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
              <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">
{JSON.stringify({ name: name || `${role} Agent`, role, model, tools, outputFormat, temperature, maxTokens }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Prompt Library ──────────────────────────────────────────────────────

function PromptLibrary() {
  const templates = usePromptStore((s) => s.getFilteredTemplates());
  const searchQuery = usePromptStore((s) => s.searchQuery);
  const selectedCategory = usePromptStore((s) => s.selectedCategory);
  const setSearchQuery = usePromptStore((s) => s.setSearchQuery);
  const setSelectedCategory = usePromptStore((s) => s.setSelectedCategory);
  const addTemplate = usePromptStore((s) => s.addTemplate);
  const deleteTemplate = usePromptStore((s) => s.deleteTemplate);
  const updateTemplate = usePromptStore((s) => s.updateTemplate);

  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewPrompt, setIsNewPrompt] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', description: '', category: 'research' as PromptCategory, content: '' });

  const categories: (PromptCategory | 'all')[] = ['all', 'research', 'writing', 'coding', 'sales', 'analysis', 'operations', 'creative'];

  const handleNewPrompt = () => {
    setIsNewPrompt(true);
    setIsEditing(true);
    setEditForm({ name: '', description: '', category: 'research', content: '' });
    setSelectedPrompt(null);
  };

  const handleSelectPrompt = (template: PromptTemplate) => {
    setSelectedPrompt(template);
    setIsEditing(false);
    setIsNewPrompt(false);
  };

  const handleEdit = () => {
    if (!selectedPrompt) return;
    setEditForm({
      name: selectedPrompt.name,
      description: selectedPrompt.description,
      category: selectedPrompt.category,
      content: selectedPrompt.content,
    });
    setIsEditing(true);
    setIsNewPrompt(false);
  };

  const handleSave = () => {
    if (isNewPrompt) {
      const newTemplate = addTemplate(editForm);
      setSelectedPrompt(newTemplate);
    } else if (selectedPrompt) {
      updateTemplate(selectedPrompt.id, editForm);
      setSelectedPrompt({ ...selectedPrompt, ...editForm });
    }
    setIsEditing(false);
    setIsNewPrompt(false);
  };

  const handleUseInChat = () => {
    // Navigate to chat panel with the prompt
    if (!selectedPrompt) return;
    // Store the prompt content for the chat to pick up
    sessionStorage.setItem('overlord-chat-prompt', selectedPrompt.content);
    // Dispatch custom event that ChatWindow can listen to
    window.dispatchEvent(new CustomEvent('overlord-use-prompt', { detail: selectedPrompt }));
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left: Template list */}
      <div className="w-1/3 border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-[var(--text)]">Templates</h3>
            <button onClick={handleNewPrompt} className="p-1 rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity" title="New prompt">
              <Plus className="w-3 h-3" />
            </button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts..."
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-[var(--bg)] border border-[var(--border)] rounded-md text-[var(--text)] placeholder:text-[var(--text-muted)]/50 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Category pills */}
          <div className="flex flex-wrap gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Template cards */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleSelectPrompt(template)}
              className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                selectedPrompt?.id === template.id
                  ? 'bg-[var(--accent)]/10 border border-[var(--accent)]/30'
                  : 'hover:bg-[var(--bg-tertiary)] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: CATEGORY_COLORS[template.category] }} />
                <span className="text-xs font-medium text-[var(--text)] truncate">{template.name}</span>
              </div>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5 line-clamp-1">{template.description}</p>
            </button>
          ))}
          {templates.length === 0 && (
            <p className="text-xs text-[var(--text-muted)] text-center py-4">No prompts found</p>
          )}
        </div>
      </div>

      {/* Right: Template detail / edit */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedPrompt || isEditing ? (
          <>
            <div className="px-4 py-2.5 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between">
              <h3 className="text-xs font-semibold text-[var(--text)]">
                {isEditing ? (isNewPrompt ? 'New Prompt' : 'Edit Prompt') : selectedPrompt?.name}
              </h3>
              <div className="flex items-center gap-2">
                {!isEditing && selectedPrompt && (
                  <>
                    <button onClick={handleUseInChat} className="px-2.5 py-1 text-[10px] rounded-md bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1" title="Use in Chat">
                      <MessageSquare className="w-3 h-3" /> Use in Chat
                    </button>
                    <button onClick={handleEdit} className="px-2.5 py-1 text-[10px] rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors" title="Edit">
                      Edit
                    </button>
                    {!selectedPrompt.isBuiltIn && (
                      <button onClick={() => { deleteTemplate(selectedPrompt.id); setSelectedPrompt(null); }} className="p-1 text-[var(--text-muted)] hover:text-red-400 transition-colors" title="Delete">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </>
                )}
                {isEditing && (
                  <>
                    <button onClick={handleSave} className="px-2.5 py-1 text-[10px] rounded-md bg-[var(--accent)] text-white hover:opacity-90 flex items-center gap-1">
                      <Save className="w-3 h-3" /> Save
                    </button>
                    <button onClick={() => { setIsEditing(false); setIsNewPrompt(false); }} className="px-2.5 py-1 text-[10px] rounded-md bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">Cancel</button>
                  </>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Name</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Description</label>
                    <input type="text" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Category</label>
                    <select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value as PromptCategory })} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                      {Object.entries(CATEGORY_LABELS).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1">Prompt Content</label>
                    <textarea value={editForm.content} onChange={(e) => setEditForm({ ...editForm, content: e.target.value })} rows={12} className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none" />
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Use {'{{variable_name}}'} for dynamic placeholders</p>
                  </div>
                </>
              ) : selectedPrompt ? (
                <>
                  {/* View mode */}
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[selectedPrompt.category] }} />
                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{CATEGORY_LABELS[selectedPrompt.category]}</span>
                    {selectedPrompt.isBuiltIn && <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--bg-tertiary)] text-[var(--text-muted)]">Built-in</span>}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">{selectedPrompt.description}</p>
                  <div>
                    <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">Prompt</h4>
                    <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-4">
                      <pre className="text-xs text-[var(--text)] font-mono whitespace-pre-wrap leading-relaxed">{selectedPrompt.content}</pre>
                    </div>
                  </div>
                  {selectedPrompt.variables.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-[var(--text-muted)] mb-2">Variables</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedPrompt.variables.map((v) => (
                          <span key={v} className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 font-mono">
                            {'{{' + v + '}}'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
              <p className="text-sm text-[var(--text-secondary)]">Select a prompt template</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">or create a new one</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
