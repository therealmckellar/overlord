'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useMessageStore } from '@/stores/messageStore';
import { useChatStream } from '@/hooks/useChatStream';
import { useJarvis } from '@/hooks/useJarvis';
import { Mic, MicOff, Volume2, VolumeX, History, Loader2 } from 'lucide-react';
import { InlineModelSelector } from '@/components/ui/InlineModelSelector';

const SUGGESTED_COMMANDS = [
  { label: 'Show tasks', command: 'show me my tasks' },
  { label: 'Daily briefing', command: 'give me my daily briefing' },
  { label: 'Create agent', command: 'create new agent' },
  { label: 'New chat', command: 'open new chat' },
  { label: 'Check missions', command: 'check missions' },
];

interface JarvisMessage {
  id: string;
  type: 'user' | 'jarvis';
  text: string;
  timestamp: Date;
  isStreaming?: boolean;
}

const JARVIS_SESSION = 'jarvis-voice';

export function JarvisPanel() {
  const selectedModel = useUIStore((s) => s.selectedModel);
  const [messages, setMessages] = useState<JarvisMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);

  const { sendMessage: sendChatMessage } = useChatStream({
    sessionId: JARVIS_SESSION,
    persona: 'david',
    model: selectedModel,
  });

  const handleCommand = useCallback(async (command: string) => {
    setMessages(prev => [
      ...prev,
      { id: `user-${Date.now()}`, type: 'user', text: command, timestamp: new Date() },
    ]);

    // J2: Command routing — navigate panels on voice commands
    const lowerCmd = command.toLowerCase();

    if (lowerCmd.includes('dashboard') || lowerCmd.includes('home')) {
      window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'dashboard' }));
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Navigating to Dashboard.', timestamp: new Date() }]);
      return;
    }
    if (lowerCmd.includes('mission') || lowerCmd.includes('status')) {
      window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'mission' }));
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Opening Mission Control.', timestamp: new Date() }]);
      return;
    }
    if (lowerCmd.includes('chat') || lowerCmd.includes('message')) {
      window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'chat' }));
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Opening Chat.', timestamp: new Date() }]);
      return;
    }
    if (lowerCmd.includes('agent') || lowerCmd.includes('designer')) {
      window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'designer' }));
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Opening Agent Designer.', timestamp: new Date() }]);
      return;
    }
    if (lowerCmd.includes('kanban') || lowerCmd.includes('task') || lowerCmd.includes('board')) {
      // Don't just navigate — let Jarvis read and summarize tasks
      const kanbanState = (await import('@/stores/kanbanStore')).useKanbanStore.getState();
      const tasks = kanbanState.tasks;
      const byStatus: Record<string, number> = {};
      for (const t of tasks) {
        byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      }
      const summary = tasks.length === 0
        ? 'You have no tasks yet. Want me to create one?'
        : `You have ${tasks.length} tasks: ${Object.entries(byStatus).map(([s, c]) => `${c} ${s}`).join(', ')}. ${tasks.filter(t => t.status === 'in_progress').map(t => `Currently working on: "${t.title}"`).join('; ') || 'Nothing in progress right now.'}`;
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: summary, timestamp: new Date() }]);
      return;
    }
    if (lowerCmd.includes('space')) {
      window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'spaces' }));
      setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Opening Spaces.', timestamp: new Date() }]);
      return;
    }

    // J3: Daily briefing — read today's journal + goals
    if (lowerCmd.includes('briefing') || lowerCmd.includes('daily') || lowerCmd.includes('morning')) {
      const briefingPrompt = `Give me a concise daily briefing. Consider: (1) What are the top priorities today? (2) What is the current status of ongoing work? (3) What should I focus on first? Be specific and actionable.`;
      setIsThinking(true);
      try {
        await sendChatMessage(briefingPrompt);
      } catch {
        setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Sorry, I had an issue generating the briefing.', timestamp: new Date() }]);
      } finally {
        setIsThinking(false);
      }
      return;
    }

    // Default: send to AI — show thinking indicator
    setIsThinking(true);

    try {
      await sendChatMessage(command);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Sorry, I had an issue processing that.', timestamp: new Date() },
      ]);
    } finally {
      setIsThinking(false);
    }
  }, [sendChatMessage]);

  // Watch message store for Jarvis responses — count-based so follow-ups work
  useEffect(() => {
    const interval = setInterval(() => {
      const storeMsgs = useMessageStore.getState().messagesBySession[JARVIS_SESSION] || [];
      const assistantMsgs = storeMsgs.filter((m) => m.sender.role === 'assistant');
      const localJarvisCount = messages.filter((m) => m.type === 'jarvis' && m.text !== 'Jarvis processing...').length;

      if (assistantMsgs.length > localJarvisCount) {
        // Find unseen assistant messages
        const displayedContent = new Set(
          messages.filter(m => m.type === 'jarvis').map(m => m.text)
        );

        for (let i = assistantMsgs.length - 1; i >= 0; i--) {
          const msg = assistantMsgs[i];
          if (!displayedContent.has(msg.content)) {
            setMessages(prev => [
              ...prev,
              { id: `jarvis-${Date.now()}-${i}`, type: 'jarvis', text: msg.content, timestamp: new Date() },
            ]);
            break;
          }
        }
      }
    }, 300);
    return () => clearInterval(interval);
  }, [messages]);

  const { isListening, isSpeaking, isSupported, transcript, lastCommand, toggle, speak } = useJarvis(handleCommand);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${
            isThinking ? 'bg-yellow-500 animate-pulse' :
            isListening ? 'bg-red-500 animate-pulse' :
            isSpeaking ? 'bg-[var(--accent)] animate-pulse' :
            'bg-[var(--success)]'
          }`} />
          <span className="text-sm font-semibold text-[var(--text)]">Jarvis</span>
          <span className="text-[10px] text-[var(--text-muted)] font-mono">
            {isThinking ? 'THINKING' : isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'READY'}
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

        {/* Thinking indicator */}
        {isThinking && messages.length > 0 && messages[messages.length - 1]?.type === 'user' && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
              <span className="text-xs text-[var(--text-muted)]">Jarvis is thinking…</span>
            </div>
          </div>
        )}

        {transcript && isListening && (
          <div className="flex justify-end">
            <div className="max-w-[80%] px-3 py-2 rounded-lg text-sm bg-[var(--accent)]/20 text-[var(--text-secondary)] italic">
              {transcript}...
            </div>
          </div>
        )}

        {lastCommand && !isListening && !isThinking && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] pt-1">
              <History className="w-3 h-3" />
              Last: "{lastCommand}"
            </div>
          </div>
        )}
      </div>

      {/* Conversation input */}
      <div className="px-3 pt-2 border-t border-[var(--border)] shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const input = (e.target as HTMLFormElement).elements.namedItem('jarvis-input') as HTMLInputElement;
            if (input && input.value.trim()) {
              handleCommand(input.value.trim());
              input.value = '';
            }
          }}
          className="flex items-center gap-2"
        >
          <input
            name="jarvis-input"
            type="text"
            placeholder="Continue the conversation..."
            disabled={isThinking}
            className="flex-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isThinking}
            className="px-3 py-2 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isThinking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Send'}
          </button>
        </form>
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
            {isListening ? '🎤 Listening...' : isSpeaking ? '🔊 Speaking...' : isThinking ? '💭 Thinking...' : '⚡ Ready'}
          </div>
          <InlineModelSelector compact />
        </div>
      </div>
    </div>
  );
}
