/**
 * Cognee Graph API
 * GET  — Returns full knowledge graph (Cognee DB → rich fallback)
 * POST — Same but accepts client-side store data (goals, memories, journal)
 *        to augment the graph with localStorage-persisted knowledge.
 *
 * The fallback graph prioritises actual knowledge content — memories,
 * insights, decisions, goals, journal entries — over the old agent→task map.
 * Agents are a secondary cluster used to attribute authorship.
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

// ── Graph Types ───────────────────────────────────────────────────────────────

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

// Client-side store types (subset we care about)
interface ClientMemory {
  id: string;
  content: string;
  source: string;
  tags: string[];
  timestamp: number;
  type: string;
}

interface ClientGoal {
  id: string;
  title: string;
  description: string;
  progress: number;
  status: string;
  linkedAgents: string[];
  linkedTasks: string[];
  createdAt: number;
}

interface ClientJournal {
  id: string;
  date: string;
  content: string;
  type: string;
  agentName: string | null;
  timestamp: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function cleanLabel(text: string, maxLen = 35): string {
  if (!text) return '';
  const clean = text
    .replace(/^##\s*[a-zA-Z]+\s*:\s*/g, '')
    .replace(/\n[\s\S]*/, '') // first line only
    .trim();
  return clean.length > maxLen ? clean.slice(0, maxLen) + '…' : clean;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 60);
}

// ── 1. Obsidian vault memories ────────────────────────────────────────────────

async function getVaultMemories(): Promise<VaultMemory[]> {
  try {
    await fs.mkdir(VAULT_DIR, { recursive: true });
    const files = await fs.readdir(VAULT_DIR);
    const memories: VaultMemory[] = [];
    for (const file of files) {
      if (file === 'Memory Index.md' || !file.endsWith('.md')) continue;
      const content = await fs.readFile(path.join(VAULT_DIR, file), 'utf-8');
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

// ── 2. Cognee SQLite DB query ─────────────────────────────────────────────────

async function queryCogneeGraph(limit: number): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  try {
    try { await fs.access(COGNEE_DB); } catch { return { nodes: [], edges: [] }; }

    const pythonScript = [
      'import sqlite3, json',
      `conn = sqlite3.connect('${COGNEE_DB}')`,
      'conn.row_factory = sqlite3.Row',
      'cur = conn.cursor()',
      'cur.execute("""',
      '    SELECT n.id, n.slug, n.label, n.type, n.attributes, n.created_at',
      '    FROM nodes n ORDER BY n.created_at DESC',
      `    LIMIT ${limit}`,
      '""")',
      'nodes = []',
      'node_ids = set()',
      'for row in cur.fetchall():',
      "    attrs = json.loads(row['attributes']) if row['attributes'] else {}",
      "    text = attrs.get('text', '')",
      '    if len(text) > 200: text = text[:200] + "..."',
      '    nodes.append({',
      "        'id': row['id'],",
      "        'slug': row['slug'] if row['slug'] else row['id'],",
      "        'label': row['label'] if row['label'] else row['slug'],",
      "        'type': row['type'],",
      "        'text': text,",
      "        'created_at': row['created_at'],",
      "        'topological_rank': attrs.get('topological_rank', 0),",
      '    })',
      "    node_ids.add(row['id'])",
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
      '        if len(edge_text) > 150: edge_text = edge_text[:150] + "..."',
      '        edges.append({',
      "            'id': row['id'],",
      "            'source': row['source_node_id'],",
      "            'target': row['destination_node_id'],",
      "            'relationship': row['relationship_name'],",
      "            'label': row['label'],",
      "            'text': edge_text,",
      "            'created_at': row['created_at'],",
      '        })',
      'conn.close()',
      "print(json.dumps({'nodes': nodes, 'edges': edges}))",
    ].join('\n');

    const tmpScript = path.join(os.tmpdir(), 'cognee_graph.py');
    await fs.writeFile(tmpScript, pythonScript, 'utf-8');

    let stdout: string;
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

// ── 3. Knowledge-first fallback graph ─────────────────────────────────────────
//
// Priority order of graph content:
//   1. Memories (insight, fact, decision, context) — primary knowledge nodes
//   2. Goals — strategic layer
//   3. Journal entries — temporal narrative layer
//   4. Tags/concepts — clustering layer
//   5. Agents — attribution layer (small, secondary cluster)

async function buildFallbackGraph(clientData?: {
  memories?: ClientMemory[];
  goals?: ClientGoal[];
  journal?: ClientJournal[];
}): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];

  const now = new Date().toISOString();
  const addedTags = new Set<string>();
  const agents = getAllAgents();

  // ── Agents (small attribution cluster) ──────────────────────────────────────
  const agentIds = new Set<string>();
  agents.forEach((agent) => {
    const id = `agent:${agent.role}`;
    agentIds.add(id);
    nodes.push({
      id,
      slug: agent.role,
      label: agent.role.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: 'person',
      text: `AI agent · model: ${agent.model} · provider: ${agent.provider}`,
      created_at: now,
      topological_rank: 1,
    });
  });

  // ── Helper: ensure tag node exists ──────────────────────────────────────────
  function ensureTag(tag: string) {
    const tagId = `tag:${tag.toLowerCase().replace(/\s+/g, '-')}`;
    if (!addedTags.has(tagId)) {
      nodes.push({
        id: tagId,
        slug: slug(tag),
        label: `#${tag}`,
        type: 'concept',
        text: `Knowledge cluster: ${tag}`,
        created_at: now,
        topological_rank: 0,
      });
      addedTags.add(tagId);
    }
    return tagId;
  }

  function linkToTag(sourceId: string, tag: string) {
    const tagId = ensureTag(tag);
    edges.push({
      id: `edge:${sourceId}→${tagId}`,
      source: sourceId,
      target: tagId,
      relationship: 'tagged',
      label: 'tagged',
      created_at: now,
    });
  }

  function linkToAgent(sourceId: string, agentName: string, rel = 'authored-by') {
    const agentId = `agent:${agentName.toLowerCase()}`;
    if (agentIds.has(agentId)) {
      edges.push({
        id: `edge:${sourceId}→${agentId}`,
        source: sourceId,
        target: agentId,
        relationship: rel,
        label: rel,
        created_at: now,
      });
    }
  }

  // ── Obsidian vault memories (filesystem) ────────────────────────────────────
  const vaultMems = await getVaultMemories();
  vaultMems.forEach((mem) => {
    const id = `memory:${mem.id}`;
    nodes.push({
      id,
      slug: `mem-${slug(mem.content.slice(0, 40))}`,
      label: cleanLabel(mem.content),
      type: mem.type === 'insight' ? 'insight' : mem.type === 'decision' ? 'decision' : mem.type === 'todo' ? 'todo' : 'memory',
      text: mem.content.slice(0, 300),
      created_at: mem.createdAt || now,
      topological_rank: 2,
    });
    mem.tags.forEach(t => linkToTag(id, t));
    linkToAgent(id, mem.source, 'remembered');
  });

  // ── Client-side memories (from localStorage via POST body) ──────────────────
  const clientMems = clientData?.memories ?? [];
  clientMems.forEach((mem) => {
    const id = `cmem:${mem.id}`;
    // Don't duplicate if vault already has same id
    if (nodes.find(n => n.id === `memory:${mem.id}`)) return;
    nodes.push({
      id,
      slug: `cmem-${slug(mem.content.slice(0, 40))}`,
      label: cleanLabel(mem.content),
      type: mem.type === 'insight' ? 'insight'
          : mem.type === 'decision' ? 'decision'
          : mem.type === 'todo' ? 'todo'
          : mem.type === 'context' ? 'context'
          : 'fact',
      text: mem.content.slice(0, 300),
      created_at: new Date(mem.timestamp).toISOString(),
      topological_rank: 2,
    });
    mem.tags.forEach(t => linkToTag(id, t));
    linkToAgent(id, mem.source, 'authored-by');
  });

  // ── Goals ────────────────────────────────────────────────────────────────────
  const goals = clientData?.goals ?? [];
  goals.forEach((goal) => {
    const id = `goal:${goal.id}`;
    nodes.push({
      id,
      slug: slug(goal.title),
      label: goal.title.slice(0, 35),
      type: 'decision',
      text: [
        goal.description,
        `Status: ${goal.status} | Progress: ${goal.progress}%`,
      ].filter(Boolean).join('\n'),
      created_at: new Date(goal.createdAt).toISOString(),
      topological_rank: 3,
    });

    // Goals linked to agents
    goal.linkedAgents?.forEach(a => linkToAgent(id, a, 'assigned-to'));

    // Goals tagged by their status
    ensureTag(goal.status);
    edges.push({
      id: `edge:${id}→status:${goal.status}`,
      source: id,
      target: `tag:${goal.status}`,
      relationship: 'has-status',
      label: goal.status,
      created_at: now,
    });

    // Cross-link: goals connected to memories sharing keywords
    const titleWords = goal.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
    [...vaultMems, ...clientMems].forEach((mem) => {
      const memId = 'id' in mem && (mem as ClientMemory).timestamp
        ? `cmem:${(mem as ClientMemory).id}`
        : `memory:${(mem as VaultMemory).id}`;
      const memContent = (mem.content || '').toLowerCase();
      if (titleWords.some(w => memContent.includes(w))) {
        edges.push({
          id: `edge:${id}→${memId}`,
          source: id,
          target: memId,
          relationship: 'relates-to',
          label: 'relates-to',
          created_at: now,
        });
      }
    });
  });

  // ── Journal entries ───────────────────────────────────────────────────────────
  const journal = clientData?.journal ?? [];
  const TYPE_TO_GRAPHTYPE: Record<string, string> = {
    built: 'fact',
    learned: 'insight',
    decided: 'decision',
    blocked: 'context',
  };

  // Group journal by date — create a "day" hub node
  const dayHubs = new Map<string, string>();
  journal.forEach((entry) => {
    if (!dayHubs.has(entry.date)) {
      const hubId = `day:${entry.date}`;
      dayHubs.set(entry.date, hubId);
      nodes.push({
        id: hubId,
        slug: `day-${entry.date}`,
        label: entry.date,
        type: 'session',
        text: `Journal entries for ${entry.date}`,
        created_at: new Date(entry.timestamp).toISOString(),
        topological_rank: 1,
      });
    }
  });

  journal.slice(0, 60).forEach((entry) => {
    const id = `journal:${entry.id}`;
    nodes.push({
      id,
      slug: slug(entry.content.slice(0, 40)),
      label: cleanLabel(entry.content),
      type: TYPE_TO_GRAPHTYPE[entry.type] || 'fact',
      text: entry.content.slice(0, 300),
      created_at: new Date(entry.timestamp).toISOString(),
      topological_rank: 2,
    });

    // Link journal → day hub
    const dayHubId = dayHubs.get(entry.date);
    if (dayHubId) {
      edges.push({
        id: `edge:${id}→${dayHubId}`,
        source: id,
        target: dayHubId,
        relationship: 'logged-on',
        label: 'logged-on',
        created_at: now,
      });
    }

    // Link journal → agent
    if (entry.agentName) linkToAgent(id, entry.agentName, 'recorded-by');

    // Tag by type
    linkToTag(id, entry.type);

    // Cross-link journal entries to goals by keyword
    goals.forEach((goal) => {
      const titleWords = goal.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      if (titleWords.some(w => entry.content.toLowerCase().includes(w))) {
        edges.push({
          id: `edge:journal:${entry.id}→goal:${goal.id}`,
          source: id,
          target: `goal:${goal.id}`,
          relationship: 'supports',
          label: 'supports',
          created_at: now,
        });
      }
    });
  });

  // ── De-duplicate edges ────────────────────────────────────────────────────────
  const edgeSet = new Set<string>();
  const uniqueEdges = edges.filter(e => {
    const key = `${e.source}→${e.target}→${e.relationship}`;
    if (edgeSet.has(key)) return false;
    edgeSet.add(key);
    return true;
  });

  // ── De-duplicate nodes ────────────────────────────────────────────────────────
  const nodeSet = new Map<string, GraphNode>();
  nodes.forEach(n => { if (!nodeSet.has(n.id)) nodeSet.set(n.id, n); });

  return { nodes: Array.from(nodeSet.values()), edges: uniqueEdges };
}

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '200');

    let { nodes, edges } = await queryCogneeGraph(limit);

    if (nodes.length === 0) {
      const fallback = await buildFallbackGraph();
      nodes = fallback.nodes;
      edges = fallback.edges;
    }

    return NextResponse.json({ success: true, nodes, edges, totalNodes: nodes.length, totalEdges: edges.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// ── POST — accepts client store data to build enriched graph ─────────────────

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '200');

    const body = await req.json().catch(() => ({}));
    const clientData = {
      memories: body.memories ?? [],
      goals: body.goals ?? [],
      journal: body.journal ?? [],
    };

    // Try Cognee DB first
    let { nodes, edges } = await queryCogneeGraph(limit);

    if (nodes.length === 0) {
      const fallback = await buildFallbackGraph(clientData);
      nodes = fallback.nodes;
      edges = fallback.edges;
    }

    return NextResponse.json({ success: true, nodes, edges, totalNodes: nodes.length, totalEdges: edges.length });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
