'use client';

import React from 'react';

interface PanelWrapperProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

export function PanelWrapper({ children, title, className = '' }: PanelWrapperProps) {
  return (
    <div className={`glass-panel inner-bevel rounded-xl overflow-hidden p-4 border-[var(--border)] ${className}`}>
      {title && (
        <div className="mb-4">
          <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
