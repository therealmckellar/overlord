'use client';

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

export function Breadcrumbs() {
  const breadcrumbs = useUIStore((s) => s.breadcrumbs);

  if (breadcrumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 px-4 py-2 text-xs text-[var(--text-muted)] border-b border-[var(--border)] bg-[var(--bg)]">
      <Home className="w-3.5 h-3.5" />
      {breadcrumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          <ChevronRight className="w-3 h-3 text-[var(--text-muted)]" />
          {crumb.href && i < breadcrumbs.length - 1 ? (
            <a
              href={crumb.href}
              className="hover:text-[var(--text)] transition-colors"
            >
              {crumb.label}
            </a>
          ) : (
            <span className={i === breadcrumbs.length - 1 ? 'text-[var(--text)] font-medium' : ''}>
              {crumb.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
