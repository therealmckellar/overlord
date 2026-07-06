import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const db = getDb();
    const stats = db.prepare(`
      SELECT 
        SUM(tokens_prompt) as total_prompt, 
        SUM(tokens_completion) as total_completion, 
        COUNT(id) as total_requests, 
        AVG(latency_ms) as avg_latency 
      FROM usage_logs
    `).get() as any;

    return NextResponse.json({
      total_tokens: (stats.total_prompt || 0) + (stats.total_completion || 0),
      prompt_tokens: stats.total_prompt || 0,
      completion_tokens: stats.total_completion || 0,
      request_count: stats.total_requests || 0,
      avg_latency: Math.round(stats.avg_latency || 0),
    });
  } catch (error) {
    console.error('Analytics Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { agent_id, user_id, tokens_prompt, tokens_completion, model_id, latency_ms, endpoint } = body;

    const db = getDb();
    const now = Date.now();
    const insertLog = db.prepare(`
      INSERT INTO usage_logs (id, agent_id, user_id, tokens_prompt, tokens_completion, model_id, latency_ms, endpoint, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Generate a simple unique ID for the log
    const logId = `log_${now}_${Math.random().toString(36).substr(2, 9)}`;
    
    insertLog.run(logId, agent_id, user_id, tokens_prompt, tokens_completion, model_id, latency_ms, endpoint, now);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Usage Log Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
