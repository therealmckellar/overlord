'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import { Cpu, Check } from 'lucide-react';

interface InlineModelSelectorProps {
  /** Optional per-context model override. If set, takes priority over global. */
  value?: string;
  /** Called when user picks a model. Also updates global uiStore. */
  onChange?: (model: string) => void;
  /** Compact variant (just icon + short label). Default: false */
  compact?: boolean;
  className?: string;
}

export function InlineModelSelector({ value, onChange, compact = false, className = '' }: InlineModelSelectorProps) {
  const globalModel = useUIStore((s) => s.selectedModel);
  const setGlobalModel = useUIStore((s) => s.setSelectedModel);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeModel = value || globalModel;
  const currentInfo = UNIQUE_MODELS.find((m) => m.value === activeModel);
  const displayLabel = currentInfo?.label || activeModel.split('/').pop()?.split(':')[0] || 'Model';

  const handleChange = (modelValue: string) => {
    setGlobalModel(modelValue);
    onChange?.(modelValue);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 rounded-md border transition-colors ${
          compact
            ? 'px-1.5 py-1 border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/40'
            : 'px-2 py-1.5 border-[var(--border)] bg-[var(--bg-tertiary)] hover:border-[var(--accent)]/40'
        }`}
        title="Change model / provider"
      >
        <Cpu className={`${compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} text-[var(--text-muted)]`} />
        <span className={`${compact ? 'text-[9px] max-w-[50px]' : 'text-[10px] max-w-[80px]'} font-medium text-[var(--text-secondary)] truncate`}>
          {displayLabel}
        </span>
      </button>

      {open && (
        <div className="absolute bottom-full right-0 mb-1 w-52 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] shadow-2xl z-50 py-1 max-h-[280px] overflow-y-auto">
          <div className="px-2 py-1 text-[9px] uppercase tracking-wider text-[var(--text-muted)] font-medium sticky top-0 bg-[var(--bg-secondary)]">
            Model
          </div>
          {UNIQUE_MODELS.map((m) => (
            <button
              key={m.value}
              onClick={() => handleChange(m.value)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 text-left text-[11px] transition-colors ${
                activeModel === m.value
                  ? 'bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <div className="w-3 h-3 flex items-center justify-center shrink-0">
                {activeModel === m.value && <Check className="w-2.5 h-2.5 text-[var(--accent)]" />}
              </div>
              <span className="flex-1 truncate">{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
