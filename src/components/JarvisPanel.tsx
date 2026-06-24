'use client';

import React, { useState, useCallback } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useJarvis } from '@/hooks/useJarvis';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, History } from 'lucide-react';

const SUGGESTED_COMMANDS = [
  { label: 'Create agent', command: 'create new agent' },
  { label: 'Check status', command: 'what is the status' },
  { label: 'New chat', command: 'open new chat' },
  { label: 'Show dashboard', command: 'show dashboard' },
  { label: 'Export session', command: 'export session' },
];

interface JarvisMessage {
  id: string;
  type: 'user' | 'jarvis';
  text: string;
  timestamp: Date;
}

export function JarvisPanel() {
  const addToast = useUIStore((s) => s.addToast);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);

  const handleCommand = useCallback((command: string) => {
    const lower = command.toLowerCase();
    let response = '';

    if (lower.includes('create') && lower.includes('agent')) {
      response = 'Agent spawn dialog opened. Configure your new agent below.';
      addToast({ type: 'info', message: 'Spawn agent dialog opened', duration: 2000 });
    } else if (lower.includes('status')) {
      response = 'All systems operational. 4 agents active. Memory at 62%. Chat sessions: 3.';
      addToast({ type: 'info', message: 'Status: All systems operational', duration: 3000 });
    } else if (lower.includes('chat')) {
      response = 'Opening new chat session...';
      addToast({ type: 'info', message: 'New chat opened', duration: 1500 });
    } else if (lower.includes('dashboard')) {
      response = 'Navigating to dashboard.';
      addToast({ type: 'info', message: 'Showing dashboard', duration: 1500 });
    } else if (lower.includes('export')) {
      response = 'Session exported successfully.';
      addToast({ type: 'success', message: 'Session exported', duration: 2000 });
    } else {
      response = `Command received: "${command}"`;
    }

    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text: command, timestamp: new Date() },
      { id: `jarvis-${Date.now()}`, type: 'jarvis', text: response, timestamp: new Date() },
    ]);
  }, [addToast]);

  const { isListening, isSpeaking, isSupported, transcript, lastCommand, toggle, speak } = useJarvis(handleCommand);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isListening ? 'bg-red-500 animate-pulse' :
            isSpeaking ? 'bg-[var(--accent)] animate-pulse' :
            'bg-[var(--success)]'
          }`} />
          <span className="text-sm font-semibold text-[var(--text)]">Jarvis</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'READY'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            isSupported ? 'bg-[var(--success)]/20 text-[var(--success)]' : 'bg-[var(--error)]/20 text-[var(--error)]'
          }`}>
            {isSupported ? 'Voice Ready' : 'No Voice'}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 mx-auto rounded-full bg-[var(--accent)]/20 flex items-center justify-center">
              <Mic className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {isSupported
                ? 'Tap the mic or type a command below'
                : 'Voice not supported in this browser. Type commands below.'}
            </p>
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              {SUGGESTED_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommand(cmd.command)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)] transition-colors"
                >
                  {cmd.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
              msg.type === 'user'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)]'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}

        {transcript && isListening && (
          <div className="flex justify-end">
            <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm bg-[var(--accent)]/20 text-[var(--text-secondary)] italic">
              {transcript}...
            </div>
          </div>
        )}

        {lastCommand && !isListening && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] pt-1">
              <History className="w-3 h-3" />
              Last: "{lastCommand}"
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-3 border-t border-[var(--border)] shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            disabled={!isSupported}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 text-white animate-pulse'
                : isSupported
                  ? 'bg-[var(--accent)] text-white hover:opacity-90'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] cursor-not-allowed'
            }`}
            title={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={() => {
              if (messages.length > 0) {
                const lastJarvisMsg = messages.filter(m => m.type === 'jarvis').slice(-1)[0];
                if (lastJarvisMsg) speak(lastJarvisMsg.text);
              }
            }}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)] transition-colors"
            title="Repeat last response"
          >
            {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <div className="flex-1 text-xs text-[var(--text-muted)] px-2">
            {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : '⚡ Ready'}
          </div>
        </div>
      </div>
    </div>
  );
}
