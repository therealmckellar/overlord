import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { logEvent } from '@/lib/event-bus';

export interface PipelineIdea {
  id: string;
  title: string;
  description: string;
  persona: string;
  status: 'draft' | 'planning' | 'approved' | 'building' | 'review' | 'done' | 'rejected';
  plan?: string;
  createdAt: number;
  updatedAt: number;
}

// In-memory store (replace with DB in production)
const ideas: Map<string, PipelineIdea> = new Map();
const pipelineProcesses = new Map<string, { pid: number; role: string }>();

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const all = Array.from(ideas.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json({ ideas: all });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, persona } = body;

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description required' }, { status: 400 });
    }

    const id = generateId();
    const now = Date.now();
    const idea: PipelineIdea = {
      id,
      title,
      description,
      persona: persona || 'steve',
      status: 'planning',
      createdAt: now,
      updatedAt: now,
    };

    ideas.set(id, idea);
    logEvent('info', 'Pipeline', `New pipeline idea: ${title}`);

    // Trigger Planner agent to generate a plan
    const planTask = `Plan: ${title}\n\n${description}\n\nContext: This is for Rich's business operations (Robbi Promo merch, My Commercial Funding MCA brokerage, Fathom Realty).`;
    const planner = spawn('opencode', ['run', '--agent', 'planner', '--model', 'openrouter/nex-agi/nex-n2-pro:free', planTask], {
      cwd: process.cwd(),
      detached: true,
      env: { ...process.env, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    pipelineProcesses.set(id, { pid: planner.pid!, role: 'planner' });

    planner.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().trim().split('\n');
      for (const line of lines) {
        if (line.trim()) {
          // Try to extract plan text from planner output
          if (!idea.plan || line.length > idea.plan.length) {
            idea.plan = line.trim();
            idea.updatedAt = Date.now();
            ideas.set(id, idea);
          }
          logEvent('info', `Pipeline:${title}`, line.trim().slice(0, 200));
        }
      }
    });

    planner.stderr?.on('data', (data: Buffer) => {
      logEvent('warning', `Pipeline:${title}`, data.toString().trim().slice(0, 200));
    });

    planner.on('exit', (code) => {
      if (code === 0) {
        idea.status = 'draft'; // Back to draft for user review/approval
        logEvent('success', `Pipeline:${title}`, 'Plan generated successfully');
      } else {
        idea.status = 'rejected';
        idea.plan = `Planner failed (exit code ${code})`;
        logEvent('error', `Pipeline:${title}`, `Planner exited with code ${code}`);
      }
      idea.updatedAt = Date.now();
      ideas.set(id, idea);
      pipelineProcesses.delete(id);
    });

    return NextResponse.json({ idea }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    logEvent('error', 'Pipeline', `Failed to create pipeline: ${err.message}`);
    return NextResponse.json({ error: 'Failed to create pipeline', detail: err.message }, { status: 500 });
  }
}
