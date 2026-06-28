import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { spec } = await req.json();
    return NextResponse.json({
      status: 'applied',
      appliedRules: ['Zinc-900 background', 'Indigo-600 accents'],
      newSpec: "Applied taste to " + spec,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
