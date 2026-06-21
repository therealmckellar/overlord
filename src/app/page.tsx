'use client';

import { useEffect, useCallback, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useUIStore, useSessionStore } from '@/stores';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { CommandPalette } from '@/components/CommandPalette';
import { PersonaSelector } from '@/components/PersonaSelector';
import { ModelSelector } from '@/components/ModelSelector';
import { ReasoningEffort } from '@/components/ReasoningEffort';
import { VoiceControls } from '@/components/VoiceControls';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { PipelineView } from '@/components/pipeline/PipelineView';
import { MemoryGalaxy } from '@/components/memory/MemoryGalaxy';
import { LoopEngineering } from '@/components/loop/LoopEngineering';
import { StudioView } from '@/components/studio/StudioView';
import { ResearchMultiFormat } from '@/components/research/ResearchMultiFormat';
import { SubstackAutomation } from '@/components/substack/SubstackAutomation';
import { PERSONAS } from '@/lib/personas';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { AuthGate } from '@/components/auth/AuthGate';
import { useChatStream } from '@/hooks/useChatStream';

type Panel = 'chat' | 'pipeline' | 'memory' | 'loop' | 'studio' | 'research' | 'substack';

const THEMES = [
  { id: 'dark', label: 'Dark', color: '#6366f1' },
  { id: 'light', label: 'Light', color: '#6366f1' },
  { id: 'midnight', label: 'Midnight', color: '#8b5cf6' },
  { id: 'forest', label: 'Forest', color: '#34d399' },
  { id: 'arctic', label: 'Arctic', color: '#0ea5e9' },
] as const;

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const { theme, setTheme } = useTheme();
  const {
    sidebarOpen,
    toggleSidebar,
    connectionStatus,
    activePersona,
    selectedModel,
    reasoningEffort,
    commandPaletteOpen,
    setCommandPaletteOpen,
    addToast,
  } = useUIStore();

  const [activePanel, setActivePanel] = useState<Panel>('chat');

  // Session management
  const { activeSessionId, sessions, createSession, setActiveSession } = useSessionStore();
  const activeSession = activeSessionId || 'default';

  // Ensure there's at least one session
  useEffect(() => {
    if (sessions.length === 0) {
      const s = createSession('New Chat');
      setActiveSession(s.id);
    } else if (!activeSessionId) {
      setActiveSession(sessions[0].id);
    }
  }, [sessions.length, activeSessionId, createSession, setActiveSession]);

  // Wire keyboard shortcuts
  useKeyboardShortcuts();

  // Handle command palette selection
  const handleCommandSelect = useCallback((command: string) => {
    addToast({
      type: 'info',
      message: `Executed: ${command}`,
      duration: 2000,
    });
  }, [addToast]);

  // Get current persona for system prompt display
  const currentPersona = PERSONAS[activePersona as keyof typeof PERSONAS] || PERSONAS.david;

  // Handle chat send — real SSE streaming to OpenRouter
  const { sendMessage: sendChatMessage } = useChatStream({
    sessionId: activeSession,
    persona: currentPersona.slug,
  });

  const handleSend = useCallback((message: string) => {
    if (!message.trim()) return;
    sendChatMessage(message);
  }, [sendChatMessage]);

  const navItems = [
    { icon: '💬', label: 'Chat', panel: 'chat' as Panel },
    { icon: '⚡', label: 'Pipeline', panel: 'pipeline' as Panel },
    { icon: '🧠', label: 'Memory', panel: 'memory' as Panel },
    { icon: '🔄', label: 'Loops', panel: 'loop' as Panel },
    { icon: '🎨', label: 'Studio', panel: 'studio' as Panel },
    { icon: '📊', label: 'Research', panel: 'research' as Panel },
    { icon: '📰', label: 'Substack', panel: 'substack' as Panel },
  ];

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">Checking auth...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!isAuthenticated) {
    return <AuthGate />;
  }

  return (
    <div className="flex h-full">
      {/* Command Palette Overlay */}
      <CommandPalette onSelect={handleCommandSelect} />

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)]
          transition-[width] duration-200 ease
          ${sidebarOpen ? 'w-[260px]' : 'w-0 overflow-hidden'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-4 h-[52px] border-b border-[var(--border)]">
          <div className="w-7 h-7 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <span className="text-white font-bold text-xs">O</span>
          </div>
          <span className="font-semibold text-sm">Overlord</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.panel}
              onClick={() => setActivePanel(item.panel)}
              className={`
                w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm
                transition-colors duration-150
                ${activePanel === item.panel
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text)]'
                }
              `}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Theme Switcher */}
        <div className="p-3 border-t border-[var(--border)]">
          <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">
            Theme
          </p>
          <div className="flex gap-1.5">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`
                  w-7 h-7 rounded-full border-2 flex items-center justify-center
                  transition-all duration-150
                  ${theme === t.id
                    ? 'border-white scale-110'
                    : 'border-transparent hover:border-[var(--border)]'
                  }
                `}
                style={{ backgroundColor: t.color }}
                title={t.label}
              >
                {theme === t.id && (
                  <span className="text-white text-[10px]">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-[52px] border-b border-[var(--border)] flex items-center px-4 gap-2 bg-[var(--bg)]">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-tertiary)] transition-colors"
            aria-label="Toggle sidebar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[var(--text-secondary)]">
              <rect x="1" y="2" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="1" y="7" width="14" height="2" rx="1" fill="currentColor"/>
              <rect x="1" y="12" width="14" height="2" rx="1" fill="currentColor"/>
            </svg>
          </button>

          <h1 className="text-sm font-medium flex-1">
            {activePanel === 'chat' && 'Agent OS — Phase 3'}
            {activePanel === 'pipeline' && 'Idea → Implement Pipeline'}
            {activePanel === 'memory' && 'Memory Galaxy'}
            {activePanel === 'loop' && 'Loop Engineering'}
            {activePanel === 'studio' && 'Studio'}
            {activePanel === 'research' && 'Research → Multi-Format'}
            {activePanel === 'substack' && 'Substack Automation'}
          </h1>

          {/* Persona Selector */}
          <PersonaSelector />

          {/* Model Selector */}
          <ModelSelector />

          {/* Reasoning Effort */}
          <ReasoningEffort />

          {/* Voice Controls */}
          <VoiceControls />

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span
              className={`
                w-2 h-2 rounded-full
                ${connectionStatus === 'connected' ? 'bg-[var(--success)]' : ''}
                ${connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' : ''}
                ${connectionStatus === 'disconnected' ? 'bg-[var(--error)]' : ''}
              `}
            />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {activePanel === 'chat' && (
            <>
              <ChatWindow sessionId="default" />
              <ChatComposer onSend={handleSend} />
            </>
          )}
          {activePanel === 'pipeline' && (
            <PipelineView isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
          {activePanel === 'memory' && (
            <MemoryGalaxy isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
          {activePanel === 'loop' && (
            <LoopEngineering isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
          {activePanel === 'studio' && (
            <StudioView isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
          {activePanel === 'research' && (
            <ResearchMultiFormat isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
          {activePanel === 'substack' && (
            <SubstackAutomation isOpen={true} onClose={() => setActivePanel('chat')} />
          )}
        </main>
      </div>
    </div>
  );
}
