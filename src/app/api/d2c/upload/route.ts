import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // In real impl, handle multipart file upload and save to S3/Local
    return NextResponse.json({ url: 'https://via.placeholder.com/500' });
  } catch (e) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
