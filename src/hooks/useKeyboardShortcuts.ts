'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import { useSessionStore } from '@/stores/sessionStore';

export function useKeyboardShortcuts() {
  const { toggleCommandPalette, toggleSidebar } = useUIStore();
  const { createSession } = useSessionStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;

      // Cmd+K: Toggle Command Palette
      if (isCmd && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }

      // Cmd+N: New Session
      if (isCmd && e.key === 'n') {
        e.preventDefault();
        createSession();
      }

      // Cmd+L: Focus chat input
      if (isCmd && e.key === 'l') {
        e.preventDefault();
        const input = document.querySelector<HTMLTextAreaElement>('textarea[placeholder*="Type a message"]');
        input?.focus();
      }

      // Cmd+/: Toggle Sidebar
      if (isCmd && e.key === '/') {
        e.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette, toggleSidebar, createSession]);
}
