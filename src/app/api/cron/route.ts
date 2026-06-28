import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const REGISTRY_PATH = path.join(os.homedir(), '.hermes', 'cron', 'jobs_registry.json');

export async function GET() {
  try {
    const data = await fs.readFile(REGISTRY_PATH, 'utf8');
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, schedule, name, deliver } = body;

    if (!prompt || !schedule) {
      return NextResponse.json({ error: 'Prompt and schedule are required' }, { status: 400 });
    }

    let jobs = [];
    try {
      const data = await fs.readFile(REGISTRY_PATH, 'utf8');
      jobs = JSON.parse(data);
    } catch (e) {
      // Registry doesn't exist yet
    }

    const newJob = {
      id: `job_${Date.now()}`,
      name: name || `Cron Job ${jobs.length + 1}`,
      prompt,
      schedule,
      deliver: deliver || 'local',
      state: 'scheduled',
      profile: 'default',
      lastRun: null,
      nextRun: null,
      createdAt: new Date().toISOString(),
    };

    jobs.push(newJob);
    await fs.mkdir(path.dirname(REGISTRY_PATH), { recursive: true });
    await fs.writeFile(REGISTRY_PATH, JSON.stringify(jobs, null, 2));

    return NextResponse.json(newJob);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
