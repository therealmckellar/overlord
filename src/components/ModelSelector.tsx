'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { ChevronDown, Cpu, Check } from 'lucide-react';

export const ModelSelector = () => {
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const availableModels = useUIStore((s) => s.availableModels);
  const setAvailableModels = useUIStore((s) => s.setAvailableModels);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch models from API on mount
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch('/api/models');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.models) && data.models.length > 0) {
            setAvailableModels(data.models);
          }
        }
      } catch {
        // Fallback: use default models already in store
      }
    };
    fetchModels();
  }, [setAvailableModels]);

  // Model display names
  const modelLabels: Record<string, string> = {
    'default': 'Default',
    'claude-sonnet-4': 'Claude Sonnet 4',
    'gpt-4o': 'GPT-4o',
    'gpt-4o-mini': 'GPT-4o Mini',
    'gemini-2.5-pro': 'Gemini 2.5 Pro',
  };

  const displayLabel = modelLabels[selectedModel] || selectedModel;

  return (
    <div className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700 transition-all duration-200 group"
        title="Select model"
      >
        <Cpu className="w-3 h-3 text-zinc-500 group-hover:text-zinc-300" />
        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-200 max-w-[100px] truncate">
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
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-zinc-900 border border-zinc-800 shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-zinc-500 font-medium">
              Model
            </div>
            {availableModels.map((model) => (
              <button
                key={model}
                onClick={() => {
                  setSelectedModel(model);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                  selectedModel === model
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                }`}
              >
                <div className="w-3.5 h-3.5 flex items-center justify-center">
                  {selectedModel === model && <Check className="w-3 h-3 text-[var(--accent)]" />}
                </div>
                <span className="flex-1 font-medium">{modelLabels[model] || model}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
