import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const mockNodes = [
      { id: '1', label: 'src/app/page.tsx', type: 'file' },
      { id: '2', label: 'src/components/CodeGraphPanel.tsx', type: 'file' },
      { id: '3', label: 'fetchOverview', type: 'function' },
      { id: '4', label: 'useGraphStore', type: 'function' },
      { id: '5', label: 'AuthModule', type: 'module' },
    ];
    const mockEdges = [
      { source: '1', target: '2', label: 'imports' },
      { source: '2', target: '3', label: 'defines' },
      { source: '3', target: '4', label: 'calls' },
      { source: '2', target: '5', label: 'depends' },
    ];
    return NextResponse.json({ nodes: mockNodes, edges: mockEdges });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
