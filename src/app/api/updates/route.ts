import { NextResponse } from 'next/server';

export interface ChangelogEntry {
  id: string;
  date: string;
  title: string;
  description: string;
  type: 'feature' | 'improvement' | 'fix' | 'announcement';
  read: boolean;
}

const changelog: ChangelogEntry[] = [
  {
    id: 'upd-001',
    date: '2026-06-28',
    title: 'Token Cost Dashboard',
    description: 'New panel showing per-model cost breakdown, daily trends, budget tracking, and optimization suggestions. Export to CSV.',
    type: 'feature',
    read: false,
  },
  {
    id: 'upd-002',
    date: '2026-06-28',
    title: 'Modular Customizable Panels',
    description: 'Toggle panels on/off in Settings. Drag to reorder. Choose Default, Minimal, or Full layout presets.',
    type: 'feature',
    read: false,
  },
  {
    id: 'upd-003',
    date: '2026-06-28',
    title: 'Daily Updates / Living System',
    description: 'This panel! Stay informed about new features, improvements, and system announcements.',
    type: 'feature',
    read: false,
  },
  {
    id: 'upd-004',
    date: '2026-06-27',
    title: 'Memory Galaxy v2',
    description: 'Auto-building knowledge graph now extracts facts every 5 minutes from agent sessions. Visual galaxy view with semantic search.',
    type: 'improvement',
    read: true,
  },
  {
    id: 'upd-005',
    date: '2026-06-27',
    title: 'Loop Engineering',
    description: 'Self-improving agent workflows. Post-pipeline quality scoring with auto-generated improvement suggestions.',
    type: 'feature',
    read: true,
  },
  {
    id: 'upd-006',
    date: '2026-06-26',
    title: 'Studio Section',
    description: 'Integrated voice, image, and video generation. All outputs saved to Cloudflare R2 with gallery view.',
    type: 'feature',
    read: true,
  },
  {
    id: 'upd-007',
    date: '2026-06-26',
    title: 'Research → Multi-Format Output',
    description: 'Single research input now generates markdown reports, infographics, and podcast scripts automatically.',
    type: 'feature',
    read: true,
  },
  {
    id: 'upd-008',
    date: '2026-06-25',
    title: 'Substack Automation Agent',
    description: 'Daily cron researches trending topics per vertical (MCF, Robbi, Fathom) and generates SEO-optimized drafts.',
    type: 'feature',
    read: true,
  },
  {
    id: 'upd-009',
    date: '2026-06-25',
    title: 'Jarvis Voice Controls Fixed',
    description: 'Fixed TTS reconnection after voice session timeout. Voice commands now properly trigger navigation events.',
    type: 'fix',
    read: true,
  },
  {
    id: 'upd-010',
    date: '2026-06-24',
    title: 'Idea → Implement Pipeline',
    description: 'One-click pipeline: text idea → Planner agent → preview plan → approve → auto-build → review. Real-time progress bar.',
    type: 'feature',
    read: true,
  },
];

export async function GET() {
  return NextResponse.json({
    entries: changelog,
    unreadCount: changelog.filter((e) => !e.read).length,
    lastUpdated: new Date().toISOString(),
  });
}

export async function POST(req: Request) {
  // Mark entry as read
  const { id } = await req.json();
  const entry = changelog.find((e) => e.id === id);
  if (entry) {
    entry.read = true;
  }
  return NextResponse.json({ success: true });
}
