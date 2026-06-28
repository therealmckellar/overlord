import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const pipelines = db.prepare('SELECT * FROM pipelines').all() as any[];
    const pipeline = pipelines[0] || null;
    
    if (pipeline) {
      return NextResponse.json({ 
        pipeline: {
          ...pipeline,
          stages: JSON.parse(pipeline.stages)
        }
      });
    }
    return NextResponse.json({ pipeline: null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch pipelines' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, stages, currentStageIndex } = body;
    const id = 'pipe_' + Date.now();
    
    const db = getDb();
    const stmt = db.prepare('INSERT INTO pipelines (id, name, currentStageIndex, stages) VALUES (?, ?, ?, ?)');
    stmt.run(id, name, currentStageIndex, JSON.stringify(stages));
    
    return NextResponse.json({ 
      pipeline: { id, name, currentStageIndex, stages } 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create pipeline' }, { status: 500 });
  }
}
