import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────

export interface ContentMetric {
  id: string;
  post_id: string;
  platform: string;
  vertical_id: string | null;
  content_type: 'blog' | 'social' | 'email' | 'deck' | 'newsletter';
  title: string | null;
  url: string | null;
  impressions: number;
  engagements: number;
  likes: number;
  shares: number;
  comments: number;
  clicks: number;
  conversions: number;
  recorded_at: number;
  published_at: number | null;
  source_pipeline_id: string | null;
}

export interface RecyclingSuggestion {
  id: string;
  originalPostId: string;
  title: string;
  platform: string;
  reason: string;
  suggestedFormat: string;
  suggestedPlatform: string;
  score: number;
}

interface ContentRadarState {
  metrics: ContentMetric[];
  loading: boolean;

  // Actions
  refreshRadarData: () => Promise<void>;
  recordMetric: (metric: Omit<ContentMetric, 'id' | 'recorded_at'>) => void;
  updateMetrics: (id: string, updates: Partial<ContentMetric>) => void;

  // Selectors
  getTopPerforming: (contentType?: string, limit?: number) => ContentMetric[];
  getEvergreenPosts: () => ContentMetric[];
  getRecyclingSuggestions: () => RecyclingSuggestion[];
  getEngagementRate: (postId: string) => number;
  getPlatformBreakdown: () => Record<string, { posts: number; engagements: number; avgRate: number }>;
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export const useContentRadarStore = create<ContentRadarState>()(
  persist(
    (set, get) => ({
      metrics: [],
      loading: false,

      refreshRadarData: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/social/radar');
          if (res.ok) {
            const data = await res.json();
            set({ metrics: data.metrics || [] });
          }
        } catch {
          // silent fail
        } finally {
          set({ loading: false });
        }
      },

      recordMetric: (metric) => {
        const newMetric: ContentMetric = {
          ...metric,
          id: generateId(),
          recorded_at: Date.now(),
        };
        set((s) => ({ metrics: [...s.metrics, newMetric] }));
      },

      updateMetrics: (id, updates) => {
        set((s) => ({
          metrics: s.metrics.map((m) => (m.id === id ? { ...m, ...updates } : m)),
        }));
      },

      // ── Selectors ──

      getTopPerforming: (contentType, limit = 5) => {
        return get()
          .metrics
          .filter((m) => !contentType || m.content_type === contentType)
          .sort((a, b) => {
            const rateA = a.impressions > 0 ? a.engagements / a.impressions : 0;
            const rateB = b.impressions > 0 ? b.engagements / b.impressions : 0;
            return rateB - rateA;
          })
          .slice(0, limit);
      },

      getEvergreenPosts: () => {
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        return get()
          .metrics
          .filter((m) => {
            const isOld = m.published_at && m.published_at < threeMonthsAgo;
            const highEngagement = m.impressions > 0 && (m.engagements / m.impressions) > 0.05;
            return isOld && highEngagement;
          })
          .sort((a, b) => b.engagements - a.engagements);
      },

      getRecyclingSuggestions: () => {
        const evergreen = get().getEvergreenPosts();
        const DAY_MS = 24 * 60 * 60 * 1000;
        const suggestions: RecyclingSuggestion[] = evergreen.slice(0, 5).map((post) => {
          const platformAlternatives: Record<string, string> = {
            blog: 'social thread',
            social: 'blog post',
            email: 'newsletter feature',
            deck: 'social carousel',
            newsletter: 'blog deep-dive',
          };
          const crossPlatform: Record<string, string> = {
            x: 'LinkedIn article',
            linkedin: 'X thread',
            instagram: 'carousel post',
            facebook: 'community post',
          };
          const engagementRate = (post.engagements / Math.max(post.impressions, 1) * 100).toFixed(1);
          const daysAgo = post.published_at !== null
            ? Math.floor((Date.now() - post.published_at) / DAY_MS) + ' days ago'
            : '';
          const reason = `Performed ${engagementRate}% engagement ${daysAgo}`.trim();

          return {
            id: generateId(),
            originalPostId: post.post_id,
            title: post.title || 'Untitled',
            platform: post.platform,
            reason,
            suggestedFormat: platformAlternatives[post.content_type] || 'repurpose',
            suggestedPlatform: crossPlatform[post.platform] || 'cross-post',
            score: post.engagements / Math.max(post.impressions, 1),
          };
        });

        return suggestions.sort((a, b) => b.score - a.score);
      },

      getEngagementRate: (postId) => {
        const metric = get().metrics.find((m) => m.post_id === postId);
        if (!metric || metric.impressions === 0) return 0;
        return metric.engagements / metric.impressions;
      },

      getPlatformBreakdown: () => {
        const breakdown: Record<string, { posts: number; engagements: number; impressions: number }> = {};
        for (const m of get().metrics) {
          const entry = breakdown[m.platform] || { posts: 0, engagements: 0, impressions: 0 };
          entry.posts += 1;
          entry.engagements += m.engagements;
          entry.impressions += m.impressions;
          breakdown[m.platform] = entry;
        }

        const result: Record<string, { posts: number; engagements: number; avgRate: number }> = {};
        const platforms = Object.keys(breakdown);
        for (let i = 0; i < platforms.length; i++) {
          const platform = platforms[i];
          const data = breakdown[platform];
          result[platform] = {
            posts: data.posts,
            engagements: data.engagements,
            avgRate: data.impressions > 0 ? data.engagements / data.impressions : 0,
          };
        }
        return result;
      },
    }),
    {
      name: 'agent-os-content-radar',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        metrics: state.metrics,
      }),
    }
  )
);
