'use client';

import React, { useState } from 'react';
import {
  Newspaper, Calendar, Clock, Send, Settings,
  CheckCircle2, AlertCircle, Loader2, Eye, Edit3,
  BarChart3, Users, TrendingUp
} from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

interface SubstackPost {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt: number;
  publishedAt?: number;
  views?: number;
  likes?: number;
}

interface SubstackConfig {
  enabled: boolean;
  schedule: string; // cron-like: "0 9 * * *" = daily at 9am
  persona: string;
  topics: string[];
}

const DEMO_POSTS: SubstackPost[] = [
  {
    id: 'post_1',
    title: 'The Future of B2B Promotional Products in 2026',
    content: 'The promotional products industry is undergoing a seismic shift...',
    status: 'published',
    scheduledAt: Date.now() - 86400000 * 2,
    publishedAt: Date.now() - 86400000 * 2,
    views: 342,
    likes: 28,
  },
  {
    id: 'post_2',
    title: 'How to Choose the Right Funding Partner for Your Business',
    content: 'Not all funding partners are created equal. Here\'s what to look for...',
    status: 'scheduled',
    scheduledAt: Date.now() + 86400000,
  },
  {
    id: 'post_3',
    title: '5 Market Trends Every Real Estate Investor Should Watch',
    content: 'From interest rates to inventory levels, these trends will shape 2026...',
    status: 'draft',
    scheduledAt: Date.now() + 86400000 * 3,
  },
];

interface SubstackAutomationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SubstackAutomation({ isOpen, onClose }: SubstackAutomationProps) {
  const [posts, setPosts] = useState<SubstackPost[]>(DEMO_POSTS);
  const [selectedPost, setSelectedPost] = useState<SubstackPost | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<SubstackConfig>({
    enabled: true,
    schedule: '0 9 * * *',
    persona: 'steve',
    topics: ['business growth', 'funding strategies', 'market trends', 'entrepreneurship'],
  });
  const { addToast } = useUIStore();

  if (!isOpen) return null;

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
    drafts: posts.filter((p) => p.status === 'draft').length,
    totalViews: posts.reduce((sum, p) => sum + (p.views || 0), 0),
    totalLikes: posts.reduce((sum, p) => sum + (p.likes || 0), 0),
  };

  return (
    <div className="fixed inset-0 z-50 flex bg-[var(--bg)]">
      {/* Left panel */}
      <div className="w-80 border-r border-[var(--border)] flex flex-col bg-[var(--bg-secondary)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h2 className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-[var(--accent)]" />
            Substack Automation
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <AlertCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 p-3 border-b border-[var(--border)]">
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.published}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Published</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--accent)]">{stats.scheduled}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Scheduled</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.totalViews}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Total Views</div>
          </div>
          <div className="rounded-lg bg-[var(--bg-tertiary)] p-2 text-center">
            <div className="text-lg font-bold text-[var(--text)]">{stats.totalLikes}</div>
            <div className="text-[10px] text-[var(--text-muted)]">Total Likes</div>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="p-3 border-b border-[var(--border)] space-y-3 bg-[var(--bg-tertiary)]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text)]">Auto-publish</span>
              <button
                onClick={() => setConfig((c) => ({ ...c, enabled: !c.enabled }))}
                className={`w-8 h-4 rounded-full transition-colors ${config.enabled ? 'bg-[var(--accent)]' : 'bg-[var(--bg-secondary)]'}`}
              >
                <div className={`w-3 h-3 rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Persona</label>
              <select
                value={config.persona}
                onChange={(e) => setConfig((c) => ({ ...c, persona: e.target.value }))}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              >
                <option value="steve">Steve</option>
                <option value="david">David</option>
                <option value="josh">Josh</option>
                <option value="fathom">Fathom</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] block mb-1">Topics (comma-separated)</label>
              <input
                type="text"
                value={config.topics.join(', ')}
                onChange={(e) => setConfig((c) => ({ ...c, topics: e.target.value.split(',').map((t) => t.trim()) }))}
                className="w-full px-2 py-1 text-xs rounded bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Post list */}
        <div className="flex-1 overflow-y-auto">
          {posts.map((post) => {
            const statusColors = {
              draft: 'text-[var(--text-muted)]',
              scheduled: 'text-[var(--accent)]',
              published: 'text-[var(--success)]',
              failed: 'text-[var(--error)]',
            };
            return (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`w-full text-left px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--bg-tertiary)] transition-colors ${
                  selectedPost?.id === post.id ? 'bg-[var(--bg-tertiary)]' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                    post.status === 'published' ? 'bg-[var(--success)]' :
                    post.status === 'scheduled' ? 'bg-[var(--accent)]' :
                    post.status === 'failed' ? 'bg-[var(--error)]' : 'bg-[var(--text-muted)]'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--text)] truncate">{post.title}</div>
                    <div className="flex items-center gap-2 mt-1 text-[10px]">
                      <span className={statusColors[post.status]}>{post.status}</span>
                      {post.views !== undefined && (
                        <span className="text-[var(--text-muted)] flex items-center gap-0.5">
                          <Eye className="w-3 h-3" />{post.views}
                        </span>
                      )}
                      {post.likes !== undefined && (
                        <span className="text-[var(--text-muted)]">{post.likes} likes</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        {selectedPost ? (
          <PostDetail post={selectedPost} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[var(--text-muted)]">
            <div className="text-center space-y-3">
              <Newspaper className="w-12 h-12 mx-auto opacity-20" />
              <p className="text-sm">Select a post to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PostDetail({ post }: { post: SubstackPost }) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h3 className="text-lg font-semibold text-[var(--text)]">{post.title}</h3>
        <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {post.status === 'published'
              ? `Published ${new Date(post.publishedAt!).toLocaleDateString()}`
              : `Scheduled ${new Date(post.scheduledAt).toLocaleDateString()}`
            }
          </span>
          {post.views !== undefined && (
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {post.views} views
            </span>
          )}
          {post.likes !== undefined && (
            <span>{post.likes} likes</span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="prose prose-sm prose-invert max-w-none">
            <p className="text-sm text-[var(--text)] leading-relaxed whitespace-pre-wrap">
              {post.content}
            </p>
            <div className="mt-6 p-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)] italic">
                This is a preview. The full article would be generated by the Substack Automation Agent
                using the configured persona and topics.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-t border-[var(--border)] flex items-center gap-2">
        {post.status === 'draft' && (
          <>
            <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors">
              <Send className="w-3.5 h-3.5" />
              Schedule
            </button>
            <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          </>
        )}
        {post.status === 'scheduled' && (
          <button className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-[var(--success)] text-white hover:opacity-90 transition-opacity">
            <Send className="w-3.5 h-3.5" />
            Publish Now
          </button>
        )}
      </div>
    </div>
  );
}
