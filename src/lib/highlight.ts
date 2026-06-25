import { createHighlighter } from 'shiki';

let highlighter: any = null;

async function getCachedHighlighter() {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark'],
      langs: ['typescript', 'tsx', 'javascript', 'jsx', 'python', 'rust', 'go', 'json', 'markdown', 'css', 'html'],
    });
  }
  return highlighter;
}

export async function highlightCode(code: string, lang: string): Promise<string> {
  try {
    const h = await getCachedHighlighter();
    return h.codeToHtml(code, { lang });
  } catch (e) {
    console.error('Shiki highlighting failed:', e);
    return `<pre><code>${code}</code></pre>`;
  }
}
