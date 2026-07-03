import { NextResponse } from 'next/server';
import sqlite3 from 'better-sqlite3';
import path from 'path';

const DB_PATH = '/home/rmckellar/overlord/data/overlord.db';
const db = new sqlite3(DB_PATH);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');

  if (!agentId) {
    return NextResponse.json({ error: 'agentId is required' }, { status: 400 });
  }

  try {
    const config = db.prepare('SELECT * FROM agent_configs WHERE id = ?').get(agentId) as any;
    
    if (!config) {
      return NextResponse.json({ error: 'Configuration not found' }, { status: 404 });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Get Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, role, system_prompt, model_id, temperature, max_tokens, capabilities } = body;

    if (!id || !name || !model_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const now = Date.now();
    const upsertConfig = db.prepare(`
      INSERT INTO agent_configs (id, name, role, system_prompt, model_id, temperature, max_tokens, capabilities, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name, 
        role = excluded.role, 
        system_prompt = excluded.system_prompt, 
        model_id = excluded.model_id, 
        temperature = excluded.temperature, 
        max_tokens = excluded.max_tokens, 
        capabilities = excluded.capabilities, 
        updated_at = excluded.updated_at
    `);

    upsertConfig.run(id, name, role, system_prompt, model_id, temperature, max_tokens, JSON.stringify(capabilities), now, now);

    return NextResponse.json({ success: true, message: 'Configuration saved' });
  } catch (error) {
    console.error('Save Config Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
