import { NextResponse } from 'next/server';
import { MODEL_GRAPH } from '@/lib/model-graph';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const q = (query || '').toLowerCase();
    const roles = Object.keys(MODEL_GRAPH) as (keyof typeof MODEL_GRAPH)[];

    // Search agents by role or model
    const matching = roles.filter(role =>
      role.toLowerCase().includes(q) ||
      MODEL_GRAPH[role].model.toLowerCase().includes(q) ||
      MODEL_GRAPH[role].provider.toLowerCase().includes(q)
    );

    const nodes = matching.map((role) => ({
      id: role,
      label: role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' '),
      type: 'agent' as const,
      model: MODEL_GRAPH[role].model,
      role: role,
    }));

    const edges: { source: string; target: string; label: string }[] = [];
    for (let i = 1; i < nodes.length; i++) {
      edges.push({
        source: nodes[0].id,
        target: nodes[i].id,
        label: 'related',
      });
    }

    return NextResponse.json({ nodes, edges });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
