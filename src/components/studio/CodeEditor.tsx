'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Code, Save, X } from 'lucide-react';

interface CodeEditorProps {
  isOpen: boolean;
  onClose: () => void;
}

type Language = 'typescript' | 'javascript' | 'python' | 'markdown' | 'json' | 'bash';

const LANGUAGE_LABELS: Record<Language, string> = {
  typescript: 'TypeScript',
  javascript: 'JavaScript',
  python: 'Python',
  markdown: 'Markdown',
  json: 'JSON',
  bash: 'Bash',
};

export function CodeEditor({ isOpen, onClose }: CodeEditorProps) {
  const [code, setCode] = useState(`// Welcome to Overlord Code Editor
// Write, edit, and save your code here

function greet(name: string): string {
  return \`Hello, \${name}! Welcome to Overlord.\`;
}

console.log(greet('Agent'));
`);
  const [language, setLanguage] = useState<Language>('typescript');
  const [isSaved, setIsSaved] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
    setIsSaved(false);
  }, []);

  const handleSave = useCallback(() => {
    setIsSaved(true);
    // In a real implementation, this would save to a file via API
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Tab for indentation
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newCode = code.substring(0, start) + '  ' + code.substring(end);
        setCode(newCode);
        setIsSaved(false);
        // Restore cursor position
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [code, handleSave]
  );

  if (!isOpen) return null;

  // Simple syntax highlighting (keyword-based)
  const highlightedLines = code.split('\n').map((line) => {
    let highlighted = line;
    // Escape HTML
    highlighted = highlighted
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Keywords
    const keywords = ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'import', 'export', 'from', 'class', 'interface', 'type', 'async', 'await', 'new', 'this'];
    keywords.forEach((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'g');
      highlighted = highlighted.replace(regex, `<span style="color:#C792EA">${kw}</span>`);
    });

    // Strings
    highlighted = highlighted.replace(
      /(&quot;|"|')(?:(?!\1)[^\\]|\\.)*\1/g,
      '<span style="color:#C3E88D">$&</span>'
    );

    // Comments
    if (highlighted.trim().startsWith('//')) {
      highlighted = `<span style="color:#546E7A;font-style:italic">${highlighted}</span>`;
    }

    // Numbers
    highlighted = highlighted.replace(/\b(\d+)\b/g, '<span style="color:#F78C6C">$1</span>');

    return highlighted;
  });

  const lineCount = code.split('\n').length;

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <Code className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">Code Editor</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isSaved ? 'text-[var(--success)] bg-[var(--success)]/10' : 'text-[var(--warning)] bg-[var(--warning)]/10'}`}>
            {isSaved ? 'Saved' : 'Unsaved'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="text-xs bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text)] focus:outline-none"
          >
            {Object.entries(LANGUAGE_LABELS).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Save (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 bg-[var(--bg-secondary)] border-r border-[var(--border)] overflow-hidden">
          <div className="pt-3 pb-3 text-right pr-2">
            {Array.from({ length: lineCount }, (_, i) => (
              <div key={i} className="text-[11px] leading-[1.5] text-[var(--text-muted)] select-none">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Code Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax highlighted layer (background) */}
          <div
            className="absolute inset-0 p-3 font-mono text-xs leading-[1.5] pointer-events-none whitespace-pre overflow-auto"
            aria-hidden="true"
          >
            {highlightedLines.map((line, i) => (
              <div key={i} dangerouslySetInnerHTML={{ __html: line || ' ' }} />
            ))}
          </div>

          {/* Actual textarea (transparent, on top) */}
          <textarea
            ref={textareaRef}
            value={code}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="absolute inset-0 w-full h-full p-3 font-mono text-xs leading-[1.5] bg-transparent text-transparent caret-[var(--text)] resize-none focus:outline-none selection:bg-[var(--accent)]/30"
            spellCheck={false}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-[var(--border)] bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)]">
        <span>{LANGUAGE_LABELS[language]}</span>
        <span>UTF-8</span>
        <span>Spaces: 2</span>
        <span>Ln {lineCount}, Col 1</span>
      </div>
    </div>
  );
}
