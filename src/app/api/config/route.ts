
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * Comprehensive configuration endpoint.
 * Exposes ALL server-side connections for the Settings UI.
 * Keys are masked. OAuth shows client ID existence (not tokens).
 */

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••••••';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

function envExists(key: string): boolean {
  return !!(process.env[key] && process.env[key]!.trim().length > 0);
}

export async function GET() {
  // ═══════════════════════════════════════════
  // 1. API KEYS (from .env)
  // ═══════════════════════════════════════════
  const apiKeys: Array<{
    id: string;
    name: string;
    service: string;
    key: string;
    maskedKey: string;
    baseUrl?: string;
    model?: string;
    enabled: boolean;
    source: 'env';
  }> = [];

  if (envExists('OPENROUTER_API_KEY')) {
    apiKeys.push({
      id: 'env_openrouter',
      name: 'OpenRouter',
      service: 'openrouter',
      key: maskKey(process.env.OPENROUTER_API_KEY!),
      maskedKey: maskKey(process.env.OPENROUTER_API_KEY!),
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha',
      enabled: true,
      source: 'env',
    });
  }

  if (envExists('BRAVE_API_KEY')) {
    apiKeys.push({
      id: 'env_brave',
      name: 'Brave Search',
      service: 'brave',
      key: maskKey(process.env.BRAVE_API_KEY!),
      maskedKey: maskKey(process.env.BRAVE_API_KEY!),
      enabled: true,
      source: 'env',
    });
  }

  if (envExists('DEEPGRAM_API_KEY')) {
    apiKeys.push({
      id: 'env_deepgram',
      name: 'Deepgram (STT/TTS)',
      service: 'deepgram',
      key: maskKey(process.env.DEEPGRAM_API_KEY!),
      maskedKey: maskKey(process.env.DEEPGRAM_API_KEY!),
      enabled: true,
      source: 'env',
    });
  }

  if (envExists('COGNEE_LLM_API_KEY') || envExists('LLM_API_KEY')) {
    const key = process.env.COGNEE_LLM_API_KEY || process.env.LLM_API_KEY || '';
    apiKeys.push({
      id: 'env_cognee',
      name: 'Cognee LLM',
      service: 'cognee',
      key: maskKey(key),
      maskedKey: maskKey(key),
      model: process.env.COGNEE_LLM_MODEL || 'openai/gpt-oss-120b:free',
      enabled: true,
      source: 'env',
    });
  }

  if (envExists('STITCH_API_KEY')) {
    apiKeys.push({
      id: 'env_stitch',
      name: 'Google Stitch',
      service: 'stitch',
      key: maskKey(process.env.STITCH_API_KEY!),
      maskedKey: maskKey(process.env.STITCH_API_KEY!),
      enabled: true,
      source: 'env',
    });
  }

  if (envExists('WANDB_API_KEY')) {
    apiKeys.push({
      id: 'env_wandb',
      name: 'Weights & Biases',
      service: 'wandb',
      key: maskKey(process.env.WANDB_API_KEY!),
      maskedKey: maskKey(process.env.WANDB_API_KEY!),
      enabled: true,
      source: 'env',
    });
  }

  // ═══════════════════════════════════════════
  // 2. OAUTH CONNECTIONS
  // ═══════════════════════════════════════════
  const oauthConnections: Array<{
    id: string;
    name: string;
    service: string;
    clientId: string;
    status: 'configured' | 'not_configured';
    authUrl?: string;
    source: 'env';
  }> = [];

  // Google (Drive, Gmail, Sheets)
  if (envExists('GOOGLE_CLIENT_ID') || envExists('GOOGLE_CLIENT_SECRET')) {
    oauthConnections.push({
      id: 'env_google',
      name: 'Google (Drive / Gmail / Sheets)',
      service: 'google',
      clientId: process.env.GOOGLE_CLIENT_ID ? maskKey(process.env.GOOGLE_CLIENT_ID) : '—',
      status: 'configured',
      authUrl: '/api/auth/google/connect',
      source: 'env',
    });
  }

  // GitHub
  if (envExists('GITHUB_CLIENT_ID') || envExists('GITHUB_CLIENT_SECRET')) {
    oauthConnections.push({
      id: 'env_github',
      name: 'GitHub',
      service: 'github',
      clientId: process.env.GITHUB_CLIENT_ID ? maskKey(process.env.GITHUB_CLIENT_ID) : '—',
      status: 'configured',
      authUrl: '/api/auth/github/connect',
      source: 'env',
    });
  }

  // Discord Bot
  if (envExists('DISCORD_BOT_TOKEN') || envExists('DISCORD_CLIENT_ID')) {
    oauthConnections.push({
      id: 'env_discord',
      name: 'Discord',
      service: 'discord',
      clientId: process.env.DISCORD_CLIENT_ID ? maskKey(process.env.DISCORD_CLIENT_ID) : '—',
      status: 'configured',
      source: 'env',
    });
  }

  // Slack
  if (envExists('SLACK_BOT_TOKEN') || envExists('SLACK_CLIENT_ID')) {
    oauthConnections.push({
      id: 'env_slack',
      name: 'Slack',
      service: 'slack',
      clientId: process.env.SLACK_CLIENT_ID ? maskKey(process.env.SLACK_CLIENT_ID) : '—',
      status: 'configured',
      source: 'env',
    });
  }

  // X / Twitter
  if (envExists('X_CLIENT_ID') || envExists('X_CLIENT_SECRET')) {
    oauthConnections.push({
      id: 'env_x',
      name: 'X (Twitter)',
      service: 'x',
      clientId: process.env.X_CLIENT_ID ? maskKey(process.env.X_CLIENT_ID) : '—',
      status: 'configured',
      source: 'env',
    });
  }

  // ═══════════════════════════════════════════
  // 3. MCP SERVERS
  // ═══════════════════════════════════════════
  const mcpServers: Array<{
    id: string;
    name: string;
    url: string;
    transport: 'stdio' | 'sse' | 'http';
    description?: string;
    enabled: boolean;
    source: 'env';
  }> = [];

  const mcpEnvVars = Object.entries(process.env).filter(
    ([key]) => key.startsWith('MCP_') && !key.includes('_TRANSPORT') && !key.includes('_API_KEY')
  );
  for (const [key, value] of mcpEnvVars) {
    const name = key.replace('MCP_', '').replace(/_/g, ' ');
    const transportKey = `${key}_TRANSPORT`;
    const transport = (process.env[transportKey] as 'stdio' | 'sse' | 'http') || 'http';
    mcpServers.push({
      id: `env_mcp_${key.toLowerCase()}`,
      name,
      url: value || '',
      transport,
      enabled: true,
      source: 'env',
    });
  }

  // ═══════════════════════════════════════════
  // 4. INTEGRATIONS (service configs without keys)
  // ═══════════════════════════════════════════
  const integrations: Array<{
    id: string;
    name: string;
    service: string;
    status: 'configured' | 'not_configured';
    config: Record<string, string>;
    source: 'env';
  }> = [];

  // Cloudflare
  if (envExists('CLOUDFLARE_API_KEY') || envExists('CLOUDFLARE_ACCOUNT_ID')) {
    integrations.push({
      id: 'env_cloudflare',
      name: 'Cloudflare (R2 / Tunnels / Workers)',
      service: 'cloudflare',
      status: 'configured',
      config: {
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID ? maskKey(process.env.CLOUDFLARE_ACCOUNT_ID) : '—',
        r2Bucket: process.env.CLOUDFLARE_R2_BUCKET || '—',
        tunnelId: process.env.CLOUDFLARE_TUNNEL_ID ? '••••' : '—',
      },
      source: 'env',
    });
  }

  // Notion
  if (envExists('NOTION_API_KEY') || envExists('NOTION_INTEGRATION_TOKEN')) {
    integrations.push({
      id: 'env_notion',
      name: 'Notion',
      service: 'notion',
      status: 'configured',
      config: {},
      source: 'env',
    });
  }

  // Airtable
  if (envExists('AIRTABLE_API_KEY') || envExists('AIRTABLE_PERSONAL_ACCESS_TOKEN')) {
    integrations.push({
      id: 'env_airtable',
      name: 'Airtable',
      service: 'airtable',
      status: 'configured',
      config: {},
      source: 'env',
    });
  }

  // Firecrawl
  if (envExists('FIRECRAWL_API_KEY')) {
    integrations.push({
      id: 'env_firecrawl',
      name: 'Firecrawl',
      service: 'firecrawl',
      status: 'configured',
      config: {},
      source: 'env',
    });
  }

  // ═══════════════════════════════════════════
  // 5. SYSTEM CONFIG (non-sensitive)
  // ═══════════════════════════════════════════
  const systemConfig = {
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9125',
    nodeEnv: process.env.NODE_ENV || 'development',
    defaultModel: process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha',
    dbPath: process.env.DB_PATH || './data/overlord.db',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  };

  return NextResponse.json({
    success: true,
    data: {
      apiKeys,
      oauthConnections,
      mcpServers,
      integrations,
      systemConfig,
    },
  });
}
