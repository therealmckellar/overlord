'use client';

import { useState } from 'react';
import { usePromptStore, type PromptTemplate, type StudioTab, type GeneratedPrompt, type ArenaRun, ARENA_MODELS, GENERATOR_MODELS, CATEGORY_LABELS, CATEGORY_COLORS } from '@/stores/promptStore';
import { Search, Sparkles, Trophy, Library, Save, Trash2, ChevronRight, Loader2, Cpu, Layers, MessageSquare } from 'lucide-react';

export function PromptStudioPanel() {
  const {
    templates,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
    getFilteredTemplates,
    studioTab,
    setStudioTab,
    generatedPrompts,
    arenaRuns,
    isGenerating,
    isRunningArena,
    setGenerating,
    setRunningArena,
    addGeneratedPrompt,
    addArenaRun,
    deleteGeneratedPrompt,
    deleteArenaRun,
    addTemplate,
    deleteTemplate,
  } = usePromptStore();

  const [generatorIntent, setGeneratorIntent] = useState('');
  const [generatorModel, setGeneratorModel] = useState(GENERATOR_MODELS[0].value);
  const [generatorCategory, setGeneratorCategory] = useState('research');

  const [arenaPrompt, setArenaPrompt] = useState('');
  const [arenaModels, setArenaModels] = useState<string[]>([ARENA_MODELS[0].value, ARENA_MODELS[1].value]);
  const [arenaAggregator, setArenaAggregator] = useState(ARENA_MODELS[0].value);

  const handleGenerate = async () => {
    if (!generatorIntent.trim()) return;
    setGenerating(true);
    try {
      const res = await fetch('/api/prompt/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: generatorIntent, category: generatorCategory, model: generatorModel }),
      });
      if (res.ok) {
        const data = await res.json();
        addGeneratedPrompt({
          prompt: data.prompt,
          variables: data.variables,
          model: data.model,
          intent: generatorIntent,
          category: generatorCategory as any,
        });
        setGeneratorIntent('');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleArenaRun = async () => {
    if (!arenaPrompt.trim()) return;
    setRunningArena(true);
    try {
      const res = await fetch('/api/prompt/arena', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: arenaPrompt, models: arenaModels, aggregatorModel: arenaAggregator }),
      });
      if (res.ok) {
        const data = await res.json();
        addArenaRun({
          prompt: arenaPrompt,
          models: arenaModels,
          aggregatorModel: arenaAggregator,
          results: data.results,
          aggregation: data.aggregation,
          totalTokens: data.totalTokens,
        });
        setArenaPrompt('');
      }
    } finally {
      setRunningArena(false);
    }
  };

  const saveGeneratedToLibrary = (gp: GeneratedPrompt) => {
    addTemplate({
      name: gp.intent,
      description: `Generated via ${gp.model}`,
      category: gp.category,
      content: gp.prompt,
    });
    deleteGeneratedPrompt(gp.id);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[var(--bg-main)] text-[var(--text)] overflow-hidden">
      {/* Tab Header */}
      <div className="flex items-center border-b border-[var(--border)] bg-[var(--bg-secondary)] p-2 gap-2">
        <button
          onClick={() => setStudioTab('library')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${studioTab === 'library' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--border)]'}`}
        >
          <Library className="w-3.5 h-3.5" /> Library
        </button>
        <button
          onClick={() => setStudioTab('generator')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${studioTab === 'generator' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--border)]'}`}
        >
          <Sparkles className="w-3.5 h-3.5" /> Generator
        </button>
        <button
          onClick={() => setStudioTab('arena')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${studioTab === 'arena' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--border)]'}`}
        >
          <Trophy className="w-3.5 h-3.5" /> Arena
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {studioTab === 'library' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm focus:ring-1 ring-[var(--accent)] outline-none transition-all"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as any)}
                className="px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-sm outline-none"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getFilteredTemplates().map((t) => (
                <div key={t.id} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-opacity-20" style={{ backgroundColor: CATEGORY_COLORS[t.category] + '33', color: CATEGORY_COLORS[t.category] }}>
                      {t.category}
                    </span>
                    {!t.isBuiltIn && (
                      <button onClick={() => deleteTemplate(t.id)} className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-all">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold mb-1">{t.name}</h4>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{t.description}</p>
                  <div className="p-2 rounded-lg bg-black/20 border border-black/10 text-[11px] font-mono text-[var(--text-secondary)] line-clamp-3 italic">
                    {t.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {studioTab === 'generator' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">What should this prompt do?</label>
                <textarea
                  value={generatorIntent}
                  onChange={(e) => setGeneratorIntent(e.target.value)}
                  placeholder="e.g. Create a deep research prompt for analyzing the current state of the commercial real estate market in NYC..."
                  className="w-full h-24 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-sm outline-none focus:ring-1 ring-[var(--accent)] transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Model</label>
                  <select
                    value={generatorModel}
                    onChange={(e) => setGeneratorModel(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm outline-none"
                  >
                    {GENERATOR_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Category</label>
                  <select
                    value={generatorCategory}
                    onChange={(e) => setGeneratorCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !generatorIntent.trim()}
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Generate Prompt
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[var(--accent)]" />
                Recent Generations
              </h3>
              {generatedPrompts.length === 0 && (
                <div className="text-center py-12 text-xs text-[var(--text-muted)] italic">
                  No generated prompts yet. Start by describing your intent above.
                </div>
              )}
              {generatedPrompts.map((gp) => (
                <div key={gp.id} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-opacity-20" style={{ backgroundColor: CATEGORY_COLORS[gp.category] + '33', color: CATEGORY_COLORS[gp.category] }}>
                        {gp.category}
                      </span>
                      <span className="text-xs font-medium text-[var(--text-muted)]">{gp.model}</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => saveGeneratedToLibrary(gp)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors" title="Save to Library">
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteGeneratedPrompt(gp.id)} className="p-1.5 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-[var(--text)] italic mb-1">"{gp.intent}"</div>
                  <div className="p-3 rounded-lg bg-black/20 border border-black/10 text-xs font-mono text-[var(--text-secondary)] whitespace-pre-wrap">
                    {gp.prompt}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {gp.variables.map(v => (
                      <span key={v} className="px-2 py-0.5 rounded-full bg-[var(--border)] text-[10px] text-[var(--text-muted)]">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {studioTab === 'arena' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-muted)]">Prompt to Test</label>
                <textarea
                  value={arenaPrompt}
                  onChange={(e) => setArenaPrompt(e.target.value)}
                  placeholder="Paste a prompt or enter a test case here..."
                  className="w-full h-24 p-3 rounded-xl bg-[var(--bg-main)] border border-[var(--border)] text-sm outline-none focus:ring-1 ring-[var(--accent)] transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-2">
                    <Layers className="w-3 h-3" /> Models to Compare
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {ARENA_MODELS.map(m => (
                      <label key={m.value} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all text-xs ${arenaModels.includes(m.value) ? 'bg-[var(--accent)]/10 border-[var(--accent)] text-[var(--text)]' : 'bg-[var(--bg-main)] border-[var(--border)] text-[var(--text-muted)]'}`}>
                        <input
                          type="checkbox"
                          checked={arenaModels.includes(m.value)}
                          onChange={(e) => {
                            if (e.target.checked) setArenaModels([...arenaModels, m.value]);
                            else setArenaModels(arenaModels.filter(v => v !== m.value));
                          }}
                          className="hidden"
                        />
                        <span className="truncate">{m.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="text-xs font-medium text-[var(--text-muted)]">Aggregator Model</label>
                  <select
                    value={arenaAggregator}
                    onChange={(e) => setArenaAggregator(e.target.value as any)}
                    className="w-full p-2 rounded-lg bg-[var(--bg-main)] border border-[var(--border)] text-sm outline-none"
                  >
                    {ARENA_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <div className="p-3 rounded-xl bg-black/20 border border-black/10 text-[10px] text-[var(--text-muted)] italic">
                    The aggregator will synthesize the best elements from all responses into a single superior answer.
                  </div>
                </div>
              </div>
              <button
                onClick={handleArenaRun}
                disabled={isRunningArena || !arenaPrompt.trim()}
                className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRunningArena ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
                Run Arena Comparison
              </button>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[var(--accent)]" />
                Arena History
              </h3>
              {arenaRuns.length === 0 && (
                <div className="text-center py-12 text-xs text-[var(--text-muted)] italic">
                  No arena runs yet. Compare models to see who wins.
                </div>
              )}
              {arenaRuns.map((run) => (
                <div key={run.id} className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text)]">{run.prompt.slice(0, 60)}...</span>
                      <span className="text-[10px] text-[var(--text-muted)]">{new Date(run.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <button onClick={() => deleteArenaRun(run.id)} className="p-1 text-[var(--text-muted)] hover:text-[var(--error)] transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {run.results.map((res, i) => (
                      <div key={res.model} className="p-3 rounded-xl bg-black/20 border border-black/10 space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase text-[var(--text-secondary)]">{res.model.split('/').pop()?.split(':')[0]}</span>
                          <span className="text-[9px] text-[var(--text-muted)]">{res.latencyMs}ms</span>
                        </div>
                        <div className="text-xs text-[var(--text-muted)] line-clamp-4 italic">
                          {res.response || res.error}
                        </div>
                      </div>
                    ))}
                  </div>

                  {run.aggregation && (
                    <div className="p-4 rounded-xl bg-accent/10 border border-accent/20 space-y-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                        <span className="text-xs font-bold text-[var(--text)]">Aggregated Result (by {run.aggregation.model.split('/').pop()})</span>
                      </div>
                      <div className="text-xs text-[var(--text)] leading-relaxed whitespace-pre-wrap">
                        {run.aggregation.response}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
