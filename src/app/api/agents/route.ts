/**
 * Agent Task API — Enforces the Model Graph
 * 
 * All task requests from the Overlord UI go through this endpoint,
 * which routes them to the correct agent/model via opencode.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAgentForTask, buildAgentCommand, enforceRouting, TaskCategory, MODEL_GRAPH, TASK_ROUTING } from '@/lib/model-graph';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Rate limiting (simple in-memory)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute per IP

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  // Auth check
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for') || 'local';
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { task, prompt, persona } = body as {
      task: TaskCategory;
      prompt: string;
      persona?: string;
    };

    if (!task || !prompt) {
      return NextResponse.json({ error: 'Missing task or prompt' }, { status: 400 });
    }

    // Get the correct agent for this task
    const agent = getAgentForTask(task);

    // Enforce: orchestrator cannot do work
    enforceRouting(task, 'orchestrator');

    // Build the opencode command
    const command = buildAgentCommand(task, prompt);

    // Execute via opencode (async — returns job ID)
    const { stdout, stderr } = await execAsync(command, {
      cwd: process.cwd(),
      timeout: 300000, // 5 min max
      env: {
        ...process.env,
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
      },
    });

    return NextResponse.json({
      success: true,
      agent: agent.role,
      model: agent.model,
      agentFlag: agent.agentFlag,
      output: stdout.trim(),
      errors: stderr.trim() || undefined,
    });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message.includes('ORCHESTRATOR BLOCKED') || err.message.includes('ROUTING VIOLATION')) {
      return NextResponse.json({ error: err.message, code: 'ROUTING_ERROR' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}

export async function GET() {
  // Return the model graph for the UI to display
  return NextResponse.json({
    graph: MODEL_GRAPH,
    routing: Object.fromEntries(
      Object.entries(
        // Build reverse map: agent -> tasks
        Object.entries(
          // Invert TASK_ROUTING
          Object.fromEntries(
            Object.entries(
              TASK_ROUTING
            ).map(([task, agent]) => [agent, task])
          )
        ).map(([agent, task]) => [agent, [task]])
      )
    ),
  });
}
