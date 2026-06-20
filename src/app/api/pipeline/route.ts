import { NextRequest, NextResponse } from 'next/server';

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

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function GET() {
  const all = Array.from(ideas.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  return NextResponse.json({ ideas: all });
}

export async function POST(req: NextRequest) {
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
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  };

  ideas.set(id, idea);
  return NextResponse.json({ idea }, { status: 201 });
}
