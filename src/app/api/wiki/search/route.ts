/**
 * Wiki Search API — Full-text search across the Obsidian wiki vault.
 * Shells out to wiki-search CLI.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);
const WIKI_SEARCH = path.join(os.homedir(), 'wiki-tools', 'wiki-search');
const WIKI_DIR = path.join(os.homedir(), 'wiki');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const limit = searchParams.get('limit') || '20';
    const allMatches = searchParams.get('all') === 'true';

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ success: false, error: 'Query too short (min 2 chars)' }, { status: 400 });
    }

    const args = [
      'python3', WIKI_SEARCH,
      `"${query.replace(/"/g, '\\"')}"`,
      '--format', 'json',
      '--limit', limit,
      '--dir', WIKI_DIR,
    ];
    if (allMatches) args.push('--all-matches');

    const { stdout, stderr } = await execAsync(args.join(' '), {
      timeout: 15000,
      maxBuffer: 5 * 1024 * 1024,
    });

    const result = JSON.parse(stdout);

    // Clean up results for frontend consumption
    const cleanResults = result.results?.map((r: any) => ({
      id: r.relative_path?.replace(/[/\\]/g, '-').replace('.md', '') || r.path,
      title: r.frontmatter?.title || r.relative_path?.replace('.md', '').split('/').pop() || 'Untitled',
      relativePath: r.relative_path,
      snippet: (r.snippet || '').replace(/\n/g, ' ').slice(0, 200),
      tags: r.frontmatter?.tags || [],
      type: r.frontmatter?.type || 'unknown',
      confidence: r.frontmatter?.confidence || 'medium',
      score: r.score || 0,
      lineCount: r.line_number,
    }));

    return NextResponse.json({
      success: true,
      query: result.query,
      total: result.total,
      results: cleanResults,
    });
  } catch (error: any) {
    // If CLI not found, fall back to basic file listing
    if (error.code === 'ENOENT' || error.message?.includes('not found')) {
      return NextResponse.json({
        success: false,
        error: 'wiki-search CLI not found. Run: chmod +x ~/wiki-tools/wiki-search',
        results: [],
      }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
