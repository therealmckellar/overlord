'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Star, Trophy, Zap, Flame, Shield, Code, Terminal, Rocket, RefreshCw } from 'lucide-react';

interface AchievementTier {
  name: string;
  threshold: number;
}

interface AchievementDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  tiers: AchievementTier[];
}

interface AchievementProgress {
  achievementId: string;
  current: number;
  unlockedTier: number; // -1 = none
  unlockedAt: string | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  coding: <Code className="w-4 h-4" />,
  terminal: <Terminal className="w-4 h-4" />,
  agent: <Zap className="w-4 h-4" />,
  deployment: <Rocket className="w-4 h-4" />,
  security: <Shield className="w-4 h-4" />,
  streak: <Flame className="w-4 h-4" />,
};

const TIER_COLORS: Record<string, string> = {
  Copper: '#cd7f32',
  Silver: '#c0c0c0',
  Gold: '#ffd700',
  Diamond: '#b9f2ff',
  Olympian: '#ff6b6b',
};

const DEFAULT_ACHIEVEMENTS: AchievementDef[] = [
  { id: 'tool_calls', name: 'Tool Slayer', description: 'Total tool calls made', icon: '🔧', category: 'coding', tiers: [{ name: 'Copper', threshold: 10 }, { name: 'Silver', threshold: 100 }, { name: 'Gold', threshold: 500 }, { name: 'Diamond', threshold: 2000 }, { name: 'Olympian', threshold: 10000 }] },
  { id: 'sessions', name: 'Session Veteran', description: 'Chat sessions started', icon: '💬', category: 'agent', tiers: [{ name: 'Copper', threshold: 5 }, { name: 'Silver', threshold: 25 }, { name: 'Gold', threshold: 100 }, { name: 'Diamond', threshold: 500 }, { name: 'Olympian', threshold: 2000 }] },
  { id: 'errors_fixed', name: 'Bug Whisperer', description: 'Errors resolved in sessions', icon: '🐛', category: 'coding', tiers: [{ name: 'Copper', threshold: 5 }, { name: 'Silver', threshold: 25 }, { name: 'Gold', threshold: 100 }, { name: 'Diamond', threshold: 500 }, { name: 'Olympian', threshold: 2000 }] },
  { id: 'files_written', name: 'Code Sculptor', description: 'Files written/patched', icon: '✍️', category: 'coding', tiers: [{ name: 'Copper', threshold: 10 }, { name: 'Silver', threshold: 50 }, { name: 'Gold', threshold: 200 }, { name: 'Diamond', threshold: 1000 }, { name: 'Olympian', threshold: 5000 }] },
  { id: 'deploys', name: 'Ship Captain', description: 'Successful deployments', icon: '🚀', category: 'deployment', tiers: [{ name: 'Copper', threshold: 1 }, { name: 'Silver', threshold: 5 }, { name: 'Gold', threshold: 25 }, { name: 'Diamond', threshold: 100 }, { name: 'Olympian', threshold: 500 }] },
  { id: 'streak', name: 'Streak Master', description: 'Consecutive days active', icon: '🔥', category: 'streak', tiers: [{ name: 'Copper', threshold: 3 }, { name: 'Silver', threshold: 7 }, { name: 'Gold', threshold: 30 }, { name: 'Diamond', threshold: 90 }, { name: 'Olympian', threshold: 365 }] },
  { id: 'skills_used', name: 'Skill Ninja', description: 'Skills loaded and executed', icon: '⚡', category: 'agent', tiers: [{ name: 'Copper', threshold: 10 }, { name: 'Silver', threshold: 50 }, { name: 'Gold', threshold: 200 }, { name: 'Diamond', threshold: 1000 }, { name: 'Olympian', threshold: 5000 }] },
  { id: 'security_audits', name: 'Guardian', description: 'Security reviews completed', icon: '🛡️', category: 'security', tiers: [{ name: 'Copper', threshold: 1 }, { name: 'Silver', threshold: 5 }, { name: 'Gold', threshold: 20 }, { name: 'Diamond', threshold: 50 }, { name: 'Olympian', threshold: 200 }] },
];

export function AchievementsPanel() {
  const [progress, setProgress] = useState<Record<string, AchievementProgress>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'recent'>('recent');

  const fetchProgress = useCallback(async () => {
    try {
      const res = await fetch('/api/achievements');
      if (res.ok) {
        const data = await res.json();
        const map: Record<string, AchievementProgress> = {};
        for (const p of data.progress || []) {
          map[p.achievementId] = p;
        }
        setProgress(map);
      }
    } catch {
      // Use empty defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProgress(); }, [fetchProgress]);

  const categories = ['all', ...new Set(DEFAULT_ACHIEVEMENTS.map(a => a.category))];
  const filtered = DEFAULT_ACHIEVEMENTS.filter(a => filter === 'all' || a.category === filter);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'progress') {
      const pa = progress[a.id]?.current || 0;
      const pb = progress[b.id]?.current || 0;
      return pb - pa;
    }
    // recent: unlocked first
    const ua = progress[a.id]?.unlockedAt;
    const ub = progress[b.id]?.unlockedAt;
    if (ua && !ub) return -1;
    if (!ua && ub) return 1;
    if (ua && ub) return new Date(ub).getTime() - new Date(ua).getTime();
    return 0;
  });

  const totalUnlocked = DEFAULT_ACHIEVEMENTS.reduce((sum, a) => {
    const p = progress[a.id];
    return sum + (p && p.unlockedTier >= 0 ? 1 : 0);
  }, 0);

  const totalPossible = DEFAULT_ACHIEVEMENTS.length * 5; // 5 tiers each

  return (
    <div className="h-full overflow-y-auto p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Achievements</h2>
          <span className="text-sm px-2 py-0.5 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
            {totalUnlocked}/{totalPossible} unlocked
          </span>
        </div>
        <button
          onClick={() => { setLoading(true); fetchProgress(); }}
          className="p-2 rounded-lg hover:opacity-80 transition-opacity"
          style={{ background: 'var(--bg-tertiary)' }}
          aria-label="Refresh achievements"
        >
          <RefreshCw className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Overall progress bar */}
      <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div className="flex justify-between mb-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>Overall Progress</span>
          <span>{Math.round((totalUnlocked / totalPossible) * 100)}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(totalUnlocked / totalPossible) * 100}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          {categories.map(c => (
            <option key={c} value={c}>{c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'progress' | 'recent')}
          className="px-3 py-1.5 rounded-lg text-sm border"
          style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border)' }}
        >
          <option value="recent">Recently Unlocked</option>
          <option value="progress">By Progress</option>
          <option value="name">By Name</option>
        </select>
      </div>

      {/* Achievement Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map(achievement => {
            const p = progress[achievement.id] || { achievementId: achievement.id, current: 0, unlockedTier: -1, unlockedAt: null };
            const nextTierIdx = p.unlockedTier + 1;
            const nextTier = nextTierIdx < achievement.tiers.length ? achievement.tiers[nextTierIdx] : null;
            const currentThreshold = nextTier ? nextTier.threshold : (achievement.tiers[achievement.tiers.length - 1]?.threshold || 1);
            const progressPct = nextTier ? Math.min((p.current / currentThreshold) * 100, 100) : 100;
            const isMaxed = p.unlockedTier >= achievement.tiers.length - 1;

            return (
              <div
                key={achievement.id}
                className="p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: 'var(--bg-secondary)',
                  border: `1px solid ${p.unlockedTier >= 0 ? 'var(--accent)' : 'var(--border)'}`,
                  opacity: p.unlockedTier >= 0 ? 1 : 0.6,
                }}
              >
                {/* Achievement header */}
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{achievement.name}</h3>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{achievement.description}</p>
                  </div>
                  {CATEGORY_ICONS[achievement.category]}
                </div>

                {/* Tier badges */}
                <div className="flex gap-1.5 mb-3">
                  {achievement.tiers.map((tier, idx) => (
                    <span
                      key={tier.name}
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: idx <= p.unlockedTier ? `${TIER_COLORS[tier.name]}22` : 'var(--bg-tertiary)',
                        color: idx <= p.unlockedTier ? TIER_COLORS[tier.name] : 'var(--text-muted)',
                        border: `1px solid ${idx <= p.unlockedTier ? TIER_COLORS[tier.name] : 'transparent'}`,
                      }}
                    >
                      {tier.name}
                    </span>
                  ))}
                </div>

                {/* Progress bar */}
                {!isMaxed && nextTier && (
                  <div>
                    <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
                      <span>{p.current} / {nextTier.threshold}</span>
                      <span>{nextTier.name}</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%`, background: TIER_COLORS[nextTier.name] }}
                      />
                    </div>
                  </div>
                )}
                {isMaxed && (
                  <div className="text-xs text-center font-medium" style={{ color: TIER_COLORS.Olympian }}>
                    ★ MAX TIER REACHED ★
                  </div>
                )}

                {/* Unlocked timestamp */}
                {p.unlockedAt && (
                  <div className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                    Last unlock: {new Date(p.unlockedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default AchievementsPanel;
