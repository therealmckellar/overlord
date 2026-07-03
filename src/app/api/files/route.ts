/**
 * File Browser API — Real filesystem browser from Hermes home directory.
 * Returns file/folder tree for the File Explorer panel.
 */
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const HERMES_HOME = path.join(os.homedir(), '.hermes');

// Dirs/files to hide from the browser
const HIDDEN = new Set([
  '.cache',
  '.config',
  '.local',
  '.npm',
  '.nvm',
  '.ssh',
  '.gnupg',
  '.mozilla',
  '.cargo',
  '.rustup',
  'node_modules',
  '.next',
  '.git',
  // Note: we don't hide .hermes here since it's the root
  'venv',
  '.venv',
  '__pycache__',
  '.pytest_cache',
  '.mypy_cache',
  '.codebase-memory',
]);

// Max depth to prevent infinite recursion
const MAX_DEPTH = 4;
// Max entries to prevent overwhelming the UI
const MAX_ENTRIES = 500;

interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
  truncated?: boolean;
}

async function readDir(dirPath: string, depth: number, count: { n: number }): Promise<FileNode[]> {
  if (depth > MAX_DEPTH || count.n > MAX_ENTRIES) return [];

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const nodes: FileNode[] = [];

    for (const entry of entries) {
      if (HIDDEN.has(entry.name)) continue;
      if (entry.name.startsWith('.') && entry.name !== '.env') continue;

      count.n++;
      if (count.n > MAX_ENTRIES) {
        return nodes;
      }

      const fullPath = path.join(dirPath, entry.name);
      const isDir = entry.isDirectory();

      const node: FileNode = {
        name: entry.name,
        path: fullPath,
        type: isDir ? 'folder' : 'file',
      };

      if (isDir) {
        node.children = await readDir(fullPath, depth + 1, count);
        if (node.children.length === 0) {
          node.children = undefined; // Empty folder, don't show expand arrow
        }
      }

      nodes.push(node);
    }

    // Sort: folders first, then files, alphabetically
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return nodes;
  } catch {
    // Permission denied or other error — skip this directory
    return [];
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedPath = searchParams.get('path') || HERMES_HOME;

    // Security: only allow paths under HERMES_HOME
    const resolved = path.resolve(requestedPath);
    if (!resolved.startsWith(HERMES_HOME)) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    // Check if path exists and is a directory
    try {
      const stat = await fs.stat(resolved);
      if (!stat.isDirectory()) {
        // Return single file info
        return NextResponse.json({
          success: true,
          path: resolved,
          type: 'file',
          name: path.basename(resolved),
        });
      }
    } catch {
      return NextResponse.json({ success: false, error: 'Path not found' }, { status: 404 });
    }

    const count = { n: 0 };
    const tree = await readDir(resolved, 0, count);

    return NextResponse.json({
      success: true,
      path: resolved,
      name: path.basename(resolved),
      type: 'folder',
      children: tree,
      truncated: count.n > MAX_ENTRIES,
    });
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
