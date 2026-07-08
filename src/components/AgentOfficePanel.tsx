'use client';

import { useState, useRef, useCallback } from 'react';
import { useAgentStore } from '@/stores/agentStore';

// ─── Types ─────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'running' | 'error' | 'paused';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: AgentStatus;
  description: string;
  x: number;
  y: number;
  zoneId: string;
}

interface Zone {
  id: string;
  label: string;
  accent: string;       // CSS color string
  glowColor: string;    // rgba glow
  x: number;            // left position (px) on floor plan
  y: number;            // top position (px) on floor plan
  w: number;            // width (px)
  h: number;            // height (px)
  agentIds: string[];
}

interface PipelinePath {
  from: string;   // zone id
  to: string;     // zone id
  label?: string;
}

// ─── Static Data ───────────────────────────────────────────────────────────

const ZONES: Zone[] = [
  { id: 'planning', label: '🗺️ Planning Room', accent: '#818cf8', glowColor: 'rgba(129,140,248,0.35)', x: 24, y: 24, w: 260, h: 200, agentIds: [] },
  { id: 'build',    label: '🔨 Build Zone',    accent: '#10b981', glowColor: 'rgba(16,185,129,0.35)', x: 320, y: 24, w: 260, h: 200, agentIds: [] },
  { id: 'review',   label: '👁️ Review Bay',    accent: '#ec4899', glowColor: 'rgba(236,72,153,0.35)', x: 616, y: 24, w: 260, h: 200, agentIds: [] },
  { id: 'research', label: '🔬 Research Wing',  accent: '#3b82f6', glowColor: 'rgba(59,130,246,0.35)',  x: 24, y: 268, w: 380, h: 200, agentIds: [] },
  { id: 'qa',       label: '🧪 QA Lab',        accent: '#a855f7', glowColor: 'rgba(168,85,247,0.35)', x: 440, y: 268, w: 220, h: 200, agentIds: [] },
  { id: 'voice',    label: '🎙️ Voice Hub',     accent: '#f59e0b', glowColor: 'rgba(245,158,11,0.35)',  x: 698, y: 268, w: 178, h: 200, agentIds: [] },
  { id: 'breakroom', label: '☕ Break Room',   accent: '#f97316', glowColor: 'rgba(249,115,22,0.35)',  x: 900, y: 140, w: 260, h: 440, agentIds: [] },
];

const PIPELINES: PipelinePath[] = [
  { from: 'planning', to: 'build',    label: 'tasks' },
  { from: 'build',    to: 'review',   label: 'PR' },
  { from: 'research', to: 'planning', label: 'insight' },
  { from: 'review',   to: 'qa',       label: 'release' },
  { from: 'qa',       to: 'voice',    label: 'alert' },
];

const STATUS_CONFIG: Record<AgentStatus, { ring: string; glow: string; label: string; dot: string }> = {
  idle:    { ring: '#475569', glow: 'transparent',              label: 'Idle',    dot: '#475569' },
  running: { ring: '#22d3ee', glow: 'rgba(34,211,238,0.55)',   label: 'Running', dot: '#22d3ee' },
  error:   { ring: '#ef4444', glow: 'rgba(239,68,68,0.55)',    label: 'Error',   dot: '#ef4444' },
  paused:  { ring: '#f59e0b', glow: 'rgba(245,158,11,0.45)',   label: 'Paused',  dot: '#f59e0b' },
};

// Shading helper for VoxelCharacter colors
function adjustColor(hex: string, percent: number) {
  let num = parseInt(hex.replace("#", ""), 16),
    amt = Math.round(2.55 * percent),
    R = (num >> 16) + amt,
    G = (num >> 8 & 0x00FF) + amt,
    B = (num & 0x0000FF) + amt;
  return "#" + (0x1000000 + (R < 255 ? R < 0 ? 0 : R : 255) * 0x10000 + (G < 255 ? G < 0 ? 0 : G : 255) * 0x100 + (B < 255 ? B < 0 ? 0 : B : 255)).toString(16).slice(1);
}

// ─── Main Office Coordinate Space ──────────────────────────────────────────

const cx = 700;
const cy = 60;
const scale = 5.2;

const isoX = (x: number, y: number) => cx + (x - y) * 0.866 * scale;
const isoY = (x: number, y: number, z: number) => cy + (x + y) * 0.5 * scale - z * scale;

// 3D Block SVG Drawer
function Block({ oX, oY, oZ, sX, sY, sZ, cTop, cLeft, cRight, className }: any) {
  const topD = `
    M ${isoX(oX, oY)} ${isoY(oX, oY, oZ + sZ)}
    L ${isoX(oX + sX, oY)} ${isoY(oX + sX, oY, oZ + sZ)}
    L ${isoX(oX + sX, oY + sY)} ${isoY(oX + sX, oY + sY, oZ + sZ)}
    L ${isoX(oX, oY + sY)} ${isoY(oX, oY + sY, oZ + sZ)}
    Z
  `;

  const leftD = `
    M ${isoX(oX + sX, oY)} ${isoY(oX + sX, oY, oZ)}
    L ${isoX(oX + sX, oY + sY)} ${isoY(oX + sX, oY + sY, oZ)}
    L ${isoX(oX + sX, oY + sY)} ${isoY(oX + sX, oY + sY, oZ + sZ)}
    L ${isoX(oX + sX, oY)} ${isoY(oX + sX, oY, oZ + sZ)}
    Z
  `;

  const rightD = `
    M ${isoX(oX, oY)} ${isoY(oX, oY, oZ)}
    L ${isoX(oX + sX, oY)} ${isoY(oX + sX, oY, oZ)}
    L ${isoX(oX + sX, oY)} ${isoY(oX + sX, oY, oZ + sZ)}
    L ${isoX(oX, oY)} ${isoY(oX, oY, oZ + sZ)}
    Z
  `;

  return (
    <g className={className}>
      <path d={rightD} fill={cRight} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      <path d={leftD} fill={cLeft} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      <path d={topD} fill={cTop} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
    </g>
  );
}

function StatusLegend() {
  return (
    <div
      style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        fontSize: 10,
        color: '#64748b',
        fontFamily: 'monospace',
      }}
    >
      {(Object.entries(STATUS_CONFIG) as [AgentStatus, typeof STATUS_CONFIG[AgentStatus]][]).map(([key, cfg]) => (
        <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: cfg.dot,
              boxShadow: key === 'running' ? `0 0 6px ${cfg.glow}` : undefined,
              display: 'inline-block',
            }}
          />
          {cfg.label}
        </span>
      ))}
    </div>
  );
}

// ─── Voxel Character Component ──────────────────────────────────────────────

function VoxelCharacter({ role, status, scale: charScale = 2.4 }: { role: string; status: string; scale?: number }) {
  const roleColors: Record<string, { hair: string; shirt: string; pants: string; skin: string }> = {
    planner: { hair: '#eab308', shirt: '#06B6D4', pants: '#1e293b', skin: '#fbcfe8' },
    architect: { hair: '#78350f', shirt: '#3B82F6', pants: '#1e3a8a', skin: '#fed7aa' },
    builder: { hair: '#18181b', shirt: '#10B981', pants: '#27272a', skin: '#fef08a' },
    refactor: { hair: '#451a03', shirt: '#64748B', pants: '#1e293b', skin: '#ffedd5' },
    reviewer: { hair: '#ca8a04', shirt: '#EC4899', pants: '#0f172a', skin: '#fed7aa' },
    security: { hair: '#1c1917', shirt: '#EF4444', pants: '#18181b', skin: '#ffedd5' },
    researcher: { hair: '#ea580c', shirt: '#2563EB', pants: '#172554', skin: '#fed7aa' },
    docs: { hair: '#5b21b6', shirt: '#14B8A6', pants: '#022c22', skin: '#ffedd5' },
    sdr: { hair: '#d97706', shirt: '#84CC16', pants: '#1e293b', skin: '#fed7aa' },
    e2e: { hair: '#854d0e', shirt: '#A855F7', pants: '#3b0764', skin: '#ffedd5' },
    explorer: { hair: '#172554', shirt: '#0EA5E9', pants: '#0f172a', skin: '#fed7aa' },
    jarvis: { hair: '#ca8a04', shirt: '#8B5CF6', pants: '#1e1b4b', skin: '#ffedd5' },
  };

  const normRole = role.toLowerCase();
  const colors = roleColors[normRole] || { hair: '#78350f', shirt: '#3b82f6', pants: '#1e293b', skin: '#fed7aa' };

  const skinTop = adjustColor(colors.skin, 10);
  const skinLeft = colors.skin;
  const skinRight = adjustColor(colors.skin, -10);

  const shirtTop = adjustColor(colors.shirt, 15);
  const shirtLeft = colors.shirt;
  const shirtRight = adjustColor(colors.shirt, -15);

  const pantsTop = adjustColor(colors.pants, 10);
  const pantsLeft = colors.pants;
  const pantsRight = adjustColor(colors.pants, -10);

  const hairTop = adjustColor(colors.hair, 15);
  const hairLeft = colors.hair;
  const hairRight = adjustColor(colors.hair, -15);

  const charCx = 10;
  const charCy = 22;

  const charIsoX = (x: number, y: number) => charCx + (x - y) * 0.866 * charScale;
  const charIsoY = (x: number, y: number, z: number) => charCy + (x + y) * 0.5 * charScale - z * charScale;

  const CharBlock = ({ oX, oY, oZ, sX, sY, sZ, cTop, cLeft, cRight }: any) => {
    const topD = `
      M ${charIsoX(oX, oY)} ${charIsoY(oX, oY, oZ + sZ)}
      L ${charIsoX(oX + sX, oY)} ${charIsoY(oX + sX, oY, oZ + sZ)}
      L ${charIsoX(oX + sX, oY + sY)} ${charIsoY(oX + sX, oY + sY, oZ + sZ)}
      L ${charIsoX(oX, oY + sY)} ${charIsoY(oX, oY + sY, oZ + sZ)}
      Z
    `;

    const leftD = `
      M ${charIsoX(oX + sX, oY)} ${charIsoY(oX + sX, oY, oZ)}
      L ${charIsoX(oX + sX, oY + sY)} ${charIsoY(oX + sX, oY + sY, oZ)}
      L ${charIsoX(oX + sX, oY + sY)} ${charIsoY(oX + sX, oY + sY, oZ + sZ)}
      L ${charIsoX(oX + sX, oY)} ${charIsoY(oX + sX, oY, oZ + sZ)}
      Z
    `;

    const rightD = `
      M ${charIsoX(oX, oY)} ${charIsoY(oX, oY, oZ)}
      L ${charIsoX(oX + sX, oY)} ${charIsoY(oX + sX, oY, oZ)}
      L ${charIsoX(oX + sX, oY)} ${charIsoY(oX + sX, oY, oZ + sZ)}
      L ${charIsoX(oX, oY)} ${charIsoY(oX, oY, oZ + sZ)}
      Z
    `;

    return (
      <g>
        <path d={rightD} fill={cRight} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
        <path d={leftD} fill={cLeft} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
        <path d={topD} fill={cTop} stroke="rgba(0,0,0,0.06)" strokeWidth="0.5" />
      </g>
    );
  };

  return (
    <svg width="24" height="30" viewBox="0 0 24 30" style={{ overflow: 'visible' }}>
      {/* Legs */}
      <CharBlock oX={-1.4} oY={-0.6} oZ={0} sX={1.0} sY={1.0} sZ={2.8} cTop={pantsTop} cLeft={pantsLeft} cRight={pantsRight} />
      <CharBlock oX={0.4} oY={-0.6} oZ={0} sX={1.0} sY={1.0} sZ={2.8} cTop={pantsTop} cLeft={pantsLeft} cRight={pantsRight} />
      {/* Torso */}
      <CharBlock oX={-1.7} oY={-0.8} oZ={2.8} sX={3.4} sY={1.6} sZ={4.4} cTop={shirtTop} cLeft={shirtLeft} cRight={shirtRight} />
      {/* Arms */}
      <CharBlock oX={-2.5} oY={-0.6} oZ={3.6} sX={0.8} sY={1.2} sZ={3.2} cTop={shirtTop} cLeft={shirtLeft} cRight={shirtRight} />
      <CharBlock oX={1.7} oY={-0.6} oZ={3.6} sX={0.8} sY={1.2} sZ={3.2} cTop={shirtTop} cLeft={shirtLeft} cRight={shirtRight} />
      {/* Head */}
      <CharBlock oX={-1.3} oY={-1.3} oZ={7.2} sX={2.6} sY={2.6} sZ={2.6} cTop={skinTop} cLeft={skinLeft} cRight={skinRight} />
      {/* Eyes */}
      <polygon points={`${charIsoX(1.3, -0.5)} ${charIsoY(1.3, -0.5, 8.7)} ${charIsoX(1.3, -0.1)} ${charIsoY(1.3, -0.1, 8.7)} ${charIsoX(1.3, -0.1)} ${charIsoY(1.3, -0.1, 9.2)} ${charIsoX(1.3, -0.5)} ${charIsoY(1.3, -0.5, 9.2)}`} fill="#111827" />
      <polygon points={`${charIsoX(1.3, 0.4)} ${charIsoY(1.3, 0.4, 8.7)} ${charIsoX(1.3, 0.8)} ${charIsoY(1.3, 0.8, 8.7)} ${charIsoX(1.3, 0.8)} ${charIsoY(1.3, 0.8, 9.2)} ${charIsoX(1.3, 0.4)} ${charIsoY(1.3, 0.4, 9.2)}`} fill="#111827" />
      {/* Hair */}
      <CharBlock oX={-1.4} oY={-1.4} oZ={9.8} sX={2.8} sY={2.8} sZ={0.8} cTop={hairTop} cLeft={hairLeft} cRight={hairRight} />
      <CharBlock oX={-1.4} oY={0.6} oZ={7.6} sX={2.8} sY={0.8} sZ={2.2} cTop={hairTop} cLeft={hairLeft} cRight={hairRight} />
    </svg>
  );
}

// ─── Massive Office Boundaries & Large Separated Room Walls ──────────────────

const WALLS = [
  // Planning Room corner walls (0..30, 0..26)
  { x: 0, y: 0, sX: 30, sY: 1, sZ: 6 },
  { x: 0, y: 0, sX: 1, sY: 26, sZ: 6 },

  // Build Zone corner walls (36..66, 0..26)
  { x: 36, y: 0, sX: 30, sY: 1, sZ: 6 },
  { x: 36, y: 0, sX: 1, sY: 26, sZ: 6 },

  // Review Bay corner walls (72..102, 0..26)
  { x: 72, y: 0, sX: 30, sY: 1, sZ: 6 },
  { x: 72, y: 0, sX: 1, sY: 26, sZ: 6 },

  // Research Wing corner walls (0..44, 32..58)
  { x: 0, y: 32, sX: 44, sY: 1, sZ: 6 },
  { x: 0, y: 32, sX: 1, sY: 26, sZ: 6 },

  // QA Lab corner walls (50..72, 32..58)
  { x: 50, y: 32, sX: 22, sY: 1, sZ: 6 },
  { x: 50, y: 32, sX: 1, sY: 26, sZ: 6 },

  // Voice Hub corner walls (78..102, 32..58)
  { x: 78, y: 32, sX: 24, sY: 1, sZ: 6 },
  { x: 78, y: 32, sX: 1, sY: 26, sZ: 6 },

  // Break Room boundaries (108..138, 0..58)
  { x: 108, y: 0, sX: 30, sY: 1, sZ: 6 },
  { x: 108, y: 0, sX: 1, sY: 16, sZ: 6 },
  { x: 108, y: 22, sX: 1, sY: 16, sZ: 6 },
  { x: 108, y: 44, sX: 1, sY: 14, sZ: 6 },
];

const DECORATIONS = [
  // Corner potted plants
  { type: 'plant', x: 2, y: 2 },
  { type: 'plant', x: 98, y: 2 },
  { type: 'plant', x: 2, y: 54 },
  { type: 'plant', x: 96, y: 54 },
  
  // Break Room plants
  { type: 'plant', x: 134, y: 2 },
  { type: 'plant', x: 134, y: 54 },

  // Planning Room meeting table
  { type: 'meeting_table', x: 11, y: 8 },
  // Lounge Sofa in Voice Hub
  { type: 'sofa_voice', x: 91, y: 37 },

  // Break Room Cafeteria Furniture
  { type: 'dining_table', x: 120, y: 24 },
  { type: 'dining_chair', x: 117, y: 26 },
  { type: 'dining_chair', x: 117, y: 30 },
  { type: 'dining_chair', x: 117, y: 34 },
  { type: 'dining_chair', x: 128, y: 26 },
  { type: 'dining_chair', x: 128, y: 30 },
  { type: 'dining_chair', x: 128, y: 34 },

  { type: 'red_sofa', x: 111, y: 6 },
  { type: 'red_sofa', x: 111, y: 48 },
  { type: 'red_sofa', x: 128, y: 6 },

  { type: 'coffee_table', x: 112, y: 11 },
  { type: 'coffee_table', x: 112, y: 43 },
  { type: 'coffee_table', x: 129, y: 11 },
];

const ROOM_CENTERS: Record<string, { x: number; y: number }> = {
  planning:  { x: 15,  y: 13 },
  build:     { x: 51,  y: 13 },
  review:    { x: 87,  y: 13 },
  research:  { x: 22,  y: 45 },
  qa:        { x: 61,  y: 45 },
  voice:     { x: 89,  y: 45 },
  breakroom: { x: 123, y: 29 },
};

// 12 Static Workstations (Desks remain in place)
const STATIC_DESKS = [
  { id: 'planner',    role: 'planner',    x: 5,  y: 18 },
  { id: 'architect',  role: 'architect',  x: 22, y: 18 },
  { id: 'builder',    role: 'builder',    x: 41, y: 10 },
  { id: 'refactor',   role: 'refactor',   x: 57, y: 10 },
  { id: 'reviewer',   role: 'reviewer',   x: 77, y: 10 },
  { id: 'security',   role: 'security',   x: 93, y: 10 },
  { id: 'researcher', role: 'researcher', x: 5,  y: 45 },
  { id: 'docs',       role: 'docs',       x: 20, y: 45 },
  { id: 'sdr',        role: 'sdr',        x: 35, y: 45 },
  { id: 'e2e',        role: 'e2e',        x: 54, y: 45 },
  { id: 'explorer',   role: 'explorer',   x: 66, y: 45 },
  { id: 'jarvis',     role: 'jarvis',     x: 83, y: 45 },
];

// Break Room coordinates for idle characters to gather
const BREAKROOM_SLOTS = [
  { x: 113, y: 9  }, // sitting on red sofa 1
  { x: 115, y: 9  }, // sitting on red sofa 1
  { x: 113, y: 49 }, // sitting on red sofa 2
  { x: 115, y: 49 }, // sitting on red sofa 2
  { x: 129, y: 9  }, // sitting on red sofa 3
  { x: 131, y: 9  }, // sitting on red sofa 3
  { x: 117, y: 27 }, // sitting at dining table
  { x: 117, y: 31 }, // sitting at dining table
  { x: 128, y: 27 }, // sitting at dining table
  { x: 128, y: 31 }, // sitting at dining table
  { x: 122, y: 18 }, // standing around
  { x: 122, y: 38 }, // standing around
];

function getZoneForRole(role: string): string {
  const r = role.toLowerCase();
  if (r.includes('planner') || r.includes('architect') || r.includes('planning')) return 'planning';
  if (r.includes('builder') || r.includes('refactor') || r.includes('build') || r.includes('fast')) return 'build';
  if (r.includes('reviewer') || r.includes('review') || r.includes('security') || r.includes('perf') || r.includes('silent')) return 'review';
  if (r.includes('researcher') || r.includes('research') || r.includes('docs') || r.includes('sdr')) return 'research';
  if (r.includes('e2e') || r.includes('explorer') || r.includes('test') || r.includes('qa')) return 'qa';
  if (r.includes('jarvis') || r.includes('voice') || r.includes('orchestrator')) return 'voice';
  return 'research'; // default
}

// ─── Main Component ─────────────────────────────────────────────────────────

const CANVAS_W = 1380;
const CANVAS_H = 680;

export default function AgentOfficePanel() {
  const storeAgents = useAgentStore((s) => s.agents);
  const pauseAgent = useAgentStore((s) => s.pauseAgent);
  const restartAgent = useAgentStore((s) => s.restartAgent);
  const killAgent = useAgentStore((s) => s.killAgent);

  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Group active vs idle agents
  let currentIdleCount = 0;

  const agents: Agent[] = storeAgents.map(sa => {
    let status: AgentStatus = 'idle';
    if (sa.status === 'active') status = 'running';
    else if (sa.status === 'error') status = 'error';

    const isJarvis = sa.role.toLowerCase() === 'jarvis';
    
    // Dynamic coordinate mapping:
    // If idle (and not Jarvis receptionist), place them in the Break Room slots!
    // Otherwise place them at their static workstation desk!
    let pos = { x: 0, y: 0 };
    let zoneId = 'breakroom';

    if (status === 'idle' && !isJarvis) {
      const idx = currentIdleCount;
      currentIdleCount++;
      pos = BREAKROOM_SLOTS[idx % BREAKROOM_SLOTS.length];
      zoneId = 'breakroom';
    } else {
      // Find the static desk matching their role
      const sd = STATIC_DESKS.find(d => sa.role.toLowerCase().includes(d.role)) || STATIC_DESKS[0];
      pos = { x: sd.x, y: sd.y };
      zoneId = getZoneForRole(sa.role);
    }

    return {
      id: sa.id,
      name: sa.name,
      role: sa.role,
      status,
      description: sa.skills.join(', ') || 'No special capabilities listed',
      x: pos.x,
      y: pos.y,
      zoneId,
    };
  });

  const agentMap = new Map(agents.map(a => [a.id, a]));
  const selectedAgent = selected ? agentMap.get(selected) ?? null : null;

  // Determine active zone presence (running agents count towards zone highlights)
  const zones = ZONES.map(z => ({
    ...z,
    agentIds: agents.filter(a => a.zoneId === z.id).map(a => a.id),
  }));

  const cycleStatus = useCallback((id: string) => {
    const storeAgent = storeAgents.find(sa => sa.id === id);
    if (!storeAgent) return;

    if (storeAgent.status === 'idle') {
      restartAgent(id);
    } else if (storeAgent.status === 'active') {
      killAgent(id);
    } else {
      pauseAgent(id);
    }
  }, [storeAgents, restartAgent, killAgent, pauseAgent]);

  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const handleReset   = () => setZoom(1);

  const runCount   = agents.filter(a => a.status === 'running').length;
  const errorCount = agents.filter(a => a.status === 'error').length;

  // Build the scene rendering queue (Painter's algorithm sorting by x + y depth)
  const sceneItems: Array<{ sortKey: number; render: () => React.ReactNode }> = [];

  // 1. Divider walls
  WALLS.forEach((w, idx) => {
    sceneItems.push({
      sortKey: (w.x + w.sX / 2) + (w.y + w.sY / 2),
      render: () => (
        <Block
          key={`wall-${idx}`}
          oX={w.x} oY={w.y} oZ={0}
          sX={w.sX} sY={w.sY} sZ={w.sZ}
          cTop="#374151" cLeft="#1f2937" cRight="#111827"
        />
      )
    });
  });

  // 2. Decorative elements
  DECORATIONS.forEach((d, idx) => {
    if (d.type === 'plant') {
      sceneItems.push({
        sortKey: d.x + d.y + 1,
        render: () => (
          <g key={`decor-${idx}`}>
            <Block oX={d.x + 0.4} oY={d.y + 0.4} oZ={0} sX={1.2} sY={1.2} sZ={1.2} cTop="#b45309" cLeft="#78350f" cRight="#451a03" />
            <Block oX={d.x + 0.9} oY={d.y + 0.9} oZ={1.2} sX={0.2} sY={0.2} sZ={1.2} cTop="#78350f" cLeft="#451a03" cRight="#271b0b" />
            <Block oX={d.x} oY={d.y} oZ={2.4} sX={2} sY={2} sZ={2.4} cTop="#16a34a" cLeft="#15803d" cRight="#166534" />
          </g>
        )
      });
    } else if (d.type === 'meeting_table') {
      sceneItems.push({
        sortKey: d.x + d.y + 4,
        render: () => (
          <g key={`decor-${idx}`}>
            <Block oX={d.x} oY={d.y} oZ={0} sX={8} sY={6} sZ={2} cTop="#78350f" cLeft="#451a03" cRight="#271b0b" />
          </g>
        )
      });
    } else if (d.type === 'sofa_voice') {
      sceneItems.push({
        sortKey: d.x + d.y + 3.5,
        render: () => (
          <g key={`decor-${idx}`}>
            <Block oX={d.x} oY={d.y} oZ={0} sX={5} sY={2} sZ={1.5} cTop="#1e3a8a" cLeft="#172554" cRight="#0f172a" />
            <Block oX={d.x} oY={d.y + 1.4} oZ={1.5} sX={5} sY={0.6} sZ={1.8} cTop="#1e3a8a" cLeft="#172554" cRight="#0f172a" />
          </g>
        )
      });
    } else if (d.type === 'dining_table') {
      sceneItems.push({
        sortKey: d.x + d.y + 6,
        render: () => (
          <g key={`decor-${idx}`}>
            <Block oX={d.x} oY={d.y} oZ={0} sX={6} sY={10} sZ={2} cTop="#854d0e" cLeft="#713f12" cRight="#452207" />
          </g>
        )
      });
    } else if (d.type === 'dining_chair') {
      sceneItems.push({
        sortKey: d.x + d.y + 1.5,
        render: () => (
          <Block key={`decor-${idx}`} oX={d.x} oY={d.y} oZ={0} sX={1.5} sY={1.5} sZ={1.8} cTop="#3f3f46" cLeft="#27272a" cRight="#18181b" />
        )
      });
    } else if (d.type === 'red_sofa') {
      sceneItems.push({
        sortKey: d.x + d.y + 3.5,
        render: () => (
          <g key={`decor-${idx}`}>
            <Block oX={d.x} oY={d.y} oZ={0} sX={5} sY={2} sZ={1.2} cTop="#b91c1c" cLeft="#991b1b" cRight="#7f1d1d" />
            <Block oX={d.x} oY={d.y + 1.4} oZ={1.2} sX={5} sY={0.6} sZ={1.5} cTop="#b91c1c" cLeft="#991b1b" cRight="#7f1d1d" />
          </g>
        )
      });
    } else if (d.type === 'coffee_table') {
      sceneItems.push({
        sortKey: d.x + d.y + 2,
        render: () => (
          <Block key={`decor-${idx}`} oX={d.x} oY={d.y} oZ={0} sX={3} sY={2} sZ={1} cTop="#27272a" cLeft="#18181b" cRight="#09090b" />
        )
      });
    }
  });

  // 3. Render 12 Static Workstations (Desks are permanent features)
  STATIC_DESKS.forEach((desk) => {
    // Find the store agent corresponding to this desk
    const sa = storeAgents.find(x => x.role.toLowerCase().includes(desk.role));
    const isSelected = sa ? selected === sa.id : false;
    const isRunning = sa ? sa.status === 'active' : false;

    sceneItems.push({
      sortKey: desk.x + desk.y + 1.5,
      render: () => (
        <g 
          key={`desk-${desk.id}`} 
          onClick={() => sa && setSelected(prev => prev === sa.id ? null : sa.id)}
          style={{ cursor: sa ? 'pointer' : 'default' }}
          className={sa ? 'desk-interactive' : ''}
        >
          {/* Chair */}
          <Block
            oX={desk.x + 1.2} oY={desk.y - 1.8} oZ={0}
            sX={1.6} sY={1.6} sZ={1.8}
            cTop="#27272a" cLeft="#18181b" cRight="#09090b"
          />

          {/* Table */}
          <Block
            oX={desk.x} oY={desk.y} oZ={0}
            sX={4} sY={2} sZ={2.2}
            cTop={isSelected ? '#d97706' : '#78350f'}
            cLeft={isSelected ? '#b45309' : '#582f0e'}
            cRight={isSelected ? '#92400e' : '#3f1d0b'}
            className="desk-wood"
          />

          {/* Monitor stand & Screen */}
          <Block oX={desk.x + 1.8} oY={desk.y + 0.8} oZ={2.2} sX={0.4} sY={0.4} sZ={0.4} cTop="#27272a" cLeft="#18181b" cRight="#09090b" />
          <Block oX={desk.x + 1.0} oY={desk.y + 0.8} oZ={2.6} sX={2.0} sY={0.2} sZ={1.2} cTop="#18181b" cLeft="#09090b" cRight={isRunning ? '#22d3ee' : '#374151'} />
        </g>
      )
    });
  });

  // 4. Render Live Agent Characters at their CURRENT coordinate positions
  agents.forEach((agent) => {
    const isSelected = selected === agent.id;
    const cfg = STATUS_CONFIG[agent.status];

    sceneItems.push({
      sortKey: agent.x + agent.y + 1.0,
      render: () => {
        const tx = isoX(agent.x + 2, agent.y - 1);
        const ty = isoY(agent.x + 2, agent.y - 1, 14.5);

        const charAnimClass = agent.status === 'running' 
          ? 'voxel-bounce-anim' 
          : agent.status === 'error' 
            ? 'voxel-shiver-anim' 
            : '';

        return (
          <g key={`char-${agent.id}`} className={charAnimClass} onClick={() => setSelected(prev => prev === agent.id ? null : agent.id)} style={{ cursor: 'pointer' }}>
            {/* Position character */}
            <g transform={`translate(${isoX(agent.x + 2, agent.y - 1) - 12}, ${isoY(agent.x + 2, agent.y - 1, 0) - 24})`}>
              <VoxelCharacter role={agent.role} status={agent.status} scale={2.4} />
            </g>

            {/* Nameplate tag floating above head */}
            <g style={{ pointerEvents: 'none' }}>
              <rect x={tx - 24} y={ty - 10} width={48} height={14} rx={3} fill="rgba(17,24,39,0.85)" stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
              <circle cx={tx - 16} cy={ty - 3} r={3} fill={cfg.dot} />
              <text x={tx + 3} y={ty} fill="#ffffff" fontSize={8} fontWeight={600} fontFamily="monospace" textAnchor="middle">
                {agent.name}
              </text>
            </g>
          </g>
        );
      }
    });
  });

  // Sort queue by depth value
  const sortedItems = sceneItems.sort((a, b) => a.sortKey - b.sortKey);

  return (
    <>
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes pipelineFlow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -56; }
        }
        @keyframes voxel-bounce {
          0% { transform: translateY(0); }
          100% { transform: translateY(-5px); }
        }
        @keyframes voxel-shiver {
          0% { transform: translateX(-1px); }
          100% { transform: translateX(1px); }
        }
        .pulse-dot {
          animation: pulseDot 1.4s ease-in-out infinite;
        }
        .pipeline-flow {
          animation: pipelineFlow 1.6s linear infinite;
        }
        .voxel-bounce-anim {
          animation: voxel-bounce 0.6s infinite alternate ease-in-out;
        }
        .voxel-shiver-anim {
          animation: voxel-shiver 0.15s infinite alternate ease-in-out;
        }
        .desk-interactive:hover .desk-wood path {
          fill: #ea580c !important;
        }
      `}</style>

      <div
        style={{
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          background: 'var(--bg)',
          fontFamily: 'var(--font-sans)',
        }}
      >
        {/* ── Left: Floor Plan Canvas ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header bar */}
          <div
            style={{
              padding: '14px 20px 10px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                🏢 Agent Office
              </h2>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '2px 0 0', letterSpacing: '0.01em' }}>
                Live command floor — {runCount} running{errorCount > 0 ? `, ${errorCount} error` : ''}
              </p>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              {[
                { label: '−', action: handleZoomOut },
                { label: '⊙', action: handleReset  },
                { label: '+', action: handleZoomIn  },
              ].map(btn => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  style={{
                    width: 28, height: 28,
                    borderRadius: 7,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-muted)',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'color 0.15s, border-color 0.15s',
                    fontWeight: 600,
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                  }}
                >
                  {btn.label}
                </button>
              ))}
              <span style={{ fontSize: 10, color: 'var(--text-muted)', minWidth: 36, textAlign: 'right' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>

          {/* Scrollable floor plan */}
          <div
            style={{
              flex: 1,
              overflow: 'auto',
              padding: 24,
              background:
                'radial-gradient(ellipse at 30% 20%, rgba(129,140,248,0.05) 0%, transparent 55%),' +
                'radial-gradient(ellipse at 70% 80%, rgba(34,211,238,0.04) 0%, transparent 55%),' +
                'var(--bg)',
              backgroundImage:
                'radial-gradient(ellipse at 30% 20%, rgba(129,140,248,0.05) 0%, transparent 55%),' +
                'radial-gradient(ellipse at 70% 80%, rgba(34,211,238,0.04) 0%, transparent 55%),' +
                'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
              backgroundSize: 'auto, auto, 28px 28px',
              backgroundPosition: 'center, center, 0 0',
            }}
          >
            {/* Zoom wrapper */}
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'transform 0.2s ease',
                width: CANVAS_W,
                height: CANVAS_H,
                position: 'relative',
              }}
              ref={canvasRef}
            >
              <svg width={CANVAS_W} height={CANVAS_H} style={{ overflow: 'visible' }}>
                {/* Base Dark Concrete Corridor Floor */}
                <polygon points={`${isoX(0, 0)},${isoY(0, 0, 0)} ${isoX(138, 0)},${isoY(138, 0, 0)} ${isoX(138, 58)},${isoY(138, 58, 0)} ${isoX(0, 58)},${isoY(0, 58, 0)}`} fill="#0f172a" opacity="0.9" />

                {/* 1. Shaded Floor Polygons per Spaced-Out Room */}
                {/* Planning Room (0..30, 0..26) */}
                <polygon points={`${isoX(0, 0)},${isoY(0, 0, 0)} ${isoX(30, 0)},${isoY(30, 0, 0)} ${isoX(30, 26)},${isoY(30, 26, 0)} ${isoX(0, 26)},${isoY(0, 26, 0)}`} fill="#1e1b4b" opacity="0.6" />
                {/* Build Zone (36..66, 0..26) */}
                <polygon points={`${isoX(36, 0)},${isoY(36, 0, 0)} ${isoX(66, 0)},${isoY(66, 0, 0)} ${isoX(66, 26)},${isoY(66, 26, 0)} ${isoX(36, 26)},${isoY(36, 26, 0)}`} fill="#064e3b" opacity="0.6" />
                {/* Review Bay (72..102, 0..26) */}
                <polygon points={`${isoX(72, 0)},${isoY(72, 0, 0)} ${isoX(102, 0)},${isoY(102, 0, 0)} ${isoX(102, 26)},${isoY(102, 26, 0)} ${isoX(72, 26)},${isoY(72, 26, 0)}`} fill="#831843" opacity="0.5" />
                {/* Research Wing (0..44, 32..58) */}
                <polygon points={`${isoX(0, 32)},${isoY(0, 32, 0)} ${isoX(44, 32)},${isoY(44, 32, 0)} ${isoX(44, 58)},${isoY(44, 58, 0)} ${isoX(0, 58)},${isoY(0, 58, 0)}`} fill="#1e3a8a" opacity="0.6" />
                {/* QA Lab (50..72, 32..58) */}
                <polygon points={`${isoX(50, 32)},${isoY(50, 32, 0)} ${isoX(72, 32)},${isoY(72, 32, 0)} ${isoX(72, 58)},${isoY(72, 58, 0)} ${isoX(50, 58)},${isoY(50, 58, 0)}`} fill="#581c87" opacity="0.6" />
                {/* Voice Hub (78..102, 32..58) */}
                <polygon points={`${isoX(78, 32)},${isoY(78, 32, 0)} ${isoX(102, 32)},${isoY(102, 32, 0)} ${isoX(102, 58)},${isoY(102, 58, 0)} ${isoX(78, 58)},${isoY(78, 58, 0)}`} fill="#7c2d12" opacity="0.5" />
                {/* Break Room (108..138, 0..58) */}
                <polygon points={`${isoX(108, 0)},${isoY(108, 0, 0)} ${isoX(138, 0)},${isoY(138, 0, 0)} ${isoX(138, 58)},${isoY(138, 58, 0)} ${isoX(108, 58)},${isoY(108, 58, 0)}`} fill="#7c2d12" opacity="0.45" />

                {/* Corridor Divider Lines */}
                <path
                  d={`
                    M ${isoX(0, 26)} ${isoY(0, 26, 0)} L ${isoX(102, 26)} ${isoY(102, 26, 0)}
                    M ${isoX(0, 32)} ${isoY(0, 32, 0)} L ${isoX(102, 32)} ${isoY(102, 32, 0)}
                    M ${isoX(30, 0)} ${isoY(30, 0, 0)} L ${isoX(30, 26)} ${isoY(30, 26, 0)}
                    M ${isoX(36, 0)} ${isoY(36, 0, 0)} L ${isoX(36, 26)} ${isoY(36, 26, 0)}
                    M ${isoX(66, 0)} ${isoY(66, 0, 0)} L ${isoX(66, 26)} ${isoY(66, 26, 0)}
                    M ${isoX(72, 0)} ${isoY(72, 0, 0)} L ${isoX(72, 26)} ${isoY(72, 26, 0)}
                    M ${isoX(102, 0)} ${isoY(102, 0, 0)} L ${isoX(102, 58)} ${isoY(102, 58, 0)}
                    M ${isoX(108, 0)} ${isoY(108, 0, 0)} L ${isoX(108, 58)} ${isoY(108, 58, 0)}
                  `}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="1"
                  fill="none"
                />

                {/* 2. Render Depth-Sorted 3D Office Blocks */}
                {sortedItems.map(item => item.render())}

                {/* 3. Floating Room Label HUD Cards */}
                {zones.map(zone => {
                  const center = ROOM_CENTERS[zone.id];
                  if (!center) return null;
                  const tx = isoX(center.x, center.y);
                  const ty = isoY(center.x, center.y, 13);
                  return (
                    <g key={`label-${zone.id}`} style={{ pointerEvents: 'none' }}>
                      <rect x={tx - 52} y={ty - 8} width={104} height={16} rx={4} fill="rgba(15,23,42,0.72)" stroke={`${zone.accent}33`} strokeWidth={1} />
                      <text x={tx} y={ty + 3} fill={zone.accent} fontSize={8} fontWeight={700} fontFamily="sans-serif" letterSpacing="0.05em" textAnchor="middle">
                        {zone.label}
                      </text>
                    </g>
                  );
                })}

                {/* 4. Floating Pipeline Curves (Z=11 units) */}
                <defs>
                  <filter id="pipeline-glow">
                    <feGaussianBlur stdDeviation="1.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {PIPELINES.map(pipeline => {
                  const a = ROOM_CENTERS[pipeline.from];
                  const b = ROOM_CENTERS[pipeline.to];
                  if (!a || !b) return null;

                  const zoneFrom = zones.find(z => z.id === pipeline.from);
                  const zoneTo   = zones.find(z => z.id === pipeline.to);
                  const fromActive = zoneFrom?.agentIds.some(id => agentMap.get(id)?.status === 'running');
                  const toActive   = zoneTo?.agentIds.some(id => agentMap.get(id)?.status === 'running');
                  const isLive = fromActive || toActive;

                  const startX = isoX(a.x, a.y);
                  const startY = isoY(a.x, a.y, 11);
                  const endX = isoX(b.x, b.y);
                  const endY = isoY(b.x, b.y, 11);

                  const mx = (startX + endX) / 2;
                  const my = (startY + endY) / 2 - 24; // upward hump

                  const strokeColor = isLive ? '#22d3ee' : 'rgba(100,116,139,0.3)';

                  return (
                    <g key={`pipe-${pipeline.from}-${pipeline.to}`}>
                      <path
                        d={`M ${startX} ${startY} Q ${mx} ${my} ${endX} ${endY}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isLive ? 2.5 : 1.5}
                        strokeDasharray={isLive ? '6 4' : '4 5'}
                        filter={isLive ? 'url(#pipeline-glow)' : undefined}
                        className={isLive ? 'pipeline-flow' : ''}
                      />
                      {pipeline.label && (
                        <text
                          x={mx}
                          y={my - 6}
                          textAnchor="middle"
                          fontSize={8}
                          fill={isLive ? '#22d3ee' : 'rgba(148,163,184,0.4)'}
                          fontFamily="monospace"
                          fontWeight={600}
                          letterSpacing="0.04em"
                        >
                          {pipeline.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Footer legend */}
          <div
            style={{
              padding: '8px 20px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              flexShrink: 0,
            }}
          >
            <StatusLegend />
            <span
              style={{
                marginLeft: 'auto',
                fontSize: 10,
                color: 'var(--text-muted)',
                fontFamily: 'monospace',
              }}
            >
              {PIPELINES.length} pipelines · {zones.length} zones · {agents.length} agents
            </span>
          </div>
        </div>

        {/* ── Right: Detail drawer ── */}
        {selectedAgent && (() => {
          const cfg = STATUS_CONFIG[selectedAgent.status];
          const zone = zones.find(z => z.agentIds.includes(selectedAgent.id));
          return (
            <div
              style={{
                width: 272,
                borderLeft: '1px solid var(--border)',
                background: 'var(--bg-secondary)',
                display: 'flex',
                flexDirection: 'column',
                padding: '20px 18px',
                gap: 16,
                flexShrink: 0,
                overflowY: 'auto',
              }}
            >
              {/* Voxel Avatar in Drawer */}
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 16,
                  background: 'var(--bg)',
                  border: `2px solid ${cfg.ring}`,
                  boxShadow: `0 0 20px ${cfg.glow}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <VoxelCharacter role={selectedAgent.role} status={selectedAgent.status} scale={2.8} />
              </div>

              {/* Name + role */}
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                  {selectedAgent.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedAgent.role}
                </div>
                {zone && (
                  <div
                    style={{
                      marginTop: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '2px 8px',
                      borderRadius: 20,
                      background: `${zone.accent}18`,
                      border: `1px solid ${zone.accent}40`,
                      fontSize: 10,
                      color: zone.accent,
                      fontWeight: 600,
                    }}
                  >
                    {zone.label}
                  </div>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {selectedAgent.description}
              </p>

              {/* Status */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: `${cfg.ring}12`,
                  border: `1px solid ${cfg.ring}30`,
                }}
              >
                <span
                  style={{
                    width: 9, height: 9, borderRadius: '50%',
                    background: cfg.dot,
                    boxShadow: `0 0 8px ${cfg.glow}`,
                    flexShrink: 0,
                  }}
                  className={selectedAgent.status === 'running' ? 'pulse-dot' : ''}
                />
                <span style={{ fontSize: 12, color: cfg.ring, fontWeight: 600 }}>
                  {cfg.label}
                </span>
              </div>

              {/* ID */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>ID: </span>
                <code
                  style={{
                    fontSize: 10,
                    background: 'var(--code-bg)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    color: 'var(--accent)',
                  }}
                >
                  {selectedAgent.id}
                </code>
              </div>

              {/* Divider */}
              <div style={{ borderTop: '1px solid var(--border)' }} />

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => cycleStatus(selectedAgent.id)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'var(--accent)',
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  ↻ Toggle Status (Store)
                </button>
                <button
                  onClick={() => setSelected(null)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'transparent',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--border)',
                    fontSize: 12,
                    cursor: 'pointer',
                    transition: 'color 0.15s, border-color 0.15s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.color = 'var(--text)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                  }}
                >
                  ✕ Dismiss
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </>
  );
}
