import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CHANNEL_DIR_PATH = path.join(os.homedir(), '.hermes', 'channel_directory.json');

export async function GET() {
  try {
    const data = await fs.readFile(CHANNEL_DIR_PATH, 'utf8');
    const parsed = JSON.parse(data);
    // Transform to our format
    const platforms: Record<string, { channels: unknown[]; contacts: unknown[] }> = {};
    if (parsed.platforms) {
      for (const [name, channels] of Object.entries(parsed.platforms)) {
        platforms[name] = { channels: Array.isArray(channels) ? channels : [], contacts: [] };
      }
    } else if (Array.isArray(parsed)) {
      // Legacy format: flat array
      for (const entry of parsed) {
        const platform = entry.platform || 'unknown';
        if (!platforms[platform]) platforms[platform] = { channels: [], contacts: [] };
        platforms[platform].channels.push(entry);
      }
    }
    return NextResponse.json({ platforms, lastUpdated: new Date().toISOString() });
  } catch {
    return NextResponse.json({ platforms: {}, lastUpdated: new Date().toISOString() });
  }
}
