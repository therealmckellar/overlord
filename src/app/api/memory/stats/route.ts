/**
 * Memory Stats API — Returns Cognee graph stats + vault file count.
 */
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const VAULT_DIR = path.join(os.homedir(), 'wiki', 'overlord-memories');
const COGNEE_DB = path.join(
  os.homedir(),
  '.hermes/hermes-agent/venv/lib/python3.11/site-packages/cognee/.cognee_system/databases/cognee_db'
);

async function queryCogneeStats(): Promise<{ nodes: number; edges: number; data: number }> {
  try {
    // Use the hermes venv Python which has sqlite3 built-in
    const pythonCode = `
import sqlite3
conn = sqlite3.connect('${COGNEE_DB}')
cur = conn.cursor()
cur.execute("SELECT count(*) FROM nodes")
nodes = cur.fetchone()[0]
cur.execute("SELECT count(*) FROM edges")
edges = cur.fetchone()[0]
cur.execute("SELECT count(*) FROM data")
data = cur.fetchone()[0]
conn.close()
print(f"{nodes},{edges},{data}")
`;
    
    // Write temp script
    const tmpScript = path.join(os.tmpdir(), 'cognee_stats.py');
    await fs.writeFile(tmpScript, pythonCode, 'utf-8');
    
    const { execSync } = require('child_process');
    const stdout = execSync(`python3 ${tmpScript}`, { timeout: 10000, encoding: 'utf-8' });
    
    const [nodes, edges, data] = stdout.trim().split(',').map(Number);
    return { nodes: nodes || 0, edges: edges || 0, data: data || 0 };
  } catch {
    return { nodes: 0, edges: 0, data: 0 };
  }
}

export async function GET() {
  try {
    // Count vault files
    let vaultCount = 0;
    try {
      const files = await fs.readdir(VAULT_DIR);
      vaultCount = files.filter((f: string) => f.endsWith('.md') && f !== 'Memory Index.md').length;
    } catch {
      // Vault dir doesn't exist yet
    }

    // Query cognee
    const { nodes, edges, data } = await queryCogneeStats();

    return NextResponse.json({
      success: true,
      nodes,
      edges,
      data,
      memories: vaultCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
