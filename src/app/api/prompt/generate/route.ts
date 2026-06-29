/**
 * Prompt Generator API
 * Takes a natural-language intent + model selection, generates a high-quality prompt template.
 */
import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

const GENERATOR_SYSTEM_PROMPT = `You are an expert prompt engineer. Your job is to craft the best possible prompt template for the user's described intent.

RULES:
1. Output ONLY the prompt template text — no explanation, no meta-commentary, no markdown fences.
2. Use {{variable}} placeholders for anything the user would need to fill in (role, task, context, audience, etc.)
3. Make prompts specific, structured, and actionable — not vague or generic.
4. Include numbered sections or steps where appropriate.
5. Add output format instructions (e.g., "Return as bullet points", "Rate severity: 🔴 Critical, 🟡 Warning, 🟢 Suggestion").
6. Keep prompts under 500 words.
7. Match the tone to the category: professional for business/sales, technical for coding, creative for brainstorming.
8. If the intent is ambiguous, make reasonable assumptions and document them in the template with {{assumption}} placeholders.`;

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json({ error: 'OPENROUTER_API_KEY not configured' }, { status: 500 });
  }

  const body = await req.json();
  const { intent, category, model } = body as {
    intent: string;
    category?: string;
    model?: string;
  };

  if (!intent?.trim()) {
    return NextResponse.json({ error: 'intent is required' }, { status: 400 });
  }

  const selectedModel = model || 'google/gemma-4-31b-it:free';

  const userMessage = category
    ? `Create a prompt template for this category: ${category}\n\nUser's intent: ${intent}`
    : `Create a prompt template for: ${intent}`;

  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://overlord.local',
        'X-Title': 'Overlord Prompt Studio',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: GENERATOR_SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json({ error: `OpenRouter error: ${response.status}`, details: errText }, { status: 502 });
    }

    const data = await response.json();
    const generated = data.choices?.[0]?.message?.content?.trim() || '';

    if (!generated) {
      return NextResponse.json({ error: 'Empty response from model' }, { status: 502 });
    }

    // Extract variables from generated prompt
    const variables = [...new Set((generated.match(/\{\{(\w+)\}\}/g) || []).map((m: string) => m.slice(2, -2)))];

    return NextResponse.json({
      prompt: generated,
      variables,
      model: selectedModel,
      tokensUsed: data.usage?.total_tokens || 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
