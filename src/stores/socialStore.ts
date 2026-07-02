import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ─── Types ───────────────────────────────────────────────────────────

export interface SocialVertical {
  id: string;
  name: string;
  description: string;
  created_at: number;
}

export interface SocialWatchTerm {
  id: string;
  vertical_id: string;
  term: string;
  term_type: 'keyword' | 'hashtag' | 'phrase';
  weight: number;
  platform: string;
  alert_on_spike: boolean;
  created_at: number;
}

export interface SocialCompetitor {
  id: string;
  vertical_id: string;
  platform: string;
  handle: string;
  url: string | null;
  created_at: number;
}

export interface SocialAccount {
  id: string;
  platform: string;
  platform_user_id: string | null;
  account_name: string | null;
  status: 'connected' | 'disconnected' | 'expired' | 'error';
  last_sync: number | null;
  created_at: number;
}

export interface SocialMention {
  id: string;
  vertical_id: string;
  platform: string;
  content: string;
  author_handle: string;
  author_name: string | null;
  url: string | null;
  mention_type: 'brand' | 'competitor' | 'keyword';
  classification: 'lead' | 'complaint' | 'praise' | 'irrelevant' | null;
  sentiment_score: number | null;
  engagement_count: number;
  tracked_term: string | null;
  posted_at: number;
  fetched_at: number;
}

export interface SocialTrend {
  id: string;
  vertical_id: string;
  platform: string;
  topic: string;
  volume: number | null;
  velocity: 'rising' | 'steady' | 'cooling';
  velocity_score: number;
  snippet: string | null;
  url: string | null;
  sentiment_score: number | null;
  trending_at: number;
  fetched_at: number;
}

// ─── Store ───────────────────────────────────────────────────────────

interface SocialState {
  verticals: SocialVertical[];
  watchTerms: SocialWatchTerm[];
  competitors: SocialCompetitor[];
  accounts: SocialAccount[];
  mentions: SocialMention[];
  trends: SocialTrend[];
  activeVerticalId: string | null;
  loading: boolean;

  // Vertical CRUD
  addVertical: (name: string, description?: string) => void;
  updateVertical: (id: string, updates: Partial<SocialVertical>) => void;
  deleteVertical: (id: string) => void;
  setActiveVertical: (id: string | null) => void;

  // Watch Terms
  addWatchTerm: (verticalId: string, term: string, type: 'keyword' | 'hashtag' | 'phrase', weight?: number, platform?: string) => void;
  removeWatchTerm: (id: string) => void;

  // Competitors
  addCompetitor: (verticalId: string, platform: string, handle: string, url?: string) => void;
  removeCompetitor: (id: string) => void;

  // Accounts
  connectAccount: (platform: string, accountName?: string) => void;
  disconnectAccount: (id: string) => void;
  setAccountStatus: (id: string, status: SocialAccount['status']) => void;

  // Data fetching
  refreshTrends: () => Promise<void>;
  refreshMentions: () => Promise<void>;
  syncAccounts: () => Promise<void>;

  // Selectors
  getTrendsByVertical: (verticalId: string) => SocialTrend[];
  getMentionsByType: (type: 'brand' | 'competitor' | 'keyword') => SocialMention[];
  getTopTrends: (limit?: number) => SocialTrend[];
  getUnclassifiedMentions: () => SocialMention[];
}

function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set, get) => ({
      verticals: [],
      watchTerms: [],
      competitors: [],
      accounts: [],
      mentions: [],
      trends: [],
      activeVerticalId: null,
      loading: false,

      // ── Verticals ──
      addVertical: (name, description = '') => {
        const vertical: SocialVertical = {
          id: generateId(),
          name,
          description,
          created_at: Date.now(),
        };
        set((s) => ({
          verticals: [...s.verticals, vertical],
          activeVerticalId: s.activeVerticalId ?? vertical.id,
        }));
      },

      updateVertical: (id, updates) => {
        set((s) => ({
          verticals: s.verticals.map((v) => (v.id === id ? { ...v, ...updates } : v)),
        }));
      },

      deleteVertical: (id) => {
        set((s) => ({
          verticals: s.verticals.filter((v) => v.id !== id),
          watchTerms: s.watchTerms.filter((w) => w.vertical_id !== id),
          competitors: s.competitors.filter((c) => c.vertical_id !== id),
          activeVerticalId: s.activeVerticalId === id ? null : s.activeVerticalId,
        }));
      },

      setActiveVertical: (id) => set({ activeVerticalId: id }),

      // ── Watch Terms ──
      addWatchTerm: (verticalId, term, type = 'keyword', weight = 1, platform = 'all') => {
        const watchTerm: SocialWatchTerm = {
          id: generateId(),
          vertical_id: verticalId,
          term,
          term_type: type,
          weight,
          platform,
          alert_on_spike: false,
          created_at: Date.now(),
        };
        set((s) => ({ watchTerms: [...s.watchTerms, watchTerm] }));
      },

      removeWatchTerm: (id) => {
        set((s) => ({ watchTerms: s.watchTerms.filter((w) => w.id !== id) }));
      },

      // ── Competitors ──
      addCompetitor: (verticalId, platform, handle, url) => {
        const competitor: SocialCompetitor = {
          id: generateId(),
          vertical_id: verticalId,
          platform,
          handle,
          url: url || null,
          created_at: Date.now(),
        };
        set((s) => ({ competitors: [...s.competitors, competitor] }));
      },

      removeCompetitor: (id) => {
        set((s) => ({ competitors: s.competitors.filter((c) => c.id !== id) }));
      },

      // ── Accounts ──
      connectAccount: (platform, accountName) => {
        const account: SocialAccount = {
          id: generateId(),
          platform,
          platform_user_id: null,
          account_name: accountName || null,
          status: 'connected',
          last_sync: null,
          created_at: Date.now(),
        };
        set((s) => ({ accounts: [...s.accounts, account] }));
      },

      disconnectAccount: async (id) => {
        try {
          const res = await fetch(`/api/social/accounts/${id}`, { method: 'DELETE' });
          if (res.ok) {
            set((s) => ({
              accounts: s.accounts.filter((a) => a.id !== id),
            }));
          }
        } catch {
          // silent
        }
      },

      setAccountStatus: (id, status) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === id ? { ...a, status } : a)),
        }));
      },

      // ── Data Fetching ──
      refreshTrends: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/social/trends/refresh', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            set({ trends: data.trends || [] });
          }
        } catch {
          // silent fail
        } finally {
          set({ loading: false });
        }
      },

      refreshMentions: async () => {
        set({ loading: true });
        try {
          const res = await fetch('/api/social/mentions/refresh', { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            set({ mentions: data.mentions || [] });
          }
        } catch {
          // silent fail
        } finally {
          set({ loading: false });
        }
      },

      syncAccounts: async () => {
        try {
          const res = await fetch('/api/social/accounts');
          if (res.ok) {
            const data = await res.json();
            set({ accounts: data.accounts || [] });
          }
        } catch {
          // silent fail
        }
      },

      // ── Selectors ──
      getTrendsByVertical: (verticalId) => {
        return get().trends
          .filter((t) => t.vertical_id === verticalId)
          .sort((a, b) => b.velocity_score - a.velocity_score);
      },

      getMentionsByType: (type) => {
        return get()
          .mentions.filter((m) => m.mention_type === type)
          .sort((a, b) => b.posted_at - a.posted_at);
      },

      getTopTrends: (limit = 5) => {
        return get()
          .trends.sort((a, b) => b.velocity_score - a.velocity_score)
          .slice(0, limit);
      },

      getUnclassifiedMentions: () => {
        return get().mentions.filter((m) => !m.classification);
      },
    }),
    {
      name: 'agent-os-social',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        verticals: state.verticals,
        watchTerms: state.watchTerms,
        competitors: state.competitors,
        activeVerticalId: state.activeVerticalId,
        // Don't persist transient data — refetch on load
        accounts: [],
        mentions: [],
        trends: [],
      }),
    }
  )
);
