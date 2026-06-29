'use client';

import { useState } from 'react';
import { AccountsTab } from './AccountsTab';
import { ListeningTab } from './ListeningTab';
import { TrendingTab } from './TrendingTab';

type Tab = 'accounts' | 'listening' | 'trending';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'accounts', label: 'Accounts', icon: '🔗' },
  { id: 'listening', label: 'Listening', icon: '👂' },
  { id: 'trending', label: 'Trending', icon: '🔥' },
];

export function SocialPanel() {
  const [activeTab, setActiveTab] = useState<Tab>('trending');

  return (
    <div className="flex flex-col h-full bg-[var(--bg)]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">📡</span>
          <h2 className="text-sm font-semibold text-[var(--text)]">Social Command Center</h2>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[var(--accent)] border-b-2 border-[var(--accent)] bg-[var(--accent)]/5'
                : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)]'
            }`}
          >
            <span>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'accounts' && <AccountsTab />}
        {activeTab === 'listening' && <ListeningTab />}
        {activeTab === 'trending' && <TrendingTab />}
      </div>
    </div>
  );
}
