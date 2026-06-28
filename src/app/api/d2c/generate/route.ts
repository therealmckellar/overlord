import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { imageUrl } = await req.json();
    // Mock agent analysis result
    const spec = {
      html: '<div class="p-6 bg-zinc-900 rounded-xl border border-zinc-800 text-white"><h1 class="text-2xl font-bold mb-2">Generated Component</h1><p class="text-zinc-400">This component was generated from a design mockup using AI analysis.</p><button class="mt-4 px-4 py-2 bg-purple-600 rounded-lg">Action Button</button></div>',
      css: '.generated-component { font-family: sans-serif; }',
      components: ['Button', 'Card', 'Typography'],
      description: 'A modern dark-themed card component with a primary action button.'
    };
    return NextResponse.json({ spec });
  } catch (e) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
