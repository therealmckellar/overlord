import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { logEvent } from '@/lib/event-bus';
import fs from 'fs';
import path from 'path';

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

const DATA_FILE = '/home/rmckellar/overlord/.data/pipeline.json';

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readIdeas(): Map<string, PipelineIdea> {
  ensureDataDir();
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const arr: PipelineIdea[] = JSON.parse(raw);
      return new Map(arr.map((i) => [i.id, i]));
    }
  } catch {
    // corrupted file, start fresh
  }
  return new Map();
}

function writeIdeas(ideas: Map<string, PipelineIdea>) {
  ensureDataDir();
  const arr = Array.from(ideas.values());
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideas = readIdeas();
  const idea = ideas.get(id);
  if (!idea) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ idea });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideas = readIdeas();
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
        const updated = readIdeas();
        const currentIdea = updated.get(id);
        if (currentIdea) {
          if (code === 0) {
            currentIdea.status = 'review';
            logEvent('success', `Build:${currentIdea.title}`, 'Build completed — ready for review');
          } else {
            currentIdea.status = 'rejected';
            logEvent('error', `Build:${currentIdea.title}`, `Build failed with code ${code}`);
          }
          currentIdea.updatedAt = Date.now();
          updated.set(id, currentIdea);
          writeIdeas(updated);
        }
      });
    } else {
      idea.status = 'draft';
      logEvent('warning', 'Pipeline', `Approved but no plan for: ${idea.title}`);
    }
  }

  ideas.set(id, idea);
  writeIdeas(ideas);
  return NextResponse.json({ idea });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ideas = readIdeas();
  if (!ideas.has(id)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  ideas.delete(id);
  writeIdeas(ideas);
  return NextResponse.json({ success: true });
}
