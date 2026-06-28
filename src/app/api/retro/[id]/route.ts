import { NextResponse } from 'next/server';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  return NextResponse.json({
    id: id,
    dateRange: { from: '2026-06-20', to: '2026-06-26' },
    markdown: "Content for retro " + id,
  });
}
