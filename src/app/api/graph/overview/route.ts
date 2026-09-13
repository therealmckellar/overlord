import { NextResponse } from 'next/server';
import { getAllAgents, MODEL_GRAPH } from '@/lib/model-graph';

export async function GET() {
  try {
    // Build graph from real agent/model configuration
    const agents = getAllAgents();
    const roles = Object.keys(MODEL_GRAPH) as (keyof typeof MODEL_GRAPH)[];

    const nodes = roles.map((role) => ({
      id: role,
      label: role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' '),
      type: 'agent' as const,
      model: MODEL_GRAPH[role].model,
      role: role,
    }));

    // Create edges based on agent relationships
    const edges: { source: string; target: string; label: string }[] = [];

    // Orchestrator delegates to all workers
    for (const role of roles) {
      if (role !== 'orchestrator') {
        edges.push({
          source: 'orchestrator',
          target: role,
          label: 'delegates',
        });
      }
    }

    // Add model sharing edges
    const modelGroups: Record<string, string[]> = {};
    for (const role of roles) {
      const model = MODEL_GRAPH[role].model;
      if (!modelGroups[model]) modelGroups[model] = [];
      modelGroups[model].push(role);
    }
    for (const group of Object.values(modelGroups)) {
      for (let i = 1; i < group.length; i++) {
        edges.push({
          source: group[0],
          target: group[i],
          label: 'shared model',
        });
      }
    }

    return NextResponse.json({ nodes, edges });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
