'use client';

import React, { useState } from 'react';
import {
  Mic, Image, Video, Music, Sparkles, Download,
  Play, Square, Loader2, Volume2
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

type StudioTab = 'voice' | 'image' | 'video';

interface StudioViewProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StudioView({ isOpen, onClose }: StudioViewProps) {
  const [activeTab, setActiveTab] = useState<StudioTab>('voice');
  const addToast = useUIStore((s) => s.addToast);

  if (!isOpen) return null;

  const tabs: { id: StudioTab; label: string; icon: React.ElementType }[] = [
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'image', label: 'Image', icon: Image },
    { id: 'video', label: 'Video', icon: Video },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          Studio
        </h2>
        <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
          <Square className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'voice' && <VoiceStudio />}
        {activeTab === 'image' && <ImageStudio />}
        {activeTab === 'video' && <VideoStudio />}
      </div>
    </div>
  );
}

function VoiceStudio() {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [voice, setVoice] = useState('alloy');
  const addToast = useUIStore((s) => s.addToast);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  const handleSpeak = () => {
    if (!text.trim()) return;
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      speechSynthesis.speak(utterance);
      addToast({ type: 'info', message: 'Playing voice...' });
    } else {
      addToast({ type: 'error', message: 'Speech synthesis not supported' });
    }
  };

  const handleStop = () => {
    speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Voice Generation</h3>
        <p className="text-xs text-[var(--text-muted)]">Convert text to speech with different voices</p>
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text to convert to speech..."
        rows={6}
        className="w-full px-4 py-3 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
      />

      <div>
        <label className="text-xs text-[var(--text-muted)] mb-2 block">Voice</label>
        <div className="flex flex-wrap gap-2">
          {voices.map((v) => (
            <button
              key={v}
              onClick={() => setVoice(v)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                voice === v
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={isPlaying ? handleStop : handleSpeak}
          disabled={!text.trim()}
          className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
        >
          {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {isPlaying ? 'Stop' : 'Speak'}
        </button>
        {isPlaying && (
          <div className="flex items-center gap-2 text-xs text-[var(--accent)]">
            <Volume2 className="w-4 h-4 animate-pulse" />
            Playing...
          </div>
        )}
      </div>
    </div>
  );
}

function ImageStudio() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const addToast = useUIStore((s) => s.addToast);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    // In production this calls an image generation API
    setTimeout(() => {
      setGeneratedUrl('https://placehold.co/512x512/6366f1/ffffff?text=AI+Generated');
      setGenerating(false);
      addToast({ type: 'success', message: 'Image generated' });
    }, 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Image Generation</h3>
        <p className="text-xs text-[var(--text-muted)]">Generate images from text prompts</p>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe the image you want..."
          className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
        />
        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || generating}
          className="flex items-center gap-2 px-4 py-2.5 text-sm rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Generate
        </button>
      </div>

      {/* Output */}
      <div className="aspect-square max-w-md mx-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center overflow-hidden">
        {generating ? (
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 mx-auto text-[var(--accent)] animate-spin" />
            <p className="text-xs text-[var(--text-muted)]">Generating image...</p>
          </div>
        ) : generatedUrl ? (
          <img src={generatedUrl} alt="Generated" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center space-y-2">
            <Image className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-20" />
            <p className="text-xs text-[var(--text-muted)]">Enter a prompt to generate an image</p>
          </div>
        )}
      </div>

      {generatedUrl && (
        <div className="flex justify-center">
          <a
            href={generatedUrl}
            download
            className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </div>
      )}
    </div>
  );
}

function VideoStudio() {
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const addToast = useUIStore((s) => s.addToast);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      addToast({ type: 'info', message: 'Video generation queued (demo)' });
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text)] mb-1">Video Generation</h3>
        <p className="text-xs text-[var(--text-muted)]">Generate short videos from text descriptions</p>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe the video you want to create..."
        rows={4}
        className="w-full px-4 py-3 text-sm rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
      />

      <button
        onClick={handleGenerate}
        disabled={!prompt.trim() || generating}
        className="flex items-center gap-2 px-6 py-2.5 text-sm rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-30 transition-colors"
      >
        {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
        {generating ? 'Generating...' : 'Generate Video'}
      </button>

      <div className="aspect-video max-w-md mx-auto rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-center">
        <div className="text-center space-y-2">
          <Video className="w-12 h-12 mx-auto text-[var(--text-muted)] opacity-20" />
          <p className="text-xs text-[var(--text-muted)]">Video output will appear here</p>
        </div>
      </div>
    </div>
  );
}
