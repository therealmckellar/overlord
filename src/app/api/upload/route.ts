/**
 * File Upload API — save files to disk
 */

import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'data', 'uploads');
const MAX_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf', 'text/plain', 'text/markdown', 'application/json',
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Type ${file.type} not allowed` }, { status: 415 });
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Generate safe filename
    const ext = path.extname(file.name) || '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const safeName = `${timestamp}-${random}${ext}`;
    const filePath = path.join(UPLOAD_DIR, safeName);

    // Write file
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    return NextResponse.json({
      success: true,
      url: `/uploads/${safeName}`,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: 'Upload failed', detail: err.message }, { status: 500 });
  }
}
