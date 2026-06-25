'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Terminal, X, RotateCcw } from 'lucide-react';

interface TerminalEmulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TerminalEmulator({ isOpen, onClose }: TerminalEmulatorProps) {
  const [history, setHistory] = useState<{ type: 'input' | 'output' | 'error'; text: string }[]>([
    { type: 'output', text: 'Overlord Terminal v1.0.0 — Type commands to execute' },
    { type: 'output', text: 'Type "help" for available commands' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const command = input.trim();
    setInput('');
    setIsLoading(true);

    setHistory((prev) => [...prev, { type: 'input', text: command }]);

    if (command === 'help') {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: 'Available commands: help, clear, ls, pwd, echo, cat, whoami, date, env' },
      ]);
    } else if (command === 'clear') {
      setHistory([]);
    } else if (command.startsWith('echo ')) {
      setHistory((prev) => [...prev, { type: 'output', text: command.slice(5) }]);
    } else if (command === 'whoami') {
      setHistory((prev) => [...prev, { type: 'output', text: 'root' }]);
    } else if (command === 'date') {
      setHistory((prev) => [...prev, { type: 'output', text: new Date().toString() }]);
    } else if (command === 'pwd') {
      setHistory((prev) => [...prev, { type: 'output', text: process.cwd() }]);
    } else if (command === 'env') {
      setHistory((prev) => [
        ...prev,
        { type: 'output', text: `PATH=/usr/local/bin:/usr/bin:/bin\nHOME=/home/rmckellar\nNODE_ENV=production` },
      ]);
    } else {
      try {
        const response = await fetch('/api/terminal/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command }),
        });
        const data = await response.json();

        if (data.output) {
          setHistory((prev) => [...prev, { type: 'output', text: data.output }]);
        }
        if (data.error) {
          setHistory((prev) => [...prev, { type: 'error', text: data.error }]);
        }
      } catch {
        setHistory((prev) => [...prev, { type: 'error', text: 'Failed to execute command' }]);
      }
    }
    setIsLoading(false);
  }, [input, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-xs font-medium text-[var(--text)]">Terminal</span>
          <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setHistory([])}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            title="Clear"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
        {history.map((entry, i) => (
          <div
            key={i}
            className={`${
              entry.type === 'input'
                ? 'text-[var(--accent)]'
                : entry.type === 'error'
                ? 'text-red-400'
                : 'text-[var(--text)]'
            }`}
          >
            {entry.type === 'input' ? (
              <div className="flex">
                <span className="text-[var(--success)]">❯ </span>
                <span className="ml-1">{entry.text}</span>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{entry.text}</pre>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="text-[var(--text-muted)] animate-pulse">...</div>
        )}
      </div>

      {/* Terminal Input */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-4 py-2 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-2">
          <span className="text-[var(--success)] text-xs">❯</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 bg-transparent text-xs text-[var(--text)] font-mono focus:outline-none placeholder:text-[var(--text-muted)]/50"
            placeholder="Type a command..."
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
}
