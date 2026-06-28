import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const PLUGINS_DIR = path.join(os.homedir(), '.hermes', 'plugins');

export async function GET() {
  try {
    const directories = await fs.readdir(PLUGINS_DIR);
    const plugins = [];

    for (const dir of directories) {
      const manifestPath = path.join(PLUGINS_DIR, dir, 'manifest.json');
      try {
        const manifestData = await fs.readFile(manifestPath, 'utf8');
        const manifest = JSON.parse(manifestData);
        plugins.push({
          id: dir,
          ...manifest,
          enabled: true, // Default or read from a config file
          configStatus: 'ok',
        });
      } catch (e) {
        // Skip directories without manifest.json
      }
    }

    return NextResponse.json(plugins);
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  if (body.action === 'rescan') {
    return NextResponse.json({ success: true, message: 'Plugins rescanned' });
  }
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
