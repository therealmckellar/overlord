import { NextResponse } from 'next/server';

// Re-using the same mockDb simulation logic (would be a shared db module in real app)
// Since we are in a stateless function environment, we'd normally use a DB.
// For this task, we assume a shared in-memory store or DB is available.
// We'll simulate the chain retrieval.

export async function GET(request: Request, { params }: { params: { taskId: string } }) {
  const { taskId } = params;
  // Simulated chain for the taskId
  const chain = [
    { id: '1', taskId, fromAgent: 'Agent A', toAgent: 'Agent B', summary: 'Setup initial project structure', status: 'completed' },
    { id: '2', taskId, fromAgent: 'Agent B', toAgent: 'Agent C', summary: 'Implemented core logic', status: 'accepted' },
  ];
  return NextResponse.json(chain);
}
