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
import { ContentStudio } from '@/components/substack/SubstackAutomation';
import { AgentPanel } from '@/components/agent/AgentPanel';
import { AgentDesigner } from '@/components/agent/AgentDesigner';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Sidebar } from '@/components/dashboard/Sidebar';
import MissionControl from '@/components/MissionControl';
import KanbanBoard from '@/components/KanbanBoard';
import AgentDeploymentPanel from '@/components/AgentDeploymentPanel';
import SkillsPanel from '@/components/SkillsPanel';
import GoalsPanel from '@/components/GoalsPanel';
import JournalPanel from '@/components/JournalPanel';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import MemoryPanel from '@/components/MemoryPanel';
import SessionHistoryPanel from '@/components/SessionHistoryPanel';
import FailureLogsPanel from '@/components/FailureLogsPanel';
import InsightsPanel from '@/components/InsightsPanel';
import ResearchQueuePanel from '@/components/ResearchQueuePanel';
import { PERSONAS } from '@/lib/personas';
import { StatusBar } from '@/components/status/StatusBar';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useAuthCheck } from '@/hooks/useAuthCheck';
import { AuthGate } from '@/components/auth/AuthGate';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useChatStream } from '@/hooks/useChatStream';
import { JarvisPanel } from '@/components/JarvisPanel';
import { SpacesPanel } from '@/components/spaces/SpacesPanel';
import SettingsPanel from '@/components/SettingsPanel';


type Panel = 'dashboard' | 'chat' | 'pipeline' | 'memory' | 'loop' | 'devtools' | 'research' | 'researchQueue' | 'substack' | 'agent' | 'jarvis' | 'designer' | 'spaces' | 'mission' | 'taskboard' | 'deploy' | 'skills' | 'goals' | 'journal' | 'analytics' | 'session' | 'failureLogs' | 'insights' | 'settings';

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const { theme, setTheme } = useTheme();
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const connectionStatus = useUIStore((s) => s.connectionStatus);
  const activePersona = useUIStore((s) => s.activePersona);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const reasoningEffort = useUIStore((s) => s.reasoningEffort);
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const addToast = useUIStore((s) => s.addToast);

  const [activePanel, setActivePanel] = useState<Panel>('dashboard');

  // Session management
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const sessions = useSessionStore((s) => s.sessions);
  const createSession = useSessionStore((s) => s.createSession);
  const setActiveSession = useSessionStore((s) => s.setActiveSession);
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

  // Listen for Jarvis navigation commands
  useEffect(() => {
    const handleNav = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) setActivePanel(detail as Panel);
    };
    window.addEventListener('overlord-navigate', handleNav);
    return () => window.removeEventListener('overlord-navigate', handleNav);
  }, []);

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

  // Chat is now self-contained in ChatWindow — no send handler needed here

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
    <ErrorBoundary>
    <div className="flex h-full">
      {/* Skip links for keyboard nav */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-1.5 focus:bg-[var(--accent)] focus:text-white focus:rounded-lg focus:text-sm"
      >
        Skip to main content
      </a>

      {/* Command Palette Overlay */}
      <CommandPalette onSelect={handleCommandSelect} />

      {/* Sidebar */}
      <Sidebar activePanel={activePanel} onNavigate={(panel) => setActivePanel(panel as Panel)} />

      {/* Main Content */}
      <div id="main-content" className="flex-1 flex flex-col min-w-0 relative" role="main">
        {/* Header */}
        <header
          className="h-[52px] border-b border-[var(--border)] flex items-center px-4 gap-2 bg-[var(--bg)]"
          role="banner"
        >
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
            {activePanel === 'dashboard' && 'Dashboard'}
            {activePanel === 'chat' && 'Chat'}
            {activePanel === 'pipeline' && 'Idea → Implement Pipeline'}
            {activePanel === 'memory' && 'Memory Galaxy'}
            {activePanel === 'loop' && 'Loop Engineering'}
            {activePanel === 'devtools' && 'DevTools'}
            {activePanel === 'research' && 'Research'}
            {activePanel === 'substack' && 'Content Studio'}
            {activePanel === 'agent' && 'Agent Roster'}
            {activePanel === 'jarvis' && 'Jarvis'}
            {activePanel === 'designer' && 'Agent Designer'}
            {activePanel === 'spaces' && 'Spaces'}
            {activePanel === 'mission' && 'Mission Control'}
            {activePanel === 'taskboard' && 'Task Board'}
            {activePanel === 'deploy' && 'Deployments'}
            {activePanel === 'skills' && 'Skills & Playbooks'}
            {activePanel === 'goals' && 'Goals'}
            {activePanel === 'journal' && 'Daily Journal'}
            {activePanel === 'analytics' && 'Analytics'}
            {activePanel === 'session' && 'Session History'}
            {activePanel === 'researchQueue' && 'Research Queue'}
            {activePanel === 'failureLogs' && 'Failure Logs'}
            {activePanel === 'insights' && 'System Insights'}
            {activePanel === 'settings' && 'Settings'}
          </h1>

          {/* Persona Selector */}
          <PersonaSelector />

          {/* Model Selector (from graph) */}
          <ModelSelector />


          {/* Reasoning Effort */}
          <ReasoningEffort />

          {/* Voice Controls */}
          <VoiceControls />

          {/* Connection Status */}
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span
              className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-[var(--success)]' : connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' : 'bg-[var(--error)]'}`}
            />
            <span className="capitalize">{connectionStatus}</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumbs />
          {activePanel === 'dashboard' && <Dashboard />}
          {activePanel === 'chat' && <ChatWindow />}
          {activePanel === 'pipeline' && (
            <PipelineView isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'memory' && (
            <MemoryGalaxy isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'loop' && (
            <LoopEngineering isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'devtools' && (
            <StudioView isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'research' && (
            <ResearchMultiFormat isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'substack' && (
            <ContentStudio isOpen={true} onClose={() => setActivePanel('dashboard')} />
          )}
          {activePanel === 'agent' && <AgentPanel />}
          {activePanel === 'jarvis' && <JarvisPanel />}
          {activePanel === 'designer' && <AgentDesigner />}
          {activePanel === 'spaces' && <SpacesPanel />}
          {activePanel === 'mission' && <MissionControl />}
          {activePanel === 'taskboard' && <KanbanBoard />}
          {activePanel === 'deploy' && <AgentDeploymentPanel />}
          {activePanel === 'skills' && <SkillsPanel />}
          {activePanel === 'goals' && <GoalsPanel />}
          {activePanel === 'journal' && <JournalPanel />}
          {activePanel === 'analytics' && <AnalyticsDashboard />}
          {activePanel === 'session' && <SessionHistoryPanel />}
          {activePanel === 'researchQueue' && <ResearchQueuePanel />}
          {activePanel === 'failureLogs' && <FailureLogsPanel />}
          {activePanel === 'insights' && <InsightsPanel />}
          {activePanel === 'settings' && <SettingsPanel />}
        </main>

        {/* Status Bar */}
        <StatusBar sessionId={activeSession} />
      </div>
    </div>
    </ErrorBoundary>
  );
}
