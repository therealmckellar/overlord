'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { ChevronDown, Cpu, Check } from 'lucide-react';
import { UNIQUE_MODELS } from '@/lib/model-graph';

export const ModelSelector = () => {
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const [isOpen, setIsOpen] = useState(false);

  const models = UNIQUE_MODELS;

  const currentModel = models.find((m) => m.value === selectedModel);
  const displayLabel = currentModel?.label || 'Select';

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 transition-all duration-200 group"
        title="Select model from graph"
      >
        <Cpu className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 max-w-[180px] truncate">
          {displayLabel}
        </span>
        <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-80 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              Model Graph
            </div>
            {models.map((model) => (
              <button
                key={model.value}
                onClick={() => {
                  setSelectedModel(model.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  selectedModel === model.value
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  {selectedModel === model.value && <Check className="w-3 h-3 text-[var(--accent)]" />}
                </div>
                <span className="flex-1 font-medium">{model.label}</span>
                {model.agents.length > 1 && (
                  <span className="text-[9px] text-zinc-600">+{model.agents.length - 1}</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
