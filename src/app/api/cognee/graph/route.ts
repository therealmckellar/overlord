/**
 * Cognee Graph API — Returns the full knowledge graph from the Cognee DB
 * for interactive visualization in the Cognee tab and Graph tab.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const COGNEE_DB = path.join(
  os.homedir(),
  '.hermes/hermes-agent/venv/lib/python3.11/site-packages/cognee/.cognee_system/databases/cognee_db'
);

async function queryCogneeGraph(limit: number): Promise<{ nodes: any[]; edges: any[] }> {
  try {
    const { execSync } = require('child_process');

    // Check if DB exists
    try {
      await fs.access(COGNEE_DB);
    } catch {
      return { nodes: [], edges: [] };
    }

    // Write Python script directly to avoid template literal escaping issues
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

    const stdout = execSync(`python3 ${tmpScript}`, { timeout: 15000, encoding: 'utf-8' });

    const data = JSON.parse(stdout);
    return { nodes: data.nodes || [], edges: data.edges || [] };
  } catch (error: any) {
    return { nodes: [], edges: [] };
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const { nodes, edges } = await queryCogneeGraph(limit);

    return NextResponse.json({
      success: true,
      nodes,
      edges,
      totalNodes: nodes.length,
      totalEdges: edges.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
