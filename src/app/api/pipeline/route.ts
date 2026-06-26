import { NextRequest, NextResponse } from 'next/server';
import { logEvent } from '@/lib/event-bus';
import fs from 'fs';
import path from 'path';

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

function generateId(): string {
  return `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// Seed sample ideas if file is empty
function seedIfEmpty(ideas: Map<string, PipelineIdea>) {
  if (ideas.size > 0) return;
  const now = Date.now();
  const seeds: PipelineIdea[] = [
    {
      id: 'idea_seed_1',
      title: 'SDR Auto-Outreach for MCA Renewals',
      description: 'Build an automated outreach system that identifies MCA clients approaching renewal and sends personalized follow-ups via email and SMS to re-lock them before competitors do.',
      persona: 'josh',
      status: 'planning',
      plan: '## Plan\n\n1. **Query** existing MCA client DB for renewals in next 30-60 days\n2. **Enrich** each lead with latest revenue/deposit data\n3. **Generate** personalized outreach emails per persona\n4. **Sequence** 3-touch email + 1 SMS cadence\n5. **Track** opens, clicks, and responses in CRM',
      createdAt: now - 172800000,
      updatedAt: now - 86400000,
    },
    {
      id: 'idea_seed_2',
      title: 'Promo Product Catalog Chatbot',
      description: 'AI chatbot for Robbi Promotional that helps clients find the right merch for their event — asks budget, audience, timeline and recommends products with pricing.',
      persona: 'david',
      status: 'draft',
      createdAt: now - 86400000,
      updatedAt: now - 86400000,
    },
    {
      id: 'idea_seed_3',
      title: 'Real Estate Lead Scoring Model',
      description: 'Build a lead scoring model for Fathom Realty that ranks inbound buyer/seller leads by likelihood to close, using property interest, engagement signals, and demographics.',
      persona: 'fathom',
      status: 'approved',
      plan: '## Plan\n\n1. **Collect** historical lead data with outcomes (closed/lost)\n2. **Feature engineer** signals: page views, inquiries, price range, location\n3. **Train** classification model (gradient boosted)\n4. **Deploy** scoring API endpoint\n5. **Integrate** into Overlord lead panel with score display',
      createdAt: now - 259200000,
      updatedAt: now - 43200000,
    },
  ];
  for (const s of seeds) ideas.set(s.id, s);
  writeIdeas(ideas);
}

export async function GET() {
  const ideas = readIdeas();
  seedIfEmpty(ideas);
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

    const ideas = readIdeas();
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
    writeIdeas(ideas);
    logEvent('info', 'Pipeline', `New pipeline idea: ${title}`);

    return NextResponse.json({ idea }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    logEvent('error', 'Pipeline', `Failed to create pipeline: ${err.message}`);
    return NextResponse.json({ error: 'Failed to create pipeline', detail: err.message }, { status: 500 });
  }
}
