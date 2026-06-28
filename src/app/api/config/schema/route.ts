import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_PATH = path.join(os.homedir(), '.hermes', 'config.yaml');

// Read config.yaml and return schema-like structure
export async function GET() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf8');
    // Parse YAML-like structure into categories
    // For now, return the raw yaml and a basic field map
    const lines = raw.split('\n');
    const fields: Record<string, { key: string; type: string; default: string; description: string; category: string }> = {};
    let currentCategory = 'general';

    for (const line of lines) {
      // Category headers: lines with no indent and ending with :
      if (line && !line.startsWith(' ') && !line.startsWith('#') && line.includes(':')) {
        const catName = line.split(':')[0].trim();
        if (!catName.includes('_') && catName.length > 0 && isNaN(Number(catName))) {
          currentCategory = catName;
        }
      }
    }

    return NextResponse.json({
      fields,
      category_order: ['general', 'agent', 'terminal', 'display', 'memory', 'security', 'delegation', 'model_catalog', 'openrouter', 'logging', 'sessions'],
      raw_config: raw,
    });
  } catch {
    return NextResponse.json({
      fields: {},
      category_order: [],
      raw_config: '',
    }, { status: 200 });
  }
}
