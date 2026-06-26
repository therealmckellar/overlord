/**
 * Agent Spawn API — Spawn real agents via opencode
 *
 * POST: spawn a new agent process via `opencode run --agent <role>`
 * GET: return all agents from agentStore
 */

import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';
import { logEvent } from '@/lib/event-bus';

// Allowed agent roles — security allowlist
const ALLOWED_ROLES = ['planner', 'builder', 'reviewer', 'build-fixer', 'security', 'silent-failure', 'fast', 'utility', 'researcher'];
const ALLOWED_MODELS = [
  'openrouter/nex-agi/nex-n2-pro:free',
  'openrouter/openai/gpt-oss-120b:free',
  'openrouter/openai/gpt-oss-20b:free',
  'openrouter/google/gemma-4-31b-it:free',
  'openrouter/moonshotai/kimi-k2.6:free',
];

// Track spawned processes
const spawnedProcesses = new Map<string, { pid: number; role: string; name: string; task: string; startedAt: number }>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, role, model, task } = body as {
      name: string;
      role: string;
      model: string;
      task: string;
    };

    if (!name || !role || !task) {
      return NextResponse.json({ error: 'name, role, and task are required' }, { status: 400 });
    }

    // Security: enforce allowlists
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: `Role "${role}" not allowed. Allowed: ${ALLOWED_ROLES.join(', ')}` }, { status: 403 });
    }
    if (model && !ALLOWED_MODELS.includes(model)) {
      return NextResponse.json({ error: `Model "${model}" not allowed` }, { status: 403 });
    }

    // Spawn opencode agent as child process
    const modelArg = model ? `--model "${model}"` : '';
    const command = `opencode run --agent ${role} ${modelArg} "${task.replace(/"/g, '\\"')}"`;

    logEvent('info', 'Agent', `Spawning ${role} agent: ${name}`);

    const child = spawn('opencode', ['run', '--agent', role, ...(model ? ['--model', model] : []), task], {
      cwd: process.cwd(),
      detached: true,
      env: {
        ...process.env,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    const agentId = `agent_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    spawnedProcesses.set(agentId, {
      pid: child.pid!,
      role,
      name,
      task,
      startedAt: Date.now(),
    });

    // Log stdout/stderr
    child.stdout?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        logEvent('info', `Agent:${name}`, msg.slice(0, 200));
      }
    });

    child.stderr?.on('data', (data: Buffer) => {
      const msg = data.toString().trim();
      if (msg) {
        logEvent('warning', `Agent:${name}`, msg.slice(0, 200));
      }
    });

    child.on('exit', (code) => {
      logEvent(code === 0 ? 'success' : 'error', `Agent:${name}`, `Exited with code ${code}`);
      spawnedProcesses.delete(agentId);
    });

    logEvent('success', 'Agent', `Spawned ${role} agent "${name}" (PID: ${child.pid})`);

    return NextResponse.json({
      success: true,
      agentId,
      pid: child.pid,
      role,
      name,
      message: `Agent "${name}" spawned successfully`,
    }, { status: 201 });
  } catch (error: unknown) {
    const err = error as Error;
    logEvent('error', 'Agent', `Failed to spawn agent: ${err.message}`);
    return NextResponse.json({ error: 'Failed to spawn agent', detail: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Return active spawned processes
  const active = Array.from(spawnedProcesses.entries()).map(([id, info]) => {
    let status: 'running' | 'dead' | 'unknown' = 'unknown';
    try {
      process.kill(info.pid, 0); // check if alive
      status = 'running';
    } catch {
      status = 'dead';
    }
    return { id, ...info, status };
  });

  return NextResponse.json({ active });
}

