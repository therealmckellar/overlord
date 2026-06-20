import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get('audio') as Blob;

    if (!audioBlob) {
      return NextResponse.json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Proxy to Streamthrough voice agent on port 9122
    const streamthroughUrl = 'http://localhost:9122/transcribe';
    
    const proxyFormData = new FormData();
    proxyFormData.append('audio', audioBlob);

    const response = await fetch(streamthroughUrl, {
      method: 'POST',
      body: proxyFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Streamthrough error: ${errorText}` }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('STT Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
