import { NextResponse } from 'next/server';
import { compareOpinions } from '@/lib/opinionCompare';

export async function POST(req: Request) {
  try {
    const { prompt, model1, model2 } = await req.json();

    if (!prompt || !model1 || !model2) {
      return NextResponse.json({ error: 'Missing prompt or models' }, { status: 400 });
    }

    const mockResponse1 = "Implementation for " + model1 + ":\n1. Use Next.js App Router\n2. Implement Zod for validation\n3. Use Tailwind for styling\n4. Ensure security headers are set\n5. Add comprehensive unit tests";
    const mockResponse2 = "Implementation for " + model2 + ":\n1. Use Next.js App Router\n2. Implement Joi for validation\n3. Use CSS Modules for styling\n4. Ensure security headers are set\n5. Focus on integration tests over unit tests";

    const result = compareOpinions(mockResponse1, mockResponse2);

    const comparison = {
      id: Math.random().toString(36).substr(2, 9),
      prompt,
      model1,
      model2,
      output1: mockResponse1,
      output2: mockResponse2,
      result,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(comparison);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
