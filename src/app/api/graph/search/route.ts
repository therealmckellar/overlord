import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    // Mock semantic search results
    const mockNodes = [
      { id: 's1', label: query + '()', type: 'function' },
      { id: 's2', label: 'src/lib/utils.ts', type: 'file' },
    ];
    const mockEdges = [
      { source: 's2', target: 's1', label: 'defines' },
    ];
    return NextResponse.json({ nodes: mockNodes, edges: mockEdges });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
