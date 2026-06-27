
/**
 * Memory → Marp Slide API
 * Converts a single memory into a slide deck (HTML + PDF).
 * User-triggered per memory, not automatic.
 */
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

const VAULT_DIR = path.join(os.homedir(), 'wiki', 'overlord-memories');
const THEME_PATH = path.join(os.homedir(), '.hermes', 'marp', 'venture-theme-v2.css');
const MARP_BIN = path.join(os.homedir(), '.npm-global', 'bin', 'marp');
const CHROME_PATH = (() => {
  try {
    const { execSync } = require('child_process');
    const result = execSync('ls ~/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome 2>/dev/null | head -1', { encoding: 'utf-8' });
    return result.trim() || null;
  } catch {
    return null;
  }
})();

function sanitizeFilename(text: string, maxLen = 50): string {
  return text
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, maxLen)
    .replace(/-$/, '');
}

function memoryToMarpMarkdown(memory: {
  content: string;
  source: string;
  type: string;
  tags: string[];
  createdAt?: string | null;
}): string {
  const now = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
  const tagsStr = memory.tags.map(t => `\`#${t}\``).join(' ');

  // Build a multi-slide deck from the memory content
  // Split on bullet points or sentences for separate slides
  const content = memory.content;
  const sentences = content.split(/(?<!\.)\. /).filter(s => s.trim().length > 5);
  
  const slides: string[] = [];

  // Slide 1: Title + metadata
  slides.push(`<!-- _class: title -->

# ${content.split(/[.\n]/)[0].slice(0, 60)}

<div style="margin-top: 20px; font-size: 18px; opacity: 0.8;">

**Source:** ${memory.source || 'overlord'} · **Type:** ${memory.type || 'fact'} · ${now}

</div>

${tagsStr ? `> ${tagsStr}` : ''}

---`);

  // Middle slides: content broken into digestible chunks
  if (sentences.length <= 3) {
    // Short memory — one content slide
    slides.push(`<!-- _class: summary -->

## ${memory.type === 'fact' ? 'Key Fact' : memory.type === 'decision' ? 'Decision' : 'Context'}

<div style="font-size: 24px; line-height: 1.6;">

${content}

</div>

${tagsStr ? `> ${tagsStr}` : ''}

---`);
  } else {
    // Multiple sentences — break into slides
    for (let i = 0; i < sentences.length; i += 3) {
      const chunk = sentences.slice(i, i + 3).map(s => s.trim()).filter(Boolean);
      if (chunk.length === 0) continue;
      
      const isFirst = i === 0;
      const cssClass = isFirst ? 'summary' : 'data';
      const heading = isFirst ? (memory.type === 'decision' ? 'Decision' : 'Key Details') : '—';
      
      slides.push(`<!-- _class: ${cssClass} -->

## ${heading}

${chunk.map(s => `<!-- _class: bullet -->

- ${s.replace(/\n/g, ' ').slice(0, 200)}`).join('\n\n')}

---`);
    }
  }

  // Final slide: tags + CTA
  if (memory.tags.length > 0) {
    slides.push(`<!-- _class: divider -->

## Tags

<div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px;">

${memory.tags.map(t => `<span style="background: var(--accent); padding: 6px 14px; border-radius: 20px; font-size: 16px;">#${t}</span>`).join('\n')}

</div>

---`);
  }

  return slides.join('\n\n');
}

async function generateDeck(
  memory: { content: string; source: string; type: string; tags: string[]; createdAt?: string | null; filename?: string },
  format: 'html' | 'pdf' | 'all'
): Promise<{ htmlUrl?: string; pdfUrl?: string; error?: string }> {
  const baseName = sanitizeFilename(memory.content) || 'slide';
  const outputDir = path.join(os.tmpdir(), 'overlord-slides');
  await fs.mkdir(outputDir, { recursive: true });

  // Write marp markdown
  const mdPath = path.join(outputDir, `${baseName}-slide.md`);
  await fs.writeFile(mdPath, memoryToMarpMarkdown(memory), 'utf-8');

  // Copy theme to output for local file access
  const themeDest = path.join(outputDir, 'theme.css');
  try {
    const themeSrc = await fs.realpath(THEME_PATH);
    await fs.copyFile(themeSrc, themeDest);
  } catch {
    // Theme not reachable from this dir, marp will use --theme-set
  }

  const result: { htmlUrl?: string; pdfUrl?: string } = {};
  const htmlPath = path.join(outputDir, `${baseName}-slide.html`);
  const pdfPath = path.join(outputDir, `${baseName}-slide.pdf`);

  const marpArgs = [
    `"${mdPath}"`,
    '--html',
    `--theme "${themeDest}"`,
    '--allow-local-files',
    `--output "${htmlPath}"`,
  ];

  if (format === 'pdf' || format === 'all') {
    marpArgs.push('--pdf');
    if (CHROME_PATH) {
      marpArgs.push('--browser chrome');
      marpArgs.push(`--browser-path "${CHROME_PATH}"`);
    }
    marpArgs.push(`--output "${pdfPath}"`);
    marpArgs.push('--browser-timeout 120000');
  }

  const marpCmd = `"${MARP_BIN}" ${marpArgs.join(' ')}`;
  const { stdout, stderr } = await execAsync(marpCmd, { timeout: 120, cwd: outputDir });

  if (format === 'html' || format === 'all') {
    try {
      await fs.access(htmlPath);
      result.htmlUrl = `/api/slide/file?path=${encodeURIComponent(htmlPath)}`;
    } catch {
      return { error: `HTML generation failed: ${stderr || stdout}` };
    }
  }

  if (format === 'pdf' || format === 'all') {
    try {
      await fs.access(pdfPath);
      result.pdfUrl = `/api/slide/file?path=${encodeURIComponent(pdfPath)}`;
    } catch {
      // PDF failed but HTML may have succeeded — still return HTML
      if (!result.htmlUrl) {
        return { error: `PDF generation failed: ${stderr || stdout}` };
      }
    }
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { memoryId, format = 'html' } = body;

    if (!memoryId) {
      return NextResponse.json({ success: false, error: 'memoryId required' }, { status: 400 });
    }

    // Find the memory in the vault
    const { promises: fs } = await import('fs');
    const files = await fs.readdir(VAULT_DIR);
    let memoryFile: string | null = null;

    for (const file of files) {
      if (!file.endsWith('.md') || file === 'Memory Index.md') continue;
      const content = await fs.readFile(path.join(VAULT_DIR, file), 'utf-8');
      if (content.includes(`memory_id: ${memoryId}`)) {
        memoryFile = file;
        break;
      }
    }

    if (!memoryFile) {
      return NextResponse.json({ success: false, error: 'Memory not found in vault' }, { status: 404 });
    }

    // Parse the memory file
    const filePath = path.join(VAULT_DIR, memoryFile);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    
    const fmMatch = fileContent.match(/^---\n([\s\S]*?)\n---/);
    const body_match = fileContent.replace(/^---\n[\s\S]*?\n---\n*/, '');
    
    const extract = (field: string) => {
      const m = fmMatch?.[1]?.match(new RegExp(`^${field}:\\s*(.+)`, 'm'));
      return m?.[1]?.trim() || '';
    };

    const memory = {
      id: memoryId,
      source: extract('source'),
      type: extract('type'),
      tags: (extract('tags') || '[]').replace(/[\[\]]/g, '').split(',').map(t => t.trim()).filter(Boolean),
      content: body_match.replace(/^## .+\n*/, '').replace(/\*Source: .+$/, '').trim(),
      filename: memoryFile,
    };

    const deck = await generateDeck(memory, format as 'html' | 'pdf' | 'all');

    if (deck.error) {
      return NextResponse.json({ success: false, error: deck.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      ...deck,
      filename: sanitizeFilename(memory.content),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
