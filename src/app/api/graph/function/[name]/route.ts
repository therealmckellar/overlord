import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { name: string } }) {
  try {
    const name = params.name;
    return NextResponse.json({
      name,
      details: 'Mock details for function ' + name,
      callChain: ['caller1', 'caller2', 'callee1'],
      complexity: 5
    });
  } catch (e) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
