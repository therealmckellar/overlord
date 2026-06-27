/**
 * Wiki File API — File content into the Obsidian wiki vault.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const WIKI_FILE = path.join(os.homedir(), 'wiki-tools', 'wiki-file');
const WIKI_DIR = path.join(os.homedir(), 'wiki');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, title, category = 'shared', type = 'concept',
            tags = [], sources = [], confidence = 'medium', noBacklinks = false } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'Content required' }, { status: 400 });
    }

    // Write content to temp file
    const tmpFile = path.join(os.tmpdir(), `wiki-file-${Date.now()}.md`);
    await writeFile(tmpFile, content, 'utf-8');

    const args = [
      'python3', WIKI_FILE,
      tmpFile,
      '--dir', WIKI_DIR,
      '--format', 'json',
      '--category', category,
      '--type', type,
      '--confidence', confidence,
    ];

    if (title) args.push('--title', `"${title.replace(/"/g, '\\"')}"`);
    if (tags.length) args.push('--tags', tags.join(','));
    if (sources.length) args.push('--sources', sources.join(','));
    if (noBacklinks) args.push('--no-backlinks');

    const { stdout } = await execAsync(args.join(' '), {
      timeout: 30000,
      maxBuffer: 2 * 1024 * 1024,
    });

    // Clean up temp file
    await unlink(tmpFile).catch(() => {});

    const result = JSON.parse(stdout);

    return NextResponse.json({
      success: result.success,
      file: result.file,
      title: result.title,
      action: result.action,
      category: result.category,
      type: result.type,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
