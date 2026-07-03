'use client';

import { useState, useRef, useCallback } from 'react';

// ─── Types ─────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'running' | 'error' | 'paused';

interface Agent {
  id: string;
  name: string;
  role: string;
  path: string;
  status: AgentStatus;
  emoji: string;
  description: string;
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

const AGENTS: Agent[] = [
  { id: 'planner',    name: 'Planner',      role: 'Path 1',  path: 'plan',     status: 'idle',    emoji: '🗺️',  description: 'Decomposes goals into subtasks' },
  { id: 'architect',  name: 'Architect',    role: 'Path 1',  path: 'plan',     status: 'running', emoji: '🏛️',  description: 'Designs system structure and interfaces' },
  { id: 'builder',    name: 'Builder',      role: 'Path 2',  path: 'build',    status: 'running', emoji: '🔨',  description: 'Heavy fix / fast build' },
  { id: 'refactor',   name: 'Refactor',     role: 'Path 7',  path: 'refactor', status: 'idle',    emoji: '♻️',  description: 'Code refactoring and cleanup' },
  { id: 'reviewer',   name: 'Reviewer',     role: 'Path 1',  path: 'review',   status: 'idle',    emoji: '👁️',  description: 'Reviews code for correctness and style' },
  { id: 'security',   name: 'Security',     role: 'Path 8',  path: 'security', status: 'paused',  emoji: '🔒',  description: 'Hunts silent failures and security gaps' },
  { id: 'researcher', name: 'Researcher',   role: 'Path 6',  path: 'research', status: 'running', emoji: '🔬',  description: 'Research, decks, landing pages' },
  { id: 'docs',       name: 'Docs',         role: 'Path 3',  path: 'docs',     status: 'idle',    emoji: '📚',  description: 'Specs, documentation, copy' },
  { id: 'sdr',        name: 'SDR',          role: 'Path 6',  path: 'research', status: 'idle',    emoji: '📞',  description: 'Outbound research and outreach' },
  { id: 'e2e',        name: 'E2E Tester',   role: 'Path 9',  path: 'e2e',      status: 'error',   emoji: '🧪',  description: 'End-to-end testing' },
  { id: 'explorer',   name: 'Explorer',     role: 'Path 10', path: 'explore',  status: 'idle',    emoji: '🗺️',  description: 'Read-only codebase exploration' },
  { id: 'jarvis',     name: 'Jarvis',       role: 'Voice',   path: 'voice',    status: 'running', emoji: '🎙️',  description: 'Voice interface and orchestration' },
];

// Zone layout for the floor plan (positions on a 900×620 canvas)
const ZONES: Zone[] = [
  {
    id: 'planning',
    label: '🗺️ Planning Room',
    accent: '#818cf8',
    glowColor: 'rgba(129,140,248,0.35)',
    x: 24, y: 24, w: 260, h: 200,
    agentIds: ['planner', 'architect'],
  },
  {
    id: 'build',
    label: '🔨 Build Zone',
    accent: '#22d3ee',
    glowColor: 'rgba(34,211,238,0.35)',
    x: 320, y: 24, w: 260, h: 200,
    agentIds: ['builder', 'refactor'],
  },
  {
    id: 'review',
    label: '👁️ Review Bay',
    accent: '#a78bfa',
    glowColor: 'rgba(167,139,250,0.35)',
    x: 616, y: 24, w: 260, h: 200,
    agentIds: ['reviewer', 'security'],
  },
  {
    id: 'research',
    label: '🔬 Research Wing',
    accent: '#34d399',
    glowColor: 'rgba(52,211,153,0.35)',
    x: 24, y: 268, w: 380, h: 200,
    agentIds: ['researcher', 'docs', 'sdr'],
  },
  {
    id: 'qa',
    label: '🧪 QA Lab',
    accent: '#fbbf24',
    glowColor: 'rgba(251,191,36,0.35)',
    x: 440, y: 268, w: 220, h: 200,
    agentIds: ['e2e', 'explorer'],
  },
  {
    id: 'voice',
    label: '🎙️ Voice Hub',
    accent: '#f87171',
    glowColor: 'rgba(248,113,113,0.35)',
    x: 698, y: 268, w: 178, h: 200,
    agentIds: ['jarvis'],
  },
];

// Directional pipelines between zones
const PIPELINES: PipelinePath[] = [
  { from: 'planning', to: 'build',    label: 'tasks' },
  { from: 'build',    to: 'review',   label: 'PR' },
  { from: 'research', to: 'planning', label: 'insight' },
  { from: 'review',   to: 'qa',       label: 'release' },
  { from: 'qa',       to: 'voice',    label: 'alert' },
];

// ─── Helpers ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<AgentStatus, { ring: string; glow: string; label: string; dot: string }> = {
  idle:    { ring: '#475569', glow: 'transparent',              label: 'Idle',    dot: '#475569' },
  running: { ring: '#22d3ee', glow: 'rgba(34,211,238,0.55)',   label: 'Running', dot: '#22d3ee' },
  error:   { ring: '#ef4444', glow: 'rgba(239,68,68,0.55)',    label: 'Error',   dot: '#ef4444' },
  paused:  { ring: '#f59e0b', glow: 'rgba(245,158,11,0.45)',   label: 'Paused',  dot: '#f59e0b' },
};

function getZoneCenter(zone: Zone) {
  return { x: zone.x + zone.w / 2, y: zone.y + zone.h / 2 };
}

function buildCurvePath(from: Zone, to: Zone) {
  const a = getZoneCenter(from);
  const b = getZoneCenter(to);
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2 - 40;
  return `M ${a.x} ${a.y} Q ${mx} ${my} ${b.x} ${b.y}`;
}

// ─── Sub-components ────────────────────────────────────────────────────────

function AgentDesk({
  agent,
  selected,
  onClick,
}: {
  agent: Agent;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[agent.status];
  const isAnimated = agent.status === 'running' || agent.status === 'error';

  return (
    <button
      onClick={onClick}
      title={agent.description}
      style={{
        width: 88,
        height: 104,
        background: selected
          ? 'rgba(255,255,255,0.06)'
          : 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${selected ? cfg.ring : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 10,
        boxShadow: selected ? `0 0 18px ${cfg.glow}, inset 0 0 8px ${cfg.glow}` : 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        cursor: 'pointer',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        position: 'relative',
        padding: '8px 6px',
        flexShrink: 0,
      }}
      className={`desk-btn${isAnimated ? ' desk-animated' : ''}`}
    >
      {/* Status ring */}
      <span
        style={{
          position: 'absolute',
          top: 7,
          right: 7,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: cfg.dot,
          boxShadow: `0 0 6px ${cfg.glow}`,
        }}
        className={agent.status === 'running' ? 'pulse-dot' : ''}
      />

      {/* Avatar emoji */}
      <span style={{ fontSize: 28, lineHeight: 1, userSelect: 'none' }}>
        {agent.emoji}
      </span>

      {/* Name */}
      <span
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: '#e2e8f0',
          textAlign: 'center',
          lineHeight: 1.2,
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {agent.name}
      </span>

      {/* Status label */}
      <span
        style={{
          fontSize: 9,
          color: cfg.ring,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 500,
        }}
      >
        {cfg.label}
      </span>
    </button>
  );
}

function ZoneRoom({
  zone,
  agents,
  selectedId,
  onSelect,
}: {
  zone: Zone;
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const hasActive = agents.some(a => a.status === 'running');

  return (
    <div
      style={{
        position: 'absolute',
        left: zone.x,
        top: zone.y,
        width: zone.w,
        height: zone.h,
        borderRadius: 14,
        border: `1.5px solid ${zone.accent}44`,
        background: `rgba(10,10,26,0.72)`,
        boxShadow: hasActive
          ? `0 0 28px ${zone.glowColor}, inset 0 0 16px ${zone.accent}0a`
          : `0 0 12px rgba(0,0,0,0.4)`,
        transition: 'box-shadow 0.4s ease',
        overflow: 'hidden',
        backdropFilter: 'blur(4px)',
      }}
    >
      {/* Nameplate bar */}
      <div
        style={{
          height: 32,
          background: `linear-gradient(90deg, ${zone.accent}22 0%, ${zone.accent}08 100%)`,
          borderBottom: `1px solid ${zone.accent}33`,
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          paddingRight: 8,
          gap: 6,
        }}
      >
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: zone.accent,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {zone.label}
        </span>
        {hasActive && (
          <span
            style={{
              marginLeft: 'auto',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#22d3ee',
              boxShadow: '0 0 8px rgba(34,211,238,0.8)',
            }}
            className="pulse-dot"
          />
        )}
      </div>

      {/* Desk grid */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          padding: '10px 10px',
          alignContent: 'flex-start',
        }}
      >
        {agents.map(agent => (
          <AgentDesk
            key={agent.id}
            agent={agent}
            selected={selectedId === agent.id}
            onClick={() => onSelect(agent.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PipelineLines({
  agents,
  canvasW,
  canvasH,
}: {
  agents: Agent[];
  canvasW: number;
  canvasH: number;
}) {
  const agentMap = new Map(agents.map(a => [a.id, a]));

  return (
    <svg
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      width={canvasW}
      height={canvasH}
    >
      <defs>
        {PIPELINES.map(p => (
          <marker
            key={`arrow-${p.from}-${p.to}`}
            id={`arrow-${p.from}-${p.to}`}
            markerWidth="6"
            markerHeight="6"
            refX="3"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L0,6 L6,3 z" fill="rgba(100,116,139,0.6)" />
          </marker>
        ))}
        <filter id="pipeline-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {PIPELINES.map(pipeline => {
        const fromZone = ZONES.find(z => z.id === pipeline.from);
        const toZone   = ZONES.find(z => z.id === pipeline.to);
        if (!fromZone || !toZone) return null;

        // Check if either zone has a running agent
        const fromActive = fromZone.agentIds.some(id => agentMap.get(id)?.status === 'running');
        const toActive   = toZone.agentIds.some(id => agentMap.get(id)?.status === 'running');
        const isLive = fromActive || toActive;

        const pathD = buildCurvePath(fromZone, toZone);
        const strokeColor = isLive ? 'rgba(34,211,238,0.5)' : 'rgba(71,85,105,0.35)';

        return (
          <g key={`${pipeline.from}-${pipeline.to}`}>
            {/* Base path */}
            <path
              d={pathD}
              fill="none"
              stroke={strokeColor}
              strokeWidth={isLive ? 2 : 1.5}
              strokeDasharray={isLive ? '8 6' : '4 6'}
              markerEnd={`url(#arrow-${pipeline.from}-${pipeline.to})`}
              filter={isLive ? 'url(#pipeline-glow)' : undefined}
              className={isLive ? 'pipeline-flow' : ''}
            />
            {/* Label */}
            {pipeline.label && (() => {
              const from = getZoneCenter(fromZone);
              const to   = getZoneCenter(toZone);
              return (
                <text
                  x={(from.x + to.x) / 2}
                  y={(from.y + to.y) / 2 - 46}
                  textAnchor="middle"
                  fontSize={9}
                  fill={isLive ? 'rgba(34,211,238,0.8)' : 'rgba(100,116,139,0.6)'}
                  fontFamily="'JetBrains Mono', monospace"
                  letterSpacing="0.05em"
                >
                  {pipeline.label}
                </text>
              );
            })()}
          </g>
        );
      })}
    </svg>
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

// ─── Main Panel ────────────────────────────────────────────────────────────

const CANVAS_W = 900;
const CANVAS_H = 500;

export default function AgentOfficePanel() {
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [selected, setSelected] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  const agentMap = new Map(agents.map(a => [a.id, a]));
  const selectedAgent = selected ? agentMap.get(selected) ?? null : null;

  const cycleStatus = useCallback((id: string) => {
    const cycle: AgentStatus[] = ['idle', 'running', 'paused', 'error'];
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = cycle[(cycle.indexOf(a.status) + 1) % cycle.length];
      return { ...a, status: next };
    }));
  }, []);

  const handleZoomIn  = () => setZoom(z => Math.min(z + 0.15, 1.8));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.15, 0.5));
  const handleReset   = () => setZoom(1);

  // Running / error counts for header
  const runCount   = agents.filter(a => a.status === 'running').length;
  const errorCount = agents.filter(a => a.status === 'error').length;

  return (
    <>
      {/* Injected keyframe animations */}
      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        @keyframes pipelineFlow {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -56; }
        }
        @keyframes deskFloat {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-2px); }
        }
        .pulse-dot {
          animation: pulseDot 1.4s ease-in-out infinite;
        }
        .pipeline-flow {
          animation: pipelineFlow 1.6s linear infinite;
        }
        .desk-animated {
          animation: deskFloat 2.4s ease-in-out infinite;
        }
        .desk-btn:hover {
          transform: translateY(-4px) scale(1.04);
          box-shadow: 0 8px 24px rgba(0,0,0,0.5);
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
              {/* Zoom controls */}
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
              // subtle dot grid
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
              {/* SVG pipeline overlay */}
              <PipelineLines agents={agents} canvasW={CANVAS_W} canvasH={CANVAS_H} />

              {/* Zone rooms */}
              {ZONES.map(zone => {
                const zoneAgents = zone.agentIds
                  .map(id => agentMap.get(id))
                  .filter((a): a is Agent => !!a);
                return (
                  <ZoneRoom
                    key={zone.id}
                    zone={zone}
                    agents={zoneAgents}
                    selectedId={selected}
                    onSelect={id => setSelected(prev => prev === id ? null : id)}
                  />
                );
              })}
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
              {PIPELINES.length} pipelines · {ZONES.length} zones · {agents.length} agents
            </span>
          </div>
        </div>

        {/* ── Right: Detail drawer ── */}
        {selectedAgent && (() => {
          const cfg = STATUS_CONFIG[selectedAgent.status];
          const zone = ZONES.find(z => z.agentIds.includes(selectedAgent.id));
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
              {/* Avatar */}
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
                  fontSize: 30,
                }}
              >
                {selectedAgent.emoji}
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

              {/* Path */}
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Path: </span>
                <code
                  style={{
                    fontSize: 10,
                    background: 'var(--code-bg)',
                    padding: '1px 6px',
                    borderRadius: 4,
                    color: 'var(--accent)',
                  }}
                >
                  /{selectedAgent.path}
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
                  ↻ Cycle Status
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
                    e.currentTarget.style.borderColor = 'var(--text-muted)';
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
