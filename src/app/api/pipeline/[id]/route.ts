import { NextRequest, NextResponse } from 'next/server';
import { PERSONAS } from '@/lib/personas';

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
