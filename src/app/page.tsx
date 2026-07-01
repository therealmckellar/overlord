'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
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
import SessionHistoryPanel from '@/components/SessionHistoryPanel';
import FailureLogsPanel from '@/components/FailureLogsPanel';
import InsightsPanel from '@/components/InsightsPanel';
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
import { ContentPipelinePanel } from '@/components/ContentPipelinePanel';
import { SocialPanel } from '@/components/social/SocialPanel';
import { AutomationQueuePanel } from '@/components/AutomationQueuePanel';
import CronPanel from '@/components/CronPanel';
import PluginPanel from '@/components/PluginPanel';
import WorkspacePanel from '@/components/WorkspacePanel';
import { WebhooksPanel } from '@/components/WebhooksPanel'; import { ChannelsPanel } from '@/components/ChannelsPanel';
import { PairingPanel } from '@/components/PairingPanel'; import { MCPPanel } from '@/components/MCPPanel';
import { PromptStudioPanel } from '@/components/PromptStudioPanel';
import { TokenCostPanel } from '@/components/TokenCostPanel';
import { DailyUpdatesPanel } from '@/components/DailyUpdatesPanel';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { ConfigEditorPanel } from '@/components/ConfigEditorPanel';
import { usePanelLayoutStore } from '@/stores/panelLayoutStore';


type Panel = 'dashboard' | 'chat' | 'pipeline' | 'memory' | 'loop' | 'devtools' | 'research' | 'substack' | 'agent' | 'jarvis' | 'designer' | 'spaces' | 'mission' | 'taskboard' | 'deploy' | 'skills' | 'goals' | 'journal' | 'analytics' | 'session' | 'failureLogs' | 'insights' | 'settings' | 'contentPipeline' | 'automationQueue' | 'workspaces' | 'tokens' | 'updates' | 'cron' | 'plugins' | 'achievements' | 'configEditor' | 'webhooks' | 'channels' | 'pairing' | 'mcp' | 'social' | 'promptStudio';

const PANEL_COMPONENTS: Record<Panel, React.FC<any>> = {
  dashboard: Dashboard,
  chat: ChatWindow,
  pipeline: PipelineView as any,
  memory: MemoryGalaxy as any,
  loop: LoopEngineering as any,
  devtools: StudioView as any,
  research: ResearchMultiFormat as any,
  substack: ContentStudio as any,
  agent: AgentPanel,
  jarvis: JarvisPanel,
  designer: AgentDesigner,
  spaces: SpacesPanel,
  mission: MissionControl,
  taskboard: KanbanBoard,
  deploy: AgentDeploymentPanel,
  skills: SkillsPanel,
  goals: GoalsPanel,
  journal: JournalPanel,
  analytics: AnalyticsDashboard,
  session: SessionHistoryPanel,
  failureLogs: FailureLogsPanel,
  insights: InsightsPanel,
  settings: SettingsPanel,
  contentPipeline: ContentPipelinePanel,
  social: SocialPanel,
  automationQueue: AutomationQueuePanel,
  cron: CronPanel,
  plugins: PluginPanel,
  achievements: AchievementsPanel,
  configEditor: ConfigEditorPanel,
  webhooks: WebhooksPanel,
  channels: ChannelsPanel,
  pairing: PairingPanel,
  mcp: MCPPanel,
  workspaces: WorkspacePanel,
  tokens: TokenCostPanel,
  updates: DailyUpdatesPanel,
  promptStudio: PromptStudioPanel,
};

const PANEL_TITLES: Record<Panel, string> = {
  dashboard: 'Dashboard',
  chat: 'Chat',
  pipeline: 'Idea → Implement Pipeline',
  memory: 'Memory Galaxy',
  loop: 'Loop Engineering',
  devtools: 'DevTools',
  research: 'Research',
  substack: 'Content Studio',
  agent: 'Agent Roster',
  jarvis: 'Jarvis',
  designer: 'Agent Designer',
  spaces: 'Spaces',
  mission: 'Mission Control',
  taskboard: 'Task Board',
  deploy: 'Deployments',
  skills: 'Skills',
  goals: 'Goals',
  journal: 'Journal',
  analytics: 'Analytics',
  session: 'Sessions',
  failureLogs: 'Failure Logs',
  insights: 'Insights',
  settings: 'Settings',
  contentPipeline: 'Content Pipeline',
  social: 'Social',
  automationQueue: 'Automation Queue',
  cron: 'Cron',
  plugins: 'Plugins',
  achievements: 'Achievements',
  configEditor: 'Config Editor',
  webhooks: 'Webhooks',
  channels: 'Channels',
  pairing: 'Pairing',
  mcp: 'MCP Servers',
  workspaces: 'Workspaces',
  tokens: 'Token Costs',
  updates: 'Updates',
  promptStudio: 'Prompt Library',
};


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
  const activeSession = activeSessionId || 'default';

  // Ensure there's at least one session — use lazy initialization in sessionStore instead of effect

  // Global error handler for debugging React errors
  useEffect(() => {
    const handler = (e: ErrorEvent) => {
      console.error('[Global Error]', e.message, e.error?.stack?.split('\n').slice(0, 5).join('\n'));
    };
    const rejectionHandler = (e: PromiseRejectionEvent) => {
      console.error('[Unhandled Rejection]', e.reason?.message || e.reason);
    };
    window.addEventListener('error', handler);
    window.addEventListener('unhandledrejection', rejectionHandler);
    return () => {
      window.removeEventListener('error', handler);
      window.removeEventListener('unhandledrejection', rejectionHandler);
    };
  }, []);

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

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-[var(--overlay)] z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <Sidebar activePanel={activePanel} onNavigate={(panel) => setActivePanel(panel as Panel)} />

      {/* Main Content */}
      <div id="main-content" className="flex-1 flex flex-col min-w-0 relative" role="main">
        {/* Header */}
        <header
          className="h-[52px] border-b border-[var(--border)] flex items-center px-4 gap-2 bg-[var(--bg)]/60 backdrop-blur-md sticky top-0 z-30"
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
            {activePanel === 'chat' ? '' : (PANEL_TITLES[activePanel] || activePanel)}
          </h1>

          {/* Persona Selector - hidden on mobile */}
          <div className="hidden md:block"><PersonaSelector /></div>

          {/* Model Selector - hidden on mobile */}
          <div className="hidden md:block"><ModelSelector /></div>

          {/* Reasoning Effort - hidden on mobile */}
          <div className="hidden md:block"><ReasoningEffort /></div>

          {/* Voice Controls - hidden on mobile */}
          <div className="hidden md:block"><VoiceControls /></div>

          {/* Connection Status — only show when not default/connected to reduce clutter */}
          {connectionStatus !== 'connected' && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span
                className={`w-2 h-2 rounded-full ${connectionStatus === 'reconnecting' ? 'bg-[var(--warning)] animate-pulse' : connectionStatus === 'connecting' ? 'bg-[var(--warning)] animate-pulse' : 'bg-[var(--error)]'}`}
              />
              <span className="capitalize">{connectionStatus}</span>
            </div>
          )}
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <ErrorBoundary>
            {(() => {
              const Panel = PANEL_COMPONENTS[activePanel];
              if (!Panel) return null;
              return <Panel />;
            })()}
          </ErrorBoundary>
        </main>
        {/* Status Bar */}
        <StatusBar sessionId={activeSession} />
      </div>
    </div>
    </ErrorBoundary>
  );
}
