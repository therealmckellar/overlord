import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const db = getDb();
    
    const stmt = db.prepare('UPDATE pipelines SET name = ?, currentStageIndex = ?, stages = ? WHERE id = ?');
    stmt.run(body.name, body.currentStageIndex, JSON.stringify(body.stages), id);
    
    const pipeline = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(id) as any;
    return NextResponse.json({ 
      pipeline: { ...pipeline, stages: JSON.parse(pipeline.stages) } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update pipeline' }, { status: 500 });
  }
}
