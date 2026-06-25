import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { logEvent } from '@/lib/event-bus';

// Reference to the ideas store from the main route
// In production this would be a DB query
declare global {
  var __pipeline_ideas: Map<string, PipelineIdea> | undefined;
}

interface PipelineIdea {
  id: string;
  title: string;
  description: string;
  persona: string;
  status: 'draft' | 'planning' | 'approved' | 'building' | 'review' | 'done' | 'rejected';
  plan?: string;
  createdAt: number;
  updatedAt: number;
}

const ideas = globalThis.__pipeline_ideas || new Map<string, PipelineIdea>();
globalThis.__pipeline_ideas = ideas;

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = ideas.get(id);
  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ idea });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const idea = ideas.get(id);
  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await req.json();
  const { status, plan, title, description, persona } = body;

  if (status) idea.status = status;
  if (plan !== undefined) idea.plan = plan;
  if (title) idea.title = title;
  if (description) idea.description = description;
  if (persona) idea.persona = persona;
  idea.updatedAt = Date.now();

  // On approve → trigger Builder
  if (status === 'approved') {
    idea.status = 'building';
    logEvent('info', 'Pipeline', `Approved: ${idea.title} — starting build`);

    if (idea.plan) {
      const buildTask = `Implement the following plan:\n\n${idea.plan}\n\nContext: Rich's business operations (Robbi Promo merch, My Commercial Funding MCA brokerage, Fathom Realty). Project: /home/rmckellar/overlord`;
      const builder = spawn('opencode', ['run', '--agent', 'builder', '--model', 'openrouter/openai/gpt-oss-120b:free', buildTask], {
        cwd: process.cwd(),
        detached: true,
        env: { ...process.env, OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '' },
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      builder.stdout?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) logEvent('info', `Build:${idea.title}`, msg.slice(0, 200));
      });

      builder.stderr?.on('data', (data: Buffer) => {
        const msg = data.toString().trim();
        if (msg) logEvent('warning', `Build:${idea.title}`, msg.slice(0, 200));
      });

      builder.on('exit', (code) => {
        if (code === 0) {
          idea.status = 'review';
          logEvent('success', `Build:${idea.title}`, 'Build completed — ready for review');
        } else {
          idea.status = 'rejected';
          logEvent('error', `Build:${idea.title}`, `Build failed with code ${code}`);
        }
        idea.updatedAt = Date.now();
        ideas.set(id, idea);
      });
    } else {
      idea.status = 'draft';
      logEvent('warning', 'Pipeline', `Approved but no plan for: ${idea.title}`);
    }
  }

  ideas.set(id, idea);
  return NextResponse.json({ idea });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!ideas.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  ideas.delete(id);
  return NextResponse.json({ success: true });
}
