/**
 * Cognee Graph API — Returns the full knowledge graph from the Cognee DB
 * Falls back to building a live graph from the model graph + Obsidian memory vault
 * if the Cognee local DB does not exist.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { getAllAgents } from '@/lib/model-graph';

const COGNEE_DB = path.join(
  os.homedir(),
  '.hermes/hermes-agent/venv/lib/python3.11/site-packages/cognee/.cognee_system/databases/cognee_db'
);

const VAULT_DIR = path.join(os.homedir(), 'wiki', 'overlord-memories');

// Graph Types
interface GraphNode {
  id: string;
  slug: string;
  label: string;
  type: string;
  text?: string;
  created_at?: string;
  topological_rank?: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship?: string;
  label?: string;
  text?: string;
  created_at?: string;
}

interface VaultMemory {
  id: string;
  source: string;
  type: string;
  tags: string[];
  content: string;
  createdAt: string | null;
}

// Helper to sanitize labels
function cleanLabel(text: string, maxLen = 30): string {
  if (!text) return '';
  const clean = text.replace(/##\s*[a-zA-Z]+\s*:\s*/g, '').trim();
  if (clean.length > maxLen) {
    return clean.slice(0, maxLen) + '...';
  }
  return clean;
}

// 1. Fetch memories from Obsidian vault
async function getVaultMemories(): Promise<VaultMemory[]> {
  try {
    await fs.mkdir(VAULT_DIR, { recursive: true });
    const files = await fs.readdir(VAULT_DIR);
    const memories: VaultMemory[] = [];
    for (const file of files) {
      if (file === 'Memory Index.md' || !file.endsWith('.md')) continue;
      
      const content = await fs.readFile(path.join(VAULT_DIR, file), 'utf-8');
      
      // Parse frontmatter
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!fmMatch) continue;
      
      const fmText = fmMatch[1];
      const source = fmText.match(/^source:\s*(.+)/m)?.[1] || 'overlord';
      const typeMatch = fmText.match(/^type:\s*(.+)/m)?.[1] || 'fact';
      const tagsMatch = fmText.match(/^tags:\s*\[(.+)\]/m)?.[1] || '';
      const idMatch = fmText.match(/^memory_id:\s*(.+)/m)?.[1] || '';
      const createdMatch = fmText.match(/^created:\s*(.+)/m)?.[1] || '';
      
      const body = content.replace(/^---\n[\s\S]*?\n---\n*/, '').trim();
      
      memories.push({
        id: idMatch || file,
        source,
        type: typeMatch,
        tags: tagsMatch ? tagsMatch.split(', ').map((t: string) => t.trim()).filter(Boolean) : [],
        content: body.replace(/^## .+\n*/, '').replace(/\*Source: .+$/, '').trim(),
        createdAt: createdMatch || null,
      });
    }
    return memories;
  } catch {
    return [];
  }
}

// 2. Query Cognee SQLite DB directly (with Python script helper)
async function queryCogneeGraph(limit: number): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  try {
    // Check if DB exists
    try {
      await fs.access(COGNEE_DB);
    } catch {
      return { nodes: [], edges: [] };
    }

    const pythonScript = [
      'import sqlite3',
      'import json',
      '',
      `conn = sqlite3.connect('${COGNEE_DB}')`,
      "conn.row_factory = sqlite3.Row",
      'cur = conn.cursor()',
      '',
      '# Get nodes with their attributes',
      'cur.execute("""',
      '    SELECT n.id, n.slug, n.label, n.type, n.attributes, n.created_at',
      '    FROM nodes n',
      '    ORDER BY n.created_at DESC',
      `    LIMIT ${limit}`,
      '""")',
      'nodes = []',
      'node_ids = set()',
      'for row in cur.fetchall():',
      "    attrs = json.loads(row['attributes']) if row['attributes'] else {}",
      "    text = attrs.get('text', '')",
      '    if len(text) > 200:',
      "        text = text[:200] + '...'",
      '    nodes.append({',
      "        id: row['id'],",
      "        slug: row['slug'] if row['slug'] else row['id'],",
      "        label: row['label'] if row['label'] else row['slug'],",
      "        type: row['type'],",
      '        text: text,',
      "        created_at: row['created_at'],",
      "        topological_rank: attrs.get('topological_rank', 0),",
      '    })',
      "    node_ids.add(row['id'])",
      '',
      '# Get edges (only between nodes we fetched)',
      'edges = []',
      'if node_ids:',
      "    placeholders = ','.join(['?' for _ in node_ids])",
      '    cur.execute(f"""',
      '        SELECT id, source_node_id, destination_node_id, relationship_name, label, attributes, created_at',
      '        FROM edges',
      '        WHERE source_node_id IN ({placeholders})',
      '           OR destination_node_id IN ({placeholders})',
      `        LIMIT ${limit * 2}`,
      '    """, list(node_ids) + list(node_ids))',
      '    for row in cur.fetchall():',
      "        attrs = json.loads(row['attributes']) if row['attributes'] else {}",
      "        edge_text = attrs.get('edge_text', '')",
      '        if len(edge_text) > 150:',
      "            edge_text = edge_text[:150] + '...'",
      '        edges.append({',
      "            id: row['id'],",
      "            source: row['source_node_id'],",
      "            target: row['destination_node_id'],",
      "            relationship: row['relationship_name'],",
      "            label: row['label'],",
      '            text: edge_text,',
      "            created_at: row['created_at'],",
      '        })',
      '',
      'conn.close()',
      "print(json.dumps({'nodes': nodes, 'edges': edges}))",
    ].join('\n');

    const tmpScript = path.join(os.tmpdir(), 'cognee_graph.py');
    await fs.writeFile(tmpScript, pythonScript, 'utf-8');

    let stdout;
    try {
      stdout = execSync(`python3 ${tmpScript}`, { timeout: 15000, encoding: 'utf-8' });
    } catch {
      try {
        stdout = execSync(`python ${tmpScript}`, { timeout: 15000, encoding: 'utf-8' });
      } catch (err: unknown) {
        throw new Error(`Python execution failed: ${(err as Error).message || err}`);
      }
    }

    const data = JSON.parse(stdout);
    return { nodes: data.nodes || [], edges: data.edges || [] };
  } catch {
    return { nodes: [], edges: [] };
  }
}

// 3. Fallback: Build rich live graph dynamically
async function buildFallbackGraph(): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  // Add agents as nodes
  const agents = getAllAgents();
  const taskCategories = new Set<string>();

  agents.forEach((agent) => {
    // Add Agent node
    nodes.push({
      id: `agent:${agent.role}`,
      slug: agent.role,
      label: agent.role.charAt(0).toUpperCase() + agent.role.slice(1).replace('-', ' '),
      type: 'person', // maps to TYPE_COLORS.person (cyan)
      text: `Agent running model: ${agent.model}. Provider: ${agent.provider}. Allowed tasks: ${agent.allowedTasks.join(', ')}.`,
      created_at: new Date().toISOString(),
      topological_rank: 2,
    });

    // Track allowed tasks
    agent.allowedTasks.forEach((task) => {
      taskCategories.add(task);

      // Edge from Agent -> Task
      edges.push({
        id: `edge:agent:${agent.role}->task:${task}`,
        source: `agent:${agent.role}`,
        target: `task:${task}`,
        relationship: 'handles',
        label: 'handles',
        text: `Agent handles ${task} operations`,
        created_at: new Date().toISOString(),
      });
    });
  });

  // Add Task Category nodes
  taskCategories.forEach((task) => {
    nodes.push({
      id: `task:${task}`,
      slug: task,
      label: task.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      type: 'todo', // maps to TYPE_COLORS.todo (amber)
      text: `Task category matching agent model configuration`,
      created_at: new Date().toISOString(),
      topological_rank: 1,
    });
  });

  // Read memories from Obsidian
  const memories = await getVaultMemories();
  const addedTags = new Set<string>();

  memories.forEach((mem) => {
    // Add Memory node
    nodes.push({
      id: `memory:${mem.id}`,
      slug: `mem-${mem.id}`,
      label: cleanLabel(mem.content),
      type: 'memory', // maps to TYPE_COLORS.memory (purple)
      text: mem.content,
      created_at: mem.createdAt || new Date().toISOString(),
      topological_rank: 0,
    });

    // Link Memory -> Source Agent
    const matchedAgent = agents.find(a => a.role === mem.source.toLowerCase());
    if (matchedAgent) {
      edges.push({
        id: `edge:agent:${matchedAgent.role}->memory:${mem.id}`,
        source: `agent:${matchedAgent.role}`,
        target: `memory:${mem.id}`,
        relationship: 'remembered',
        label: 'remembered',
        text: `Agent recorded this memory`,
        created_at: new Date().toISOString(),
      });
    }

    // Add and link Tags
    mem.tags.forEach((tag: string) => {
      const tagId = `tag:${tag.toLowerCase()}`;
      if (!addedTags.has(tagId)) {
        nodes.push({
          id: tagId,
          slug: tag,
          label: `#${tag}`,
          type: 'concept', // maps to TYPE_COLORS.concept (rose)
          text: `Tag grouping for memories: ${tag}`,
          created_at: new Date().toISOString(),
          topological_rank: 0,
        });
        addedTags.add(tagId);
      }

      // Edge from Memory -> Tag
      edges.push({
        id: `edge:memory:${mem.id}->tag:${tag}`,
        source: `memory:${mem.id}`,
        target: tagId,
        relationship: 'tagged',
        label: 'tagged',
        text: `Memory categorized under #${tag}`,
        created_at: new Date().toISOString(),
      });
    });
  });

  return { nodes, edges };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    // 1. Try querying the local sqlite Cognee DB
    let { nodes, edges } = await queryCogneeGraph(limit);

    // 2. If no data, build fallback dynamic graph
    if (nodes.length === 0) {
      const fallback = await buildFallbackGraph();
      nodes = fallback.nodes;
      edges = fallback.edges;
    }

    return NextResponse.json({
      success: true,
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
