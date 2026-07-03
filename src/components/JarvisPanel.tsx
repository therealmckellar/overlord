'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useMessageStore } from '@/stores/messageStore';
import { useKanbanStore } from '@/stores/kanbanStore';
import { useChatStream } from '@/hooks/useChatStream';
import { useJarvis } from '@/hooks/useJarvis';
import { Mic, MicOff, Volume2, VolumeX, History, Loader2, ChevronDown } from 'lucide-react';
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
  const processedCountRef = useRef(0);

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
      // Only navigate if explicitly asked to "open" or "go to"
      if (lowerCmd.includes('open') || lowerCmd.includes('go to')) {
        window.dispatchEvent(new CustomEvent('overlord-navigate', { detail: 'designer' }));
        setMessages(prev => [...prev, { id: `jarvis-${Date.now()}`, type: 'jarvis', text: 'Opening Agent Designer.', timestamp: new Date() }]);
        return;
      }
      // Otherwise, treat as a prompt to create/edit an agent
      await sendChatMessage(`I want to ${command}. Please guide me through the agent creation/design process.`);
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

    // J3: Daily briefing — read today's journal + goals from stores, build context-rich prompt
    if (lowerCmd.includes('briefing') || lowerCmd.includes('daily') || lowerCmd.includes('morning')) {
      setIsThinking(true);
      try {
        // Gather context from stores
        const { useSharedMemoryStore } = await import('@/stores/sharedMemoryStore');
        const { useKanbanStore } = await import('@/stores/kanbanStore');
        
        const state = useSharedMemoryStore.getState();
        const today = new Date().toISOString().split('T')[0];
        const todaysJournal = state.journal.filter(j => j.date === today);
        const goals = state.goals.filter(g => g.status === 'active');
        
        const kanbanState = useKanbanStore.getState();
        const activeTasks = kanbanState.tasks.filter(t => t.status === 'in_progress');
        const urgentTasks = kanbanState.tasks.filter(t => t.priority === 'urgent' && t.status !== 'done');
        
        // Build context-rich briefing prompt
        const contextParts: string[] = [];
        if (activeTasks.length > 0) contextParts.push(`Active tasks: ${activeTasks.map(t => `"${t.title}"`).join(', ')}`);
        if (urgentTasks.length > 0) contextParts.push(`Urgent: ${urgentTasks.map(t => `"${t.title}"`).join(', ')}`);
        if (goals.length > 0) contextParts.push(`Goals: ${goals.map(g => `${g.title} (${g.progress}%)`).join(', ')}`);
        if (todaysJournal.length > 0) contextParts.push(`Today's notes: ${todaysJournal.map(j => j.content).join('; ')}`);
        
        const briefingPrompt = `You are Jarvis, Rich's AI assistant. Give a concise daily briefing. Context:\n${contextParts.length > 0 ? contextParts.join('\n') : 'No active tasks or goals yet.'}\n\nBe specific and actionable. What should Rich focus on first? Keep it under 100 words.`;
        
        await sendChatMessage(briefingPrompt);
        // Auto-speak the briefing after it's generated
        setTimeout(() => {
          const storeMsgs = useMessageStore.getState().messagesBySession[JARVIS_SESSION] || [];
          const lastAssistant = storeMsgs.filter((m) => m.sender.role === 'assistant').slice(-1)[0];
          if (lastAssistant) handleSpeak(lastAssistant.content);
        }, 500);
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

  // Watch message store for Jarvis responses — uses ref to avoid infinite loop
  useEffect(() => {
    const interval = setInterval(() => {
      const storeMsgs = useMessageStore.getState().messagesBySession[JARVIS_SESSION] || [];
      const assistantMsgs = storeMsgs.filter((m) => m.sender.role === 'assistant');

      if (assistantMsgs.length > processedCountRef.current) {
        // Find unseen assistant messages starting from last processed index
        for (let i = processedCountRef.current; i < assistantMsgs.length; i++) {
          const msg = assistantMsgs[i];
          setMessages(prev => [
            ...prev,
            { id: `jarvis-${Date.now()}-${i}`, type: 'jarvis', text: msg.content, timestamp: new Date() },
          ]);
        }
        processedCountRef.current = assistantMsgs.length;
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const { isListening, isSpeaking, isSupported, transcript, lastCommand, toggle, speak } = useJarvis(handleCommand);

  // Voice selection
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);

  useEffect(() => {
    const loadVoices = () => {
      const available = window.speechSynthesis?.getVoices() || [];
      if (available.length > 0) {
        setVoices(available);
        // Prefer a deep/male English voice, fallback to first available
        const preferred = available.find(v => /daniel|david|google uk english male|microsoft david|mark|james/i.test(v.name))
          || available.find(v => v.lang.startsWith('en'))
          || available[0];
        setSelectedVoice(preferred || null);
      }
    };
    loadVoices();
    window.speechSynthesis?.addEventListener('voiceschanged', loadVoices);
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices);
  }, []);

  const handleSpeak = useCallback((text: string) => {
    speak(text, selectedVoice);
  }, [speak, selectedVoice]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2.5">
          <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            isThinking  ? 'bg-[var(--warning-bg)] border border-[rgba(210,153,34,0.3)]' :
            isListening ? 'bg-[var(--error-bg)] border border-[rgba(248,81,73,0.3)]' :
            isSpeaking  ? 'bg-[var(--accent-glow)] border border-[rgba(14,165,233,0.3)]' :
                          'bg-[var(--success-bg)] border border-[rgba(63,185,80,0.3)]'
          }`}>
            <span className={`text-[10px] font-bold ${
              isThinking  ? 'text-[var(--warning)]' :
              isListening ? 'text-[var(--error)]' :
              isSpeaking  ? 'text-[var(--accent)]' :
                            'text-[var(--success)]'
            }`}>◎</span>
          </div>
          <div>
            <span className="panel-title">Jarvis</span>
            <span className="ml-2 text-[9px] font-mono tracking-widest" style={{
              color: isThinking ? 'var(--warning)' : isListening ? 'var(--error)' : isSpeaking ? 'var(--accent)' : 'var(--success)'
            }}>
              {isThinking ? 'THINKING' : isListening ? 'LISTENING' : isSpeaking ? 'SPEAKING' : 'READY'}
            </span>
          </div>
        </div>
        <span className={`badge ${
          isSupported ? 'badge-success' : 'badge-error'
        }`}>
          {isSupported ? 'Voice' : 'No Voice'}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="empty-state py-12">
            <div className="empty-state-icon">
              <Mic className="w-5 h-5 text-[var(--accent)]" />
            </div>
            <p className="empty-state-title">Talk to Jarvis</p>
            <p className="empty-state-desc">
              {isSupported
                ? 'Tap the mic or type a command below'
                : 'Voice not supported. Type commands below.'}
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-1">
              {SUGGESTED_COMMANDS.map((cmd) => (
                <button
                  key={cmd.command}
                  onClick={() => handleCommand(cmd.command)}
                  className="btn btn-secondary btn-xs"
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
            <div className={msg.type === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
              <p className="text-[12.5px] leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}

        {/* Thinking indicator */}
        {isThinking && messages.length > 0 && messages[messages.length - 1]?.type === 'user' && (
          <div className="flex justify-start">
            <div className="chat-bubble-assistant flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[var(--accent)] animate-spin" />
              <span className="text-[11px] text-[var(--text-muted)]">Jarvis is thinking…</span>
            </div>
          </div>
        )}

        {transcript && isListening && (
          <div className="flex justify-end">
            <div className="chat-bubble-user opacity-60 italic">
              <p className="text-[12px]">{transcript}…</p>
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
            placeholder="Ask Jarvis anything…"
            disabled={isThinking}
            className="input flex-1 text-[12.5px] disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isThinking}
            className="btn btn-primary btn-sm flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                if (lastJarvisMsg) handleSpeak(lastJarvisMsg.text);
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

          {/* Voice Picker */}
          {voices.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setVoicePickerOpen(!voicePickerOpen)}
                className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors max-w-[120px]"
                title="Change voice"
              >
                <span className="truncate">{selectedVoice?.name.split(' ').slice(0, 2).join(' ') || 'Voice'}</span>
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
              {voicePickerOpen && (
                <div className="absolute bottom-full right-0 mb-1 w-56 max-h-48 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] shadow-xl z-50">
                  {voices.map((v) => (
                    <button
                      key={v.name}
                      onClick={() => { setSelectedVoice(v); setVoicePickerOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-[11px] transition-colors ${selectedVoice?.name === v.name ? 'bg-[var(--accent)]/10 text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                    >
                      <div className="truncate font-medium">{v.name}</div>
                      <div className="text-[9px] text-[var(--text-muted)]">{v.lang} {v.localService ? '• local' : '• remote'}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <InlineModelSelector compact />
        </div>
      </div>
    </div>
  );
}
