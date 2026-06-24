'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Image, Video, Palette, Wand2, Upload, Download, Sparkles,
  Film, Camera, Layers, Type, Shapes, Eraser, RotateCcw,
  ZoomIn, ZoomOut, Move, Square, Circle,
  Pen, Brush, Pipette, Grid3x3, X, Loader2, ChevronRight,
  Plus, Trash2, Copy, RefreshCw, Maximize2, FileText,
  Brain, LayoutGrid, BookOpen, ScanLine, BarChart3,
  Mic, Globe, Zap, ChevronDown, Check, AlertCircle, Clock,
  GripHorizontal, Eye, PanelLeftClose, PanelLeftOpen, Settings2,
  Play
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';
import { PERSONAS } from '@/lib/personas';

type StudioMode = 'image' | 'video' | 'design' | 'canvas' | 'report' | 'mindmap' | 'flashcard' | 'kanban' | 'research';
type Tool = 'select' | 'brush' | 'eraser' | 'text' | 'shape' | 'eyedropper' | 'move' | 'zoom';

interface GenerationConfig {
  prompt: string;
  style: string;
  resolution: string;
  count: number;
}

interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'design' | 'report' | 'mindmap';
  title: string;
  prompt: string;
  thumbnail: string;
  status: 'generating' | 'ready' | 'error';
  persona: string;
  createdAt: number;
  style: string;
  resolution: string;
}

interface KanbanTask {
  id: string;
  title: string;
  status: 'backlog' | 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  persona: string;
  createdAt: number;
}

interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  mastered: boolean;
}

interface MindMapNode {
  id: string;
  label: string;
  x: number;
  y: number;
  children: string[];
}

const STYLES = [
  { id: 'photorealistic', label: 'Photorealistic', emoji: '📸' },
  { id: 'digital-art', label: 'Digital Art', emoji: '🎨' },
  { id: 'cinematic', label: 'Cinematic', emoji: '🎬' },
  { id: 'anime', label: 'Anime', emoji: '✨' },
  { id: 'watercolor', label: 'Watercolor', emoji: '💧' },
  { id: '3d-render', label: '3D Render', emoji: '🧊' },
  { id: 'minimalist', label: 'Minimalist', emoji: '⬜' },
  { id: 'vintage', label: 'Vintage', emoji: '📻' },
  { id: 'neon', label: 'Neon', emoji: '💜' },
  { id: 'comic', label: 'Comic', emoji: '💥' },
];

const RESOLUTIONS = [
  { id: '512x512', label: '512×512', aspect: '1:1' },
  { id: '768x768', label: '768×768', aspect: '1:1' },
  { id: '1024x1024', label: '1024×1024', aspect: '1:1' },
  { id: '1280x720', label: '1280×720', aspect: '16:9' },
  { id: '720x1280', label: '720×1280', aspect: '9:16' },
  { id: '1920x1080', label: '1920×1080', aspect: '16:9' },
];

const PERSONA_TEMPLATES: Record<string, { label: string; prompt: string; emoji: string }[]> = {
  hermes: [
    { label: 'Dashboard Overview', prompt: 'Generate a comprehensive business dashboard overview with KPIs, metrics, and status indicators', emoji: '📊' },
    { label: 'Agent Workflow', prompt: 'Create a visual diagram showing AI agent workflow orchestration, nodes and connections', emoji: '🤖' },
    { label: 'System Architecture', prompt: 'Technical architecture diagram for multi-agent system, clean and professional', emoji: '🏗️' },
    { label: 'Performance Report', prompt: 'Analytics report visualization with charts, metrics, and trend lines', emoji: '📈' },
  ],
  david: [
    { label: 'Promo Product Mockup', prompt: 'Professional product photography of promotional merchandise, clean white background, studio lighting', emoji: '👕' },
    { label: 'Brand Flyer', prompt: 'Eye-catching promotional flyer for local business, bold colors, modern design', emoji: '📄' },
    { label: 'Social Ad', prompt: 'Instagram-ready ad creative for promotional products, vibrant and engaging', emoji: '📱' },
    { label: 'Event Banner', prompt: 'Trade show banner for promotional merchandise company, professional and bold', emoji: '🏷️' },
  ],
  josh: [
    { label: 'Infographic', prompt: 'Business funding infographic, clean data visualization, professional blue tones', emoji: '📊' },
    { label: 'Pitch Deck Slide', prompt: 'Professional pitch deck slide for commercial funding, modern finance aesthetic', emoji: '💼' },
    { label: 'Explainer Video', prompt: 'Animated explainer video about business funding options, motion graphics', emoji: '🎥' },
    { label: 'Report Cover', prompt: 'Annual financial report cover design, corporate and trustworthy', emoji: '📈' },
  ],
  steve: [
    { label: 'Thought Leadership', prompt: 'Professional headshot photo for consulting firm, executive portrait, studio lighting', emoji: '👔' },
    { label: 'Whitepaper Cover', prompt: 'Clean whitepaper cover for venture consulting, minimalist and authoritative', emoji: '📘' },
    { label: 'Webinar Thumbnail', prompt: 'Webinar thumbnail for consulting event, professional and inviting', emoji: '🖥️' },
    { label: 'Case Study Graphic', prompt: 'Case study visual summary for consulting engagement, data-driven design', emoji: '📋' },
  ],
  fathom: [
    { label: 'Property Listing', prompt: 'Luxury real estate property photo, golden hour lighting, professional real estate photography', emoji: '🏠' },
    { label: 'Virtual Tour', prompt: '360° virtual tour thumbnail for residential property listing, inviting and warm', emoji: '🚪' },
    { label: 'Neighborhood Map', prompt: 'Custom neighborhood map highlighting property location, aerial view style', emoji: '🗺️' },
    { label: 'Market Report', prompt: 'Real estate market report visualization, charts and property photos, professional', emoji: '📉' },
  ],
};

const GRADIENT_PRESETS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
  'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)',
  'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)',
  'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
];

const MODE_CONFIG: Record<StudioMode, { icon: React.ElementType; label: string; description: string }> = {
  image: { icon: Image, label: 'Image', description: 'Generate images from text prompts' },
  video: { icon: Video, label: 'Video', description: 'Create short videos with AI' },
  design: { icon: Palette, label: 'Design', description: 'Design graphics and layouts' },
  canvas: { icon: Pen, label: 'Canvas', description: 'Draw and create freely' },
  report: { icon: FileText, label: 'Reports', description: 'Generate structured reports' },
  mindmap: { icon: Brain, label: 'Mind Maps', description: 'Create visual mind maps' },
  flashcard: { icon: BookOpen, label: 'Flashcards', description: 'Build study flashcard decks' },
  kanban: { icon: LayoutGrid, label: 'Kanban', description: 'Manage tasks visually' },
  research: { icon: Globe, label: 'Research', description: 'Deep research and synthesis' },
};

interface ContentStudioProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ContentStudio({ isOpen, onClose }: ContentStudioProps) {
  const activePersona = useUIStore((s) => s.activePersona);
  const addToast = useUIStore((s) => s.addToast);
  const [mode, setMode] = useState<StudioMode>('image');
  const [assets, setAssets] = useState<GeneratedAsset[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<GeneratedAsset | null>(null);
  const [config, setConfig] = useState<GenerationConfig>({
    prompt: '',
    style: 'photorealistic',
    resolution: '1024x1024',
    count: 1,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [canvasTool, setCanvasTool] = useState<Tool>('brush');
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [brushSize, setBrushSize] = useState(4);
  const [brushColor, setBrushColor] = useState('#ffffff');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Kanban state
  const [kanbanTasks, setKanbanTasks] = useState<KanbanTask[]>([
    { id: 'k1', title: 'Research competitor pricing', status: 'done', priority: 'high', persona: activePersona, createdAt: Date.now() - 86400000 * 3 },
    { id: 'k2', title: 'Draft outreach templates', status: 'in-progress', priority: 'high', persona: activePersona, createdAt: Date.now() - 86400000 * 2 },
    { id: 'k3', title: 'Create brand guidelines doc', status: 'todo', priority: 'medium', persona: activePersona, createdAt: Date.now() - 86400000 },
    { id: 'k4', title: 'Set up analytics tracking', status: 'backlog', priority: 'low', persona: activePersona, createdAt: Date.now() },
  ]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Flashcard state
  const [flashcards, setFlashcards] = useState<Flashcard[]>([
    { id: 'f1', front: 'What is MCA?', back: 'Merchant Cash Advance - a business funding option based on future credit card sales', category: 'Funding', mastered: false },
    { id: 'f2', front: 'Typical MCA term length?', back: '6-18 months, factor rates from 1.1 to 1.5', category: 'Funding', mastered: true },
    { id: 'f3', front: 'What is a factor rate?', back: 'A multiplier applied to the advance amount to determine total payback', category: 'Funding', mastered: false },
  ]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardFront, setNewCardFront] = useState('');
  const [newCardBack, setNewCardBack] = useState('');
  const [studyMode, setStudyMode] = useState(false);
  const [studyIndex, setStudyIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // Mind map state
  const [mindMapNodes, setMindMapNodes] = useState<MindMapNode[]>([
    { id: 'root', label: 'Business Strategy', x: 400, y: 300, children: ['m1', 'm2', 'm3'] },
    { id: 'm1', label: 'Revenue', x: 200, y: 180, children: [] },
    { id: 'm2', label: 'Growth', x: 600, y: 180, children: [] },
    { id: 'm3', label: 'Operations', x: 400, y: 450, children: [] },
  ]);

  if (!isOpen) return null;

  const persona = PERSONAS[activePersona as keyof typeof PERSONAS] || PERSONAS.david;
  const templates = PERSONA_TEMPLATES[activePersona] || PERSONA_TEMPLATES.hermes;
  const activeStyle = STYLES.find((s) => s.id === config.style) || STYLES[0];
  const activeRes = RESOLUTIONS.find((r) => r.id === config.resolution) || RESOLUTIONS[2];

  const handleGenerate = useCallback(() => {
    if (!config.prompt.trim()) {
      addToast({ type: 'warning', message: 'Enter a prompt first', duration: 2000 });
      return;
    }
    setIsGenerating(true);
    const newAssets: GeneratedAsset[] = Array.from({ length: config.count }, (_, i) => ({
      id: `asset_${Date.now()}_${i}`,
      type: mode === 'video' ? 'video' : mode === 'design' ? 'design' : mode === 'report' ? 'report' : mode === 'mindmap' ? 'mindmap' : 'image',
      title: config.prompt.slice(0, 40) + (config.prompt.length > 40 ? '...' : ''),
      prompt: config.prompt,
      thumbnail: GRADIENT_PRESETS[Math.floor(Math.random() * GRADIENT_PRESETS.length)],
      status: 'generating' as const,
      persona: activePersona,
      createdAt: Date.now(),
      style: config.style,
      resolution: config.resolution,
    }));
    setAssets((prev) => [...newAssets, ...prev]);
    addToast({ type: 'info', message: `Generating ${mode} as ${persona.name}...`, duration: 3000 });

    setTimeout(() => {
      setAssets((prev) =>
        prev.map((a) =>
          newAssets.find((na) => na.id === a.id) ? { ...a, status: 'ready' as const } : a
        )
      );
      setIsGenerating(false);
      addToast({ type: 'success', message: `${newAssets.length} ${mode} ready!`, duration: 2000 });
    }, 2500);
  }, [config, mode, activePersona, persona, addToast]);

  const handleTemplateClick = (template: { prompt: string; label: string }) => {
    setConfig((prev) => ({ ...prev, prompt: template.prompt }));
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (selectedAsset?.id === id) setSelectedAsset(null);
  };

  const handleDuplicateAsset = (asset: GeneratedAsset) => {
    const dup: GeneratedAsset = {
      ...asset,
      id: `asset_${Date.now()}_dup`,
      title: asset.title + ' (copy)',
      createdAt: Date.now(),
      status: 'ready',
    };
    setAssets((prev) => [dup, ...prev]);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (canvasTool !== 'brush' && canvasTool !== 'eraser') return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineCap = 'round';
    ctx.lineWidth = brushSize;
    ctx.strokeStyle = canvasTool === 'eraser' ? '#0c0c0c' : brushColor;
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) / canvasZoom;
    const y = (e.clientY - rect.top) / canvasZoom;
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => setIsDrawing(false);

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleExportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `canvas-export-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast({ type: 'success', message: 'Canvas exported as PNG', duration: 2000 });
  };

  const handleAddTask = () => {
    if (!newTaskTitle.trim()) return;
    const task: KanbanTask = {
      id: `k_${Date.now()}`,
      title: newTaskTitle,
      status: 'todo',
      priority: 'medium',
      persona: activePersona,
      createdAt: Date.now(),
    };
    setKanbanTasks((prev) => [...prev, task]);
    setNewTaskTitle('');
    setShowAddTask(false);
  };

  const handleMoveTask = (taskId: string, newStatus: KanbanTask['status']) => {
    setKanbanTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
  };

  const handleAddCard = () => {
    if (!newCardFront.trim() || !newCardBack.trim()) return;
    const card: Flashcard = {
      id: `f_${Date.now()}`,
      front: newCardFront,
      back: newCardBack,
      category: persona.name,
      mastered: false,
    };
    setFlashcards((prev) => [...prev, card]);
    setNewCardFront('');
    setNewCardBack('');
    setShowAddCard(false);
  };

  const filteredAssets = assets.filter((a) => a.persona === activePersona);
  const filteredTasks = kanbanTasks.filter((t) => t.persona === activePersona);
  const filteredCards = flashcards.filter((f) => f.category === persona.name || f.category === activePersona);

  const modeConfig = MODE_CONFIG[mode];
  const ModeIcon = modeConfig.icon;

  const renderMainContent = () => {
    // Canvas mode
    if (mode === 'canvas') {
      return (
        <div className="absolute inset-0 overflow-auto">
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-10"
              style={{
                backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)',
                backgroundSize: `${20 * canvasZoom}px ${20 * canvasZoom}px`,
              }}
            />
          )}
          <div className="p-8 inline-block min-w-full min-h-full">
            <canvas
              ref={canvasRef}
              width={1024 * canvasZoom}
              height={768 * canvasZoom}
              className="rounded-lg shadow-2xl cursor-crosshair"
              style={{ backgroundColor: '#0c0c0c' }}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>
        </div>
      );
    }

    // Kanban mode
    if (mode === 'kanban') {
      const columns: { id: KanbanTask['status']; label: string; color: string }[] = [
        { id: 'backlog', label: 'Backlog', color: 'var(--text-muted)' },
        { id: 'todo', label: 'To Do', color: 'var(--warning)' },
        { id: 'in-progress', label: 'In Progress', color: 'var(--accent)' },
        { id: 'done', label: 'Done', color: 'var(--success)' },
      ];
      return (
        <div className="absolute inset-0 overflow-auto p-6">
          <div className="flex gap-4 h-full max-w-6xl mx-auto">
            {columns.map((col) => (
              <div key={col.id} className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-xs font-semibold text-[var(--text)] uppercase tracking-wider">{col.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] ml-auto">
                    {filteredTasks.filter((t) => t.status === col.id).length}
                  </span>
                </div>
                <div className="flex-1 space-y-2 bg-[var(--bg-secondary)] rounded-xl p-2">
                  {filteredTasks
                    .filter((t) => t.status === col.id)
                    .map((task) => (
                      <div key={task.id} className="p-3 rounded-lg bg-[var(--bg)] border border-[var(--border)] space-y-2">
                        <div className="text-xs font-medium text-[var(--text)]">{task.title}</div>
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
                              task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                              task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                          <select
                            value={task.status}
                            onChange={(e) => handleMoveTask(task.id, e.target.value as KanbanTask['status'])}
                            className="text-[9px] bg-transparent border border-[var(--border)] rounded px-1 py-0.5 text-[var(--text-muted)] focus:outline-none"
                          >
                            <option value="backlog">Backlog</option>
                            <option value="todo">To Do</option>
                            <option value="in-progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  {col.id === 'todo' && (
                    <button
                      onClick={() => setShowAddTask(true)}
                      className="w-full p-2 rounded-lg border border-dashed border-[var(--border)] text-[10px] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus size={10} /> Add task
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {showAddTask && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddTask(false)}>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 w-80 border border-[var(--border)] space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm font-semibold text-[var(--text)]">New Task</div>
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button onClick={handleAddTask} className="flex-1 py-2 text-xs rounded-lg text-white font-medium" style={{ backgroundColor: persona.color }}>Add</button>
                  <button onClick={() => setShowAddTask(false)} className="px-4 py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)]">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Flashcard mode
    if (mode === 'flashcard') {
      if (studyMode && filteredCards.length > 0) {
        const card = filteredCards[studyIndex % filteredCards.length];
        return (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="max-w-lg w-full space-y-4">
              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>Card {(studyIndex % filteredCards.length) + 1} of {filteredCards.length}</span>
                <button onClick={() => { setStudyMode(false); setShowAnswer(false); }} className="flex items-center gap-1 hover:text-[var(--text)]">
                  <X size={12} /> Exit Study
                </button>
              </div>
              <div
                onClick={() => setShowAnswer(!showAnswer)}
                className="relative aspect-video rounded-2xl border-2 border-[var(--border)] flex items-center justify-center cursor-pointer transition-all hover:border-[var(--accent)]"
                style={{ background: 'var(--bg-secondary)' }}
              >
                <div className="text-center p-8">
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-3">{showAnswer ? 'Answer' : 'Question'}</div>
                  <div className="text-lg font-semibold text-[var(--text)]">{showAnswer ? card.back : card.front}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-4">Click to {showAnswer ? 'see question' : 'reveal answer'}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => { setStudyIndex((i) => Math.max(0, i - 1)); setShowAnswer(false); }}
                  className="p-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)]"
                >
                  <RotateCcw size={14} />
                </button>
                {showAnswer && (
                  <button
                    onClick={() => { setStudyIndex((i) => (i + 1) % filteredCards.length); setShowAnswer(false); }}
                    className="px-4 py-2 text-xs rounded-lg text-white font-medium flex items-center gap-1"
                    style={{ backgroundColor: persona.color }}
                  >
                    Next <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }
      return (
        <div className="absolute inset-0 overflow-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text)]">{filteredCards.length} Cards</div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setStudyMode(true); setStudyIndex(0); setShowAnswer(false); }}
                  className="px-3 py-1.5 text-xs rounded-lg text-white font-medium flex items-center gap-1"
                  style={{ backgroundColor: persona.color }}
                >
                  <BookOpen size={12} /> Study Mode
                </button>
                <button
                  onClick={() => setShowAddCard(true)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text)] flex items-center gap-1"
                >
                  <Plus size={12} /> Add Card
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCards.map((card) => (
                <div key={card.id} className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="text-xs font-medium text-[var(--text)]">{card.front}</div>
                    <button
                      onClick={() => setFlashcards((prev) => prev.map((c) => (c.id === card.id ? { ...c, mastered: !c.mastered } : c)))}
                      className={`p-1 rounded ${card.mastered ? 'text-[var(--success)]' : 'text-[var(--text-muted)]'}`}
                    >
                      <Check size={12} />
                    </button>
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">{card.back}</div>
                  <div className="text-[9px] text-[var(--text-muted)]">{card.category}</div>
                </div>
              ))}
            </div>
          </div>
          {showAddCard && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAddCard(false)}>
              <div className="bg-[var(--bg-secondary)] rounded-xl p-4 w-96 border border-[var(--border)] space-y-3" onClick={(e) => e.stopPropagation()}>
                <div className="text-sm font-semibold text-[var(--text)]">New Flashcard</div>
                <input
                  type="text"
                  value={newCardFront}
                  onChange={(e) => setNewCardFront(e.target.value)}
                  placeholder="Question (front)..."
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                  autoFocus
                />
                <textarea
                  value={newCardBack}
                  onChange={(e) => setNewCardBack(e.target.value)}
                  placeholder="Answer (back)..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleAddCard} className="flex-1 py-2 text-xs rounded-lg text-white font-medium" style={{ backgroundColor: persona.color }}>Add</button>
                  <button onClick={() => setShowAddCard(false)} className="px-4 py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)]">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    // Mind map mode
    if (mode === 'mindmap') {
      return (
        <div className="absolute inset-0 overflow-auto">
          <svg className="w-full h-full" style={{ minHeight: '600px' }}>
            {mindMapNodes.map((node) =>
              node.children.map((childId) => {
                const child = mindMapNodes.find((n) => n.id === childId);
                if (!child) return null;
                return (
                  <line
                    key={`${node.id}-${childId}`}
                    x1={node.x}
                    y1={node.y}
                    x2={child.x}
                    y2={child.y}
                    stroke="var(--border)"
                    strokeWidth="2"
                  />
                );
              })
            )}
            {mindMapNodes.map((node) => (
              <g key={node.id}>
                <rect
                  x={node.x - 60}
                  y={node.y - 20}
                  width={120}
                  height={40}
                  rx={node.id === 'root' ? 20 : 8}
                  fill={node.id === 'root' ? persona.color : 'var(--bg-secondary)'}
                  stroke={node.id === 'root' ? 'transparent' : 'var(--border)'}
                  strokeWidth="1.5"
                />
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fill={node.id === 'root' ? '#fff' : 'var(--text)'}
                  fontSize="11"
                  fontWeight={node.id === 'root' ? '600' : '400'}
                >
                  {node.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
      );
    }

    // Research mode
    if (mode === 'research') {
      return (
        <div className="absolute inset-0 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="space-y-2">
              <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <Globe size={14} style={{ color: persona.color }} />
                Deep Research
              </div>
              <p className="text-xs text-[var(--text-muted)]">Research any topic across the web. Results are synthesized and summarized.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={config.prompt}
                onChange={(e) => setConfig((prev) => ({ ...prev, prompt: e.target.value }))}
                placeholder="Research topic..."
                className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !config.prompt.trim()}
                className="px-4 py-2.5 text-sm rounded-xl text-white font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ backgroundColor: persona.color }}
              >
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <ScanLine size={14} />}
                Research
              </button>
            </div>
            <div className="space-y-3">
              {[
                { title: 'Market Analysis', desc: 'Comprehensive market research with trends, competitors, and opportunities', emoji: '📊' },
                { title: 'Competitive Intelligence', desc: 'Deep dive into competitor strategies and positioning', emoji: '🔍' },
                { title: 'Industry Report', desc: 'Sector-wide analysis with key metrics and forecasts', emoji: '📈' },
                { title: 'Trend Forecast', desc: 'Emerging trends and predictions for strategic planning', emoji: '🔮' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setConfig((prev) => ({ ...prev, prompt: item.desc }))}
                  className="w-full text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors flex items-center gap-3"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <div>
                    <div className="text-xs font-medium text-[var(--text)]">{item.title}</div>
                    <div className="text-[10px] text-[var(--text-muted)] mt-0.5">{item.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // Report mode
    if (mode === 'report') {
      return (
        <div className="absolute inset-0 overflow-auto p-6">
          <div className="max-w-3xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                <FileText size={14} style={{ color: persona.color }} />
                Report Generator
              </div>
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !config.prompt.trim()}
                className="px-3 py-1.5 text-xs rounded-lg text-white font-medium flex items-center gap-1 disabled:opacity-50"
                style={{ backgroundColor: persona.color }}
              >
                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                Generate Report
              </button>
            </div>
            <input
              type="text"
              value={config.prompt}
              onChange={(e) => setConfig((prev) => ({ ...prev, prompt: e.target.value }))}
              placeholder="Report topic or data to analyze..."
              className="w-full px-4 py-2.5 text-sm rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
            />
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Executive Summary', desc: 'High-level overview with key findings and recommendations', emoji: '📋' },
                { title: 'Financial Analysis', desc: 'Revenue, costs, and profitability breakdown', emoji: '💰' },
                { title: 'Strategic Review', desc: 'SWOT analysis and strategic recommendations', emoji: '🎯' },
                { title: 'Progress Report', desc: 'Milestone tracking and status updates', emoji: '📊' },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => setConfig((prev) => ({ ...prev, prompt: item.desc }))}
                  className="text-left p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
                >
                  <span className="text-lg">{item.emoji}</span>
                  <div className="text-xs font-medium text-[var(--text)] mt-2">{item.title}</div>
                  <div className="text-[10px] text-[var(--text-muted)] mt-1">{item.desc}</div>
                </button>
              ))}
            </div>
            {selectedAsset?.type === 'report' && selectedAsset.status === 'ready' && (
              <div className="p-6 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                <div className="text-sm font-semibold text-[var(--text)]">{selectedAsset.title}</div>
                <div className="text-xs text-[var(--text-muted)] leading-relaxed">
                  This is a generated report based on the prompt: "{selectedAsset.prompt}". The report includes data analysis, key findings, and actionable recommendations tailored for {persona.name}.
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text)] flex items-center gap-1">
                    <Download size={12} /> Export PDF
                  </button>
                  <button className="px-3 py-1.5 text-xs rounded-lg text-white flex items-center gap-1" style={{ backgroundColor: persona.color }}>
                    <Copy size={12} /> Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Image / Video / Design / selected asset preview
    if (selectedAsset) {
      return (
        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="relative max-w-3xl w-full">
            <div
              className="aspect-square rounded-2xl shadow-2xl flex items-center justify-center relative overflow-hidden"
              style={{ background: selectedAsset.thumbnail }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-black/20" />
              <div className="relative text-center space-y-4">
                {selectedAsset.type === 'video' ? (
                  <>
                    <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mx-auto">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                    <div>
                      <div className="text-white/90 font-medium text-sm">Video Preview</div>
                      <div className="text-white/50 text-xs mt-1">{selectedAsset.resolution} • {selectedAsset.style}</div>
                    </div>
                  </>
                ) : selectedAsset.type === 'design' ? (
                  <>
                    <Layers size={48} className="text-white/60 mx-auto" />
                    <div>
                      <div className="text-white/90 font-medium text-sm">Design Asset</div>
                      <div className="text-white/50 text-xs mt-1">{selectedAsset.resolution} • {selectedAsset.style}</div>
                    </div>
                  </>
                ) : (
                  <>
                    <Image size={48} className="text-white/60 mx-auto" />
                    <div>
                      <div className="text-white/90 font-medium text-sm">Generated Image</div>
                      <div className="text-white/50 text-xs mt-1">{selectedAsset.resolution} • {selectedAsset.style}</div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-[var(--text)]">{selectedAsset.title}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">
                  {STYLES.find((s) => s.id === selectedAsset.style)?.emoji} {STYLES.find((s) => s.id === selectedAsset.style)?.label} • {selectedAsset.resolution}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDuplicateAsset(selectedAsset)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] flex items-center gap-1"
                >
                  <Copy size={12} /> Duplicate
                </button>
                <button
                  onClick={handleExportCanvas}
                  className="px-3 py-1.5 text-xs rounded-lg text-white flex items-center gap-1"
                  style={{ backgroundColor: persona.color }}
                >
                  <Download size={12} /> Export
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Default empty state for image/video/design
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center" style={{ background: persona.color + '15' }}>
            <ModeIcon size={36} style={{ color: persona.color }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)]">{modeConfig.label} Studio</h3>
            <p className="text-sm text-[var(--text-muted)] mt-2">{modeConfig.description}</p>
          </div>
          <div className="flex items-center justify-center gap-3 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1"><Sparkles size={10} /> Persona: {persona.name}</span>
            <span>•</span>
            <span>{STYLES.length} styles</span>
            <span>•</span>
            <span>{RESOLUTIONS.length} resolutions</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg)]">
      {/* Left Sidebar */}
      <div className={`border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)] transition-all duration-200 ${sidebarCollapsed ? 'w-12' : 'w-72'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-[var(--border)]">
          {!sidebarCollapsed && (
            <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
              <span className="text-base">✨</span>
              Studio
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: persona.color + '20', color: persona.color }}>
                {persona.name}
              </span>
            </h2>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
            {sidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          </button>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* Mode tabs - scrollable horizontal */}
            <div className="flex border-b border-[var(--border)] overflow-x-auto scrollbar-hide">
              {([
                { id: 'image', icon: Image },
                { id: 'video', icon: Video },
                { id: 'design', icon: Palette },
                { id: 'canvas', icon: Pen },
                { id: 'report', icon: FileText },
                { id: 'mindmap', icon: Brain },
                { id: 'flashcard', icon: BookOpen },
                { id: 'kanban', icon: LayoutGrid },
                { id: 'research', icon: Globe },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); setSelectedAsset(null); }}
                  className={`p-2 transition-colors flex-shrink-0 ${
                    mode === m.id ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}
                  title={MODE_CONFIG[m.id].label}
                >
                  <m.icon size={14} />
                </button>
              ))}
            </div>

            {/* Persona templates */}
            {(mode === 'image' || mode === 'video' || mode === 'design') && (
              <div className="p-3 border-b border-[var(--border)]">
                <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Quick Start</div>
                <div className="space-y-1">
                  {templates.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => handleTemplateClick(t)}
                      className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors flex items-center gap-2 group"
                    >
                      <span className="text-sm">{t.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium text-[var(--text)] truncate">{t.label}</div>
                        <div className="text-[9px] text-[var(--text-muted)] truncate">{t.prompt.slice(0, 40)}...</div>
                      </div>
                      <ChevronRight size={12} className="text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Prompt input */}
            {mode !== 'canvas' && mode !== 'kanban' && mode !== 'flashcard' && mode !== 'mindmap' && (
              <div className="p-3 border-b border-[var(--border)] space-y-2">
                <div className="text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Prompt</div>
                <textarea
                  value={config.prompt}
                  onChange={(e) => setConfig((prev) => ({ ...prev, prompt: e.target.value }))}
                  placeholder={`Describe your ${mode}...`}
                  rows={3}
                  className="w-full px-2.5 py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] resize-none"
                />
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !config.prompt.trim()}
                  className="w-full py-2.5 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ backgroundColor: persona.color, color: '#fff' }}
                >
                  {isGenerating ? (
                    <><Loader2 size={12} className="animate-spin" /> Generating...</>
                  ) : (
                    <><Wand2 size={12} /> Generate {modeConfig.label}</>
                  )}
                </button>
              </div>
            )}

            {/* Style selector */}
            {(mode === 'image' || mode === 'video' || mode === 'design') && (
              <div className="p-3 border-b border-[var(--border)] space-y-2">
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full flex items-center justify-between text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider"
                >
                  <span>Style & Settings</span>
                  <ChevronDown size={10} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                </button>
                {showAdvanced && (
                  <>
                    <div className="grid grid-cols-5 gap-1">
                      {STYLES.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => setConfig((prev) => ({ ...prev, style: s.id }))}
                          className={`p-1.5 rounded text-center transition-all ${
                            config.style === s.id ? 'ring-2 ring-[var(--accent)] bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-tertiary)]'
                          }`}
                          title={s.label}
                        >
                          <span className="text-sm">{s.emoji}</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={config.resolution}
                        onChange={(e) => setConfig((prev) => ({ ...prev, resolution: e.target.value }))}
                        className="flex-1 px-2 py-1.5 text-[10px] rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
                      >
                        {RESOLUTIONS.map((r) => (
                          <option key={r.id} value={r.id}>{r.label} ({r.aspect})</option>
                        ))}
                      </select>
                      <select
                        value={config.count}
                        onChange={(e) => setConfig((prev) => ({ ...prev, count: Number(e.target.value) }))}
                        className="w-16 px-2 py-1.5 text-[10px] rounded bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
                      >
                        {[1, 2, 3, 4].map((n) => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Asset library */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-3 pb-1 text-[10px] font-medium text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
                <span>Assets ({filteredAssets.length})</span>
                {filteredAssets.length > 0 && (
                  <button
                    onClick={() => setAssets((prev) => prev.filter((a) => a.persona !== activePersona))}
                    className="text-[9px] text-[var(--text-muted)] hover:text-[var(--danger)]"
                  >
                    Clear
                  </button>
                )}
              </div>
              {filteredAssets.length === 0 ? (
                <div className="p-6 text-center text-[var(--text-muted)]">
                  <Sparkles size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">No assets yet</p>
                  <p className="text-[10px] mt-1">Use a template or write a prompt</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 p-2">
                  {filteredAssets.map((asset) => (
                    <div
                      key={asset.id}
                      onClick={() => asset.status === 'ready' && setSelectedAsset(asset)}
                      className={`group relative rounded-lg overflow-hidden cursor-pointer transition-all ${
                        selectedAsset?.id === asset.id ? 'ring-2 ring-[var(--accent)]' : 'hover:ring-1 hover:ring-[var(--border)]'
                      }`}
                    >
                      <div className="aspect-square relative" style={{ background: asset.thumbnail }}>
                        {asset.status === 'generating' && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <Loader2 size={16} className="animate-spin text-white" />
                          </div>
                        )}
                        {asset.type === 'video' && (
                          <div className="absolute bottom-1 right-1 bg-black/70 rounded px-1 py-0.5">
                            <Play size={8} className="text-white" />
                          </div>
                        )}
                        {asset.status === 'ready' && (
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDuplicateAsset(asset); }}
                              className="p-0.5 bg-black/60 rounded text-white hover:bg-black/80"
                            >
                              <Copy size={8} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset.id); }}
                              className="p-0.5 bg-black/60 rounded text-white hover:bg-red-600"
                            >
                              <Trash2 size={8} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-1">
                        <div className="text-[9px] font-medium text-[var(--text)] truncate">{asset.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-10 border-b border-[var(--border)] flex items-center px-3 gap-2 bg-[var(--bg-secondary)]">
          {mode === 'canvas' && (
            <>
              {([
                { id: 'select', icon: Move, label: 'Select' },
                { id: 'brush', icon: Brush, label: 'Brush' },
                { id: 'eraser', icon: Eraser, label: 'Eraser' },
                { id: 'text', icon: Type, label: 'Text' },
                { id: 'shape', icon: Shapes, label: 'Shape' },
                { id: 'eyedropper', icon: Pipette, label: 'Eyedropper' },
              ] as const).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => setCanvasTool(tool.id)}
                  className={`p-1.5 rounded transition-colors ${
                    canvasTool === tool.id ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]'
                  }`}
                  title={tool.label}
                >
                  <tool.icon size={14} />
                </button>
              ))}
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <input type="color" value={brushColor} onChange={(e) => setBrushColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent" title="Color" />
              <input type="range" min="1" max="50" value={brushSize} onChange={(e) => setBrushSize(Number(e.target.value))} className="w-16 h-1 accent-[var(--accent)]" title={`Size: ${brushSize}px`} />
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <button onClick={() => setCanvasZoom((z) => Math.min(z + 0.25, 3))} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><ZoomIn size={14} /></button>
              <span className="text-[10px] text-[var(--text-muted)] w-10 text-center">{Math.round(canvasZoom * 100)}%</span>
              <button onClick={() => setCanvasZoom((z) => Math.max(z - 0.25, 0.25))} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><ZoomOut size={14} /></button>
              <button onClick={() => setShowGrid((g) => !g)} className={`p-1.5 rounded ${showGrid ? 'bg-[var(--bg-tertiary)] text-[var(--text)]' : 'text-[var(--text-muted)]'}`}><Grid3x3 size={14} /></button>
              <div className="w-px h-5 bg-[var(--border)] mx-1" />
              <button onClick={handleClearCanvas} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><RotateCcw size={14} /></button>
              <button onClick={handleExportCanvas} className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><Download size={14} /></button>
            </>
          )}
          {mode !== 'canvas' && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                <ModeIcon size={14} style={{ color: persona.color }} />
                <span className="font-medium text-[var(--text)]">{modeConfig.label}</span>
              </div>
              <div className="flex-1" />
              {selectedAsset && (
                <>
                  <button className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><Download size={14} /></button>
                  <button className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><Maximize2 size={14} /></button>
                  <button className="p-1.5 rounded text-[var(--text-muted)] hover:bg-[var(--bg-tertiary)]"><RefreshCw size={14} /></button>
                </>
              )}
            </>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden relative">
          {renderMainContent()}
        </div>

        {/* Bottom bar */}
        <div className="h-7 border-t border-[var(--border)] flex items-center px-3 gap-3 bg-[var(--bg-secondary)] text-[10px] text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: persona.color }} />
            {persona.name}
          </span>
          <span>•</span>
          <span>{activeStyle.emoji} {activeStyle.label}</span>
          <span>•</span>
          <span>{activeRes.label}</span>
          <div className="flex-1" />
          {mode === 'kanban' && (
            <>
              <span>{filteredTasks.filter((t) => t.status === 'done').length}/{filteredTasks.length} done</span>
            </>
          )}
          {mode === 'flashcard' && (
            <>
              <span>{filteredCards.filter((c) => c.mastered).length}/{filteredCards.length} mastered</span>
            </>
          )}
          {mode !== 'kanban' && mode !== 'flashcard' && (
            <>
              <span>{filteredAssets.filter((a) => a.status === 'ready').length} ready</span>
              <span>{filteredAssets.filter((a) => a.status === 'generating').length} generating</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
