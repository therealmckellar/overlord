/**
 * Zustand Store — Connectors (API keys, MCP servers, external services)
 * Manages configuration for all external integrations.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConnectorStatus = 'connected' | 'disconnected' | 'error' | 'testing';

export interface APIKey {
  id: string;
  name: string; // e.g. "OpenRouter", "OpenAI", "Anthropic"
  service: string; // internal slug: openrouter, openai, anthropic, etc.
  key: string; // the actual API key (stored locally only)
  baseUrl?: string; // optional custom base URL
  model?: string; // default model for this provider
  enabled: boolean;
  status: ConnectorStatus;
  lastTested: number | null;
  errorMessage?: string;
}

export interface MCPServer {
  id: string;
  name: string; // e.g. "Browser Rendering", "TradingView", "Google Stitch"
  url: string; // MCP server URL
  transport: 'stdio' | 'sse' | 'http';
  enabled: boolean;
  status: ConnectorStatus;
  description?: string;
  lastTested: number | null;
  errorMessage?: string;
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  secret: string;
  events: string[];
  enabled: boolean;
  status: ConnectorStatus;
  lastTriggered: number | null;
  errorMessage?: string;
}

export interface ModelDefaults {
  defaultModel: string;
  fallbackModel: string;
  defaultTemperature: number;
  defaultMaxTokens: number;
  defaultReasoningEffort: 'low' | 'medium' | 'high';
  autoSelectModel: boolean;
}

export interface NotificationSettings {
  desktopEnabled: boolean;
  soundEnabled: boolean;
  taskComplete: boolean;
  taskFailed: boolean;
  agentError: boolean;
  deploySuccess: boolean;
  deployFailed: boolean;
  dailyDigestTime: string;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  ipWhitelist: string[];
  allowLocalhostOnly: boolean;
  lockdownMode: boolean;
}

export interface SystemSettings {
  defaultAgent: string;
  maxConcurrentAgents: number;
  maxLoopIterations: number;
  logRetentionDays: number;
  autoSaveInterval: number;
  compactionEnabled: boolean;
  debugMode: boolean;
}

export interface ConnectorState {
  apiKeys: APIKey[];
  mcpServers: MCPServer[];
  webhooks: WebhookEndpoint[];
  modelDefaults: ModelDefaults;
  notifications: NotificationSettings;
  security: SecuritySettings;
  system: SystemSettings;

  // API Keys
  addAPIKey: (key: Omit<APIKey, 'id' | 'status' | 'lastTested'>) => string;
  updateAPIKey: (id: string, updates: Partial<APIKey>) => void;
  deleteAPIKey: (id: string) => void;
  testAPIKey: (id: string) => Promise<boolean>;

  // MCP Servers
  addMCPServer: (server: Omit<MCPServer, 'id' | 'status' | 'lastTested'>) => string;
  updateMCPServer: (id: string, updates: Partial<MCPServer>) => void;
  deleteMCPServer: (id: string) => void;
  testMCPServer: (id: string) => Promise<boolean>;

  // Webhooks
  addWebhook: (webhook: Omit<WebhookEndpoint, 'id' | 'status' | 'lastTriggered'>) => string;
  updateWebhook: (id: string, updates: Partial<WebhookEndpoint>) => void;
  deleteWebhook: (id: string) => void;
  testWebhook: (id: string) => Promise<boolean>;

  // Model Defaults
  updateModelDefaults: (updates: Partial<ModelDefaults>) => void;

  // Notifications
  updateNotifications: (updates: Partial<NotificationSettings>) => void;

  // Security
  updateSecurity: (updates: Partial<SecuritySettings>) => void;

  // System
  updateSystem: (updates: Partial<SystemSettings>) => void;

  // Seed from server
  seedFromServer: (serverKeys: Partial<APIKey>[], serverMCPs: Partial<MCPServer>[]) => void;
}

const generateId = () => `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const useConnectorStore = create<ConnectorState>()(
  persist(
    (set, get) => ({
      apiKeys: [
        {
          id: 'default_openrouter',
          name: 'OpenRouter',
          service: 'openrouter',
          key: '', // populated from env or user input
          baseUrl: 'https://openrouter.ai/api/v1',
          model: 'openrouter/owl-alpha',
          enabled: true,
          status: 'disconnected',
          lastTested: null,
        },
      ],
      mcpServers: [],
      webhooks: [],
      modelDefaults: {
        defaultModel: 'openrouter/owl-alpha',
        fallbackModel: 'openai/gpt-oss-120b:free',
        defaultTemperature: 0.7,
        defaultMaxTokens: 4096,
        defaultReasoningEffort: 'medium',
        autoSelectModel: true,
      },
      notifications: {
        desktopEnabled: true,
        soundEnabled: true,
        taskComplete: true,
        taskFailed: true,
        agentError: true,
        deploySuccess: true,
        deployFailed: true,
        dailyDigestTime: '09:00',
      },
      security: {
        twoFactorEnabled: false,
        sessionTimeout: 60,
        ipWhitelist: [],
        allowLocalhostOnly: false,
        lockdownMode: false,
      },
      system: {
        defaultAgent: 'hermes',
        maxConcurrentAgents: 3,
        maxLoopIterations: 50,
        logRetentionDays: 30,
        autoSaveInterval: 30,
        compactionEnabled: true,
        debugMode: false,
      },

      addAPIKey: (key) => {
        const id = generateId();
        set((state) => ({
          apiKeys: [...state.apiKeys, { ...key, id, status: 'disconnected', lastTested: null }],
        }));
        return id;
      },

      updateAPIKey: (id, updates) => {
        set((state) => ({
          apiKeys: state.apiKeys.map((k) => (k.id === id ? { ...k, ...updates } : k)),
        }));
      },

      deleteAPIKey: (id) => {
        set((state) => ({
          apiKeys: state.apiKeys.filter((k) => k.id !== id),
        }));
      },

      testAPIKey: async (id) => {
        const key = get().apiKeys.find((k) => k.id === id);
        if (!key) return false;

        set((state) => ({
          apiKeys: state.apiKeys.map((k) => (k.id === id ? { ...k, status: 'testing' as const } : k)),
        }));

        // Simulate a test — in production this would make a lightweight API call
        await new Promise((r) => setTimeout(r, 1500));

        const success = key.key.length > 10; // basic validation
        set((state) => ({
          apiKeys: state.apiKeys.map((k) =>
            k.id === id
              ? {
                  ...k,
                  status: success ? ('connected' as const) : ('error' as const),
                  lastTested: Date.now(),
                  errorMessage: success ? undefined : 'Invalid key format',
                }
              : k
          ),
        }));
        return success;
      },

      addMCPServer: (server) => {
        const id = generateId();
        set((state) => ({
          mcpServers: [...state.mcpServers, { ...server, id, status: 'disconnected', lastTested: null }],
        }));
        return id;
      },

      updateMCPServer: (id, updates) => {
        set((state) => ({
          mcpServers: state.mcpServers.map((s) => (s.id === id ? { ...s, ...updates } : s)),
        }));
      },

      deleteMCPServer: (id) => {
        set((state) => ({
          mcpServers: state.mcpServers.filter((s) => s.id !== id),
        }));
      },

      testMCPServer: async (id) => {
        const server = get().mcpServers.find((s) => s.id === id);
        if (!server) return false;

        set((state) => ({
          mcpServers: state.mcpServers.map((s) => (s.id === id ? { ...s, status: 'testing' as const } : s)),
        }));

        await new Promise((r) => setTimeout(r, 1500));

        const success = server.url.startsWith('http') || server.url.startsWith('ws');
        set((state) => ({
          mcpServers: state.mcpServers.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: success ? ('connected' as const) : ('error' as const),
                  lastTested: Date.now(),
                  errorMessage: success ? undefined : 'Invalid URL format',
                }
              : s
          ),
        }));
        return success;
      },

      // Webhooks
      addWebhook: (webhook) => {
        const id = generateId();
        set((state) => ({
          webhooks: [...state.webhooks, { ...webhook, id, status: 'disconnected', lastTriggered: null }],
        }));
        return id;
      },

      updateWebhook: (id, updates) => {
        set((state) => ({
          webhooks: state.webhooks.map((w) => (w.id === id ? { ...w, ...updates } : w)),
        }));
      },

      deleteWebhook: (id) => {
        set((state) => ({
          webhooks: state.webhooks.filter((w) => w.id !== id),
        }));
      },

      testWebhook: async (id) => {
        const webhook = get().webhooks.find((w) => w.id === id);
        if (!webhook) return false;

        set((state) => ({
          webhooks: state.webhooks.map((w) => (w.id === id ? { ...w, status: 'testing' as const } : w)),
        }));

        await new Promise((r) => setTimeout(r, 1000));

        const success = webhook.url.startsWith('http');
        set((state) => ({
          webhooks: state.webhooks.map((w) =>
            w.id === id
              ? {
                  ...w,
                  status: success ? ('connected' as const) : ('error' as const),
                  lastTriggered: success ? Date.now() : null,
                  errorMessage: success ? undefined : 'Invalid URL format',
                }
              : w
          ),
        }));
        return success;
      },

      // Settings updates
      updateModelDefaults: (updates) => {
        set((state) => ({
          modelDefaults: { ...state.modelDefaults, ...updates },
        }));
      },

      updateNotifications: (updates) => {
        set((state) => ({
          notifications: { ...state.notifications, ...updates },
        }));
      },

      updateSecurity: (updates) => {
        set((state) => ({
          security: { ...state.security, ...updates },
        }));
      },

      updateSystem: (updates) => {
        set((state) => ({
          system: { ...state.system, ...updates },
        }));
      },

      seedFromServer: (serverKeys, serverMCPs) => {
        set((state) => {
          // Merge: keep existing UI keys, add env keys that don't exist yet
          const existingKeyIds = new Set(state.apiKeys.map((k) => k.id));
          const existingMCPIds = new Set(state.mcpServers.map((s) => s.id));

          const newKeys: APIKey[] = (serverKeys as APIKey[])
            .filter((k) => k.id && !existingKeyIds.has(k.id))
            .map((k) => ({ ...k, status: 'disconnected' as const, lastTested: null }));

          const newMCPs: MCPServer[] = (serverMCPs as MCPServer[])
            .filter((s) => s.id && !existingMCPIds.has(s.id))
            .map((s) => ({ ...s, status: 'disconnected' as const, lastTested: null }));

          return {
            apiKeys: [...state.apiKeys, ...newKeys],
            mcpServers: [...state.mcpServers, ...newMCPs],
          };
        });
      },
    }),
    { name: 'overlord-connectors' }
  )
);
