'use client';

import React, { useState, useCallback } from 'react';
import { UNIQUE_MODELS } from '@/lib/model-graph';
import { ImageIcon, Download, Loader2, Cpu, UserCircle } from 'lucide-react';

const IMAGE_MODELS = [
  { value: 'openai/dall-e-3', label: 'DALL-E 3' },
  { value: 'stabilityai/stable-diffusion-xl', label: 'Stable Diffusion XL' },
];

const IMAGE_SIZES = [
  { value: '1024x1024', label: '1024×1024 (Square)' },
  { value: '1024x1792', label: '1024×1792 (Portrait)' },
  { value: '1792x1024', label: '1792×1024 (Landscape)' },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  model: string;
  size: string;
  createdAt: number;
}

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState(IMAGE_MODELS[0].value);
  const [size, setSize] = useState(IMAGE_SIZES[0].value);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt.trim(), model, size }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `Error ${res.status}`);
      }

      const data = await res.json();
      const imageUrl = data.data?.[0]?.url || data.data?.[0]?.b64_json;

      if (!imageUrl) {
        throw new Error('No image returned from API');
      }

      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        prompt: prompt.trim(),
        url: imageUrl.startsWith('data:') ? imageUrl : imageUrl,
        model,
        size,
        createdAt: Date.now(),
      };

      setImages((prev) => [newImage, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, model, size]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Controls */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
          <h3 className="text-xs font-semibold text-[var(--text)] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[var(--accent)]" /> Image Generator
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Prompt */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Prompt</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              placeholder="Describe the image you want to generate..."
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] resize-none"
            />
          </div>

          {/* Model */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Model</label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {IMAGE_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Agent (for future use — selecting which agent generates) */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Agent</label>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              <option value="">Default</option>
              {UNIQUE_MODELS.slice(0, 10).map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>

          {/* Size */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1.5">Size</label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            >
              {IMAGE_SIZES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full px-4 py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" /> Generate
              </>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-400 bg-red-500/10 rounded-lg">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Right: Image display + history */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Latest image */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
          {images.length > 0 ? (
            <div className="max-w-full max-h-full flex flex-col items-center gap-3">
              <div className="relative group">
                <img
                  src={images[0].url}
                  alt={images[0].prompt}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg border border-[var(--border)]"
                />
                <a
                  href={images[0].url}
                  download={`overlord-${images[0].id}.png`}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
              <p className="text-xs text-[var(--text-muted)] text-center max-w-md line-clamp-2">{images[0].prompt}</p>
            </div>
          ) : (
            <div className="text-center">
              <ImageIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">No images generated yet</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Enter a prompt and click Generate</p>
            </div>
          )}
        </div>

        {/* History grid */}
        {images.length > 1 && (
          <div className="border-t border-[var(--border)] bg-[var(--bg-secondary)] px-4 py-3">
            <h4 className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">History</h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.slice(1).map((img) => (
                <div key={img.id} className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border border-[var(--border)] hover:border-[var(--accent)] transition-colors cursor-pointer">
                  <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
