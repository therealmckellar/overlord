/**
 * Serve generated slide files (HTML/PDF) from temp dir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const TEMP_DIR = path.join(os.tmpdir(), 'overlord-slides');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');

  if (!filePath || !filePath.startsWith(TEMP_DIR)) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath);
    const contentType = ext === '.pdf' ? 'application/pdf' : 'text/html';

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
