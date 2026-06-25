'use client';

import React, { useState } from 'react';
import { Code, Terminal, FolderGit2, Play } from 'lucide-react';
import { CodeEditor } from './CodeEditor';
import { TerminalEmulator } from './TerminalEmulator';
import { FileBrowser } from './FileBrowser';
import { PipelineRunner } from './PipelineRunner';

type StudioTab = 'code' | 'terminal' | 'files' | 'pipeline';

interface StudioViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudioView({ isOpen, onClose }: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('code');

  if (!isOpen) return null;

  const tabs: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: 'code', label: 'Code', icon: Code },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
    { id: 'files', label: 'Files', icon: FolderGit2 },
    { id: 'pipeline', label: 'Pipeline', icon: Play },
  ];

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          <Code className="w-4 h-4 text-[var(--accent)]" />
          Studio
        </h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4l8 8M12 4l-8 8" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'code' && <CodeEditor isOpen={true} onClose={() => onClose()} />}
        {activeTab === 'terminal' && <TerminalEmulator isOpen={true} onClose={() => onClose()} />}
        {activeTab === 'files' && <FileBrowser isOpen={true} onClose={() => onClose()} />}
        {activeTab === 'pipeline' && <PipelineRunner isOpen={true} onClose={() => onClose()} />}
      </div>
    </div>
  );
}
