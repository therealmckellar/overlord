import { useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useUIStore } from '@/stores/uiStore';

export const COMMANDS = [
  { value: '/route', label: 'Route', description: 'Plan the optimal execution path' },
  { value: '/create', label: 'Create', description: 'Generate a new asset or resource' },
  { value: '/advance', label: 'Advance', description: 'Push the current state forward' },
  { value: '/diagnose', label: 'Diagnose', description: 'Analyze system health and errors' },
  { value: '/hunt', label: 'Hunt', description: 'Search for specific patterns or anomalies' },
  { value: '/scale', label: 'Scale', description: 'Adjust resource allocation' },
  { value: '/handoff', label: 'Handoff', description: 'Transfer context to another agent' },
  { value: '/status', label: 'Status', description: 'Get a comprehensive system report' },
] as const;

export function useCommandPalette() {
  const [query, setQuery] = useState('');
  const commandPaletteOpen = useUIStore((s) => s.commandPaletteOpen);
  const setCommandPaletteOpen = useUIStore((s) => s.setCommandPaletteOpen);
  const toggleCommandPalette = useUIStore((s) => s.toggleCommandPalette);

  const fuse = new Fuse(COMMANDS, {
    keys: ['label', 'value', 'description'],
    threshold: 0.3,
  });

  const results = query 
    ? fuse.search(query).map(r => r.item) 
    : COMMANDS;

  return {
    query,
    setQuery,
    results,
    isOpen: commandPaletteOpen,
    setOpen: setCommandPaletteOpen,
    toggle: toggleCommandPalette,
  };
}
