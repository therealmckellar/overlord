
import { NextResponse } from 'next/server';

/**
 * Returns server-side configuration for API keys and MCP servers.
 * Keys are masked (first 8 + last 4 chars) for security.
 * This allows the UI to show what's configured in .env
 * while keeping full keys server-side only.
 */

function maskKey(key: string): string {
  if (!key || key.length < 12) return '••••••••';
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

export async function GET() {
  // Collect API keys from environment
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

  // OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    apiKeys.push({
      id: 'env_openrouter',
      name: 'OpenRouter',
      service: 'openrouter',
      key: maskKey(process.env.OPENROUTER_API_KEY),
      maskedKey: maskKey(process.env.OPENROUTER_API_KEY),
      baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
      model: process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha',
      enabled: true,
      source: 'env',
    });
  }

  // Brave Search
  if (process.env.BRAVE_API_KEY) {
    apiKeys.push({
      id: 'env_brave',
      name: 'Brave Search',
      service: 'brave',
      key: maskKey(process.env.BRAVE_API_KEY),
      maskedKey: maskKey(process.env.BRAVE_API_KEY),
      enabled: true,
      source: 'env',
    });
  }

  // Deepgram (STT)
  if (process.env.DEEPGRAM_API_KEY) {
    apiKeys.push({
      id: 'env_deepgram',
      name: 'Deepgram',
      service: 'deepgram',
      key: maskKey(process.env.DEEPGRAM_API_KEY),
      maskedKey: maskKey(process.env.DEEPGRAM_API_KEY),
      enabled: true,
      source: 'env',
    });
  }

  // Cognee
  if (process.env.COGNEE_LLM_API_KEY || process.env.LLM_API_KEY) {
    apiKeys.push({
      id: 'env_cognee',
      name: 'Cognee LLM',
      service: 'cognee',
      key: maskKey(process.env.COGNEE_LLM_API_KEY || process.env.LLM_API_KEY || ''),
      maskedKey: maskKey(process.env.COGNEE_LLM_API_KEY || process.env.LLM_API_KEY || ''),
      model: process.env.COGNEE_LLM_MODEL || 'openai/gpt-oss-120b:free',
      enabled: true,
      source: 'env',
    });
  }

  // Stitch (Google)
  if (process.env.STITCH_API_KEY) {
    apiKeys.push({
      id: 'env_stitch',
      name: 'Google Stitch',
      service: 'stitch',
      key: maskKey(process.env.STITCH_API_KEY),
      maskedKey: maskKey(process.env.STITCH_API_KEY),
      enabled: true,
      source: 'env',
    });
  }

  // Collect MCP servers from environment
  const mcpServers: Array<{
    id: string;
    name: string;
    url: string;
    transport: 'stdio' | 'sse' | 'http';
    description?: string;
    enabled: boolean;
    source: 'env';
  }> = [];

  // Parse MCP servers from env (format: MCP_SERVER_NAME=url, optional: MCP_SERVER_NAME_TRANSPORT=stdio|sse|http)
  const mcpEnvVars = Object.entries(process.env).filter(([key]) => key.startsWith('MCP_') && !key.includes('_TRANSPORT'));
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

  return NextResponse.json({
    success: true,
    data: {
      apiKeys,
      mcpServers,
      // Also expose some global config
      config: {
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:9125',
        nodeEnv: process.env.NODE_ENV || 'development',
        defaultModel: process.env.OPENROUTER_MODEL || 'openrouter/owl-alpha',
      },
    },
  });
}
