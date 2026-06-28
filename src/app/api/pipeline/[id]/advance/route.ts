import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const pipeline = db.prepare('SELECT * FROM pipelines WHERE id = ?').get(id) as any;
    
    if (!pipeline) return NextResponse.json({ error: 'Pipeline not found' }, { status: 404 });
    
    const stages = JSON.parse(pipeline.stages);
    const currentIndex = pipeline.currentStageIndex;
    
    if (currentIndex >= stages.length - 1) {
      return NextResponse.json({ error: 'Already at final stage' }, { status: 400 });
    }
    
    const newStages = [...stages];
    newStages[currentIndex].status = 'done';
    newStages[currentIndex + 1].status = 'active';
    
    const stmt = db.prepare('UPDATE pipelines SET currentStageIndex = ?, stages = ? WHERE id = ?');
    stmt.run(currentIndex + 1, JSON.stringify(newStages), id);
    
    return NextResponse.json({ 
      pipeline: { 
        ...pipeline, 
        currentStageIndex: currentIndex + 1, 
        stages: newStages 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to advance pipeline' }, { status: 500 });
  }
}
