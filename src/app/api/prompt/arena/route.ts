/**
 * Prompt Arena API
 * Runs a prompt against multiple models in parallel, then uses an aggregator model
 * to synthesize the best result.
 *
 * Flow:
 * 1. Fan-out: send the same prompt to N models simultaneously
 * 2. Collect all responses
 * 3. Fan-in: send all responses to the aggregator model with instructions to pick the best
 */
import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

interface ArenaRequest {
  prompt: string;
  models: string[];          // models to compare (2-5)
  aggregatorModel?: string;  // model to synthesize results
  systemPrompt?: string;     // optional system prompt for the run
}

interface ModelResult {
  model: string;
  response: string;
  tokensUsed: number;
  latencyMs: number;
  error?: string;
}

const AGGREGATOR_SYSTEM_PROMPT = `You are a synthesis engine. You receive multiple AI responses to the same prompt, each from a different model. Your job:

1. Evaluate each response for: quality, accuracy, completeness, and actionability.
2. Pick the BEST single response OR synthesize the best elements from multiple responses into one superior response.
3. Clearly state which model(s) contributed to your final answer.
4. If one response is clearly best, use it with minor improvements. If responses have different strengths, merge them.

OUTPUT FORMAT:
---
## Verdict
[Which model won or which models contributed]

## Synthesized Response
[The best combined response]

## Quality Notes
[1-2 sentence comparison of model strengths/weaknesses on this prompt]
---`;

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json() as ArenaRequest;
  const { prompt, models, aggregatorModel, systemPrompt } = body;

  if (!prompt?.trim()) {
    return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
  }
  if (!models?.length || models.length < 2) {
    return NextResponse.json({ error: 'At least 2 models required for arena' }, { status: 400 });
  }
  if (models.length > 5) {
    return NextResponse.json({ error: 'Maximum 5 models for arena' }, { status: 400 });
  }

  // ── Phase 1: Fan-out to all models in parallel ──
  const fanOutPromises = models.map(async (model): Promise<ModelResult> => {
    const start = Date.now();
    try {
      const messages = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://overlord.local',
          'X-Title': 'Overlord Prompt Arena',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 4096,
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { model, response: '', tokensUsed: 0, latencyMs: Date.now() - start, error: `${response.status}: ${errText.slice(0, 200)}` };
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '';
      return {
        model,
        response: content,
        tokensUsed: data.usage?.total_tokens || 0,
        latencyMs: Date.now() - start,
      };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { model, response: '', tokensUsed: 0, latencyMs: Date.now() - start, error: message };
    }
  });

  const results: ModelResult[] = await Promise.all(fanOutPromises);
  const successfulResults = results.filter((r) => !r.error && r.response);

  if (successfulResults.length === 0) {
    return NextResponse.json({
      error: 'All models failed',
      results,
    }, { status: 502 });
  }

  // ── Phase 2: Aggregate with the chosen model ──
  const aggModel = aggregatorModel || 'openrouter/owl-alpha';

  let aggregation = null;
  if (successfulResults.length >= 2) {
    const responsesContext = successfulResults
      .map((r, i) => `### Model ${i + 1}: ${r.model}\n${r.response}`)
      .join('\n\n---\n\n');

    try {
      const aggResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://overlord.local',
          'X-Title': 'Overlord Prompt Arena Aggregator',
        },
        body: JSON.stringify({
          model: aggModel,
          messages: [
            { role: 'system', content: AGGREGATOR_SYSTEM_PROMPT },
            {
              role: 'user',
              content: `Original prompt:\n${prompt}\n\n---\n\nModel responses:\n\n${responsesContext}`,
            },
          ],
          max_tokens: 4096,
          temperature: 0.3,
        }),
      });

      if (aggResponse.ok) {
        const aggData = await aggResponse.json();
        aggregation = {
          response: aggData.choices?.[0]?.message?.content?.trim() || '',
          model: aggModel,
          tokensUsed: aggData.usage?.total_tokens || 0,
        };
      }
    } catch {
      // Aggregation failed — still return individual results
    }
  }

  return NextResponse.json({
    results,
    aggregation,
    totalTokens: results.reduce((sum, r) => sum + r.tokensUsed, 0) + (aggregation?.tokensUsed || 0),
  });
}
