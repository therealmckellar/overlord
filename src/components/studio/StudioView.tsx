'use client';

import React, { useState } from 'react';
import { Code, Terminal, FolderGit2, Play, FileText } from 'lucide-react';

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
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'code' && <CodeEditor />}
        {activeTab === 'terminal' && <TerminalEmulator />}
        {activeTab === 'files' && <FileBrowser />}
        {activeTab === 'pipeline' && <PipelineRunner />}
      </div>
    </div>
  );
}

function CodeEditor() {
  const [code, setCode] = useState(`// Welcome to Overlord Studio
function buildAgentOS() {
  const agents = ['Claude', 'Hermes', 'Jarvis'];
  return agents.map(a => a.deploy());
}`);
  return (
    <div className="h-full flex flex-col rounded-lg border border-[var(--border)] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]">
        <FileText className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        <span className="text-xs text-[var(--text-secondary)]">main.ts</span>
        <span className="ml-auto text-[10px] text-[var(--success)]">● Saved</span>
      </div>
      <textarea
        value={code}
        onChange={(e) => setCode(e.target.value)}
        className="flex-1 bg-[var(--bg)] p-4 font-mono text-sm text-[var(--text)] resize-none outline-none"
        spellCheck={false}
      />
    </div>
  );
}

function TerminalEmulator() {
  const lines = [
    '$ npm run build',
    '✓ Compiled in 2.1s',
    '✓ 17 routes built',
    '$ npm run dev',
    '→ Listening on :9125',
    '→ Ready!',
  ];
  return (
    <div className="h-full bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-green-400">$</span>
        <span className="w-2 h-4 bg-green-400 animate-pulse" />
      </div>
    </div>
  );
}

function FileBrowser() {
  const files = [
    { name: 'src/', type: 'dir' },
    { name: '  components/', type: 'dir' },
    { name: '    agent/', type: 'dir' },
    { name: '    chat/', type: 'dir' },
    { name: '    dashboard/', type: 'dir' },
    { name: '    studio/', type: 'dir' },
    { name: '  hooks/', type: 'dir' },
    { name: '  stores/', type: 'dir' },
    { name: '  app/', type: 'dir' },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ];
  return (
    <div className="h-full rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] p-4 font-mono text-sm overflow-y-auto">
      {files.map((f, i) => (
        <div key={i} className={`py-1 px-2 rounded hover:bg-[var(--bg-tertiary)] cursor-pointer ${f.type === 'dir' ? 'text-[var(--accent)]' : 'text-[var(--text-secondary)]'}`}>
          {f.type === 'dir' ? '📁 ' : '📄 '}{f.name}
        </div>
      ))}
    </div>
  );
}

function PipelineRunner() {
  const stages = [
    { name: 'Lint', status: 'success' as const },
    { name: 'TypeCheck', status: 'success' as const },
    { name: 'Build', status: 'success' as const },
    { name: 'Test', status: 'running' as const },
    { name: 'Deploy', status: 'pending' as const },
  ];
  return (
    <div className="space-y-3">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)]">
          <div className={`w-3 h-3 rounded-full ${
            stage.status === 'success' ? 'bg-[var(--success)]' :
            stage.status === 'running' ? 'bg-[var(--warning)] animate-pulse' :
            'bg-[var(--bg-tertiary)]'
          }`} />
          <span className="text-sm text-[var(--text)]">{stage.name}</span>
          <span className="ml-auto text-xs text-[var(--text-muted)] capitalize">{stage.status}</span>
        </div>
      ))}
    </div>
  );
}
