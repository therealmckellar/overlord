/**
 * Theme definitions for Agent OS / Overlord
 * 5 themes: dark, light, midnight, forest, arctic (+ system alias)
 * Each theme defines CSS custom properties consumed by globals.css
 *
 * Canonical source of truth for theme names is types/index.ts.
 * This file provides display labels + CSS variable generation.
 */

import type { ThemeName } from '@/types';

export const THEME_LIST: ThemeName[] = ['dark', 'light', 'midnight', 'forest', 'arctic', 'system'];

export const THEME_LABELS: Record<ThemeName, string> = {
  dark: 'Dark',
  light: 'Light',
  midnight: 'Midnight',
  forest: 'Forest',
  arctic: 'Arctic',
  system: 'System',
};

/**
 * Map from ThemeName to CSS custom property values.
 * Uses the same key names as ThemeColors in types/index.ts.
 */
export const THEME_CSS_VARS: Record<Exclude<ThemeName, 'system'>, Record<string, string>> = {
  dark: {
    '--bg': '#0d0d0d',
    '--bg-secondary': '#1a1a1a',
    '--bg-tertiary': '#242424',
    '--text': '#e8e8e8',
    '--text-secondary': '#a0a0a0',
    '--text-muted': '#666666',
    '--border': '#2a2a2a',
    '--accent': '#6366f1',
    '--accent-hover': '#818cf8',
    '--accent-muted': '#4338ca',
    '--success': '#22c55e',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#3b82f6',
    '--user-bubble': '#1e1b4b',
    '--assistant-bubble': '#1a1a1a',
    '--code-bg': '#111111',
    '--code-text': '#c9d1d9',
    '--shadow': 'rgba(0,0,0,0.4)',
    '--overlay': 'rgba(0,0,0,0.7)',
  },
  light: {
    '--bg': '#ffffff',
    '--bg-secondary': '#f5f5f5',
    '--bg-tertiary': '#e8e8e8',
    '--text': '#1a1a1a',
    '--text-secondary': '#555555',
    '--text-muted': '#999999',
    '--border': '#d4d4d4',
    '--accent': '#6366f1',
    '--accent-hover': '#4f46e5',
    '--accent-muted': '#a5b4fc',
    '--success': '#16a34a',
    '--warning': '#d97706',
    '--error': '#dc2626',
    '--info': '#2563eb',
    '--user-bubble': '#e0e7ff',
    '--assistant-bubble': '#f5f5f5',
    '--code-bg': '#f3f4f6',
    '--code-text': '#1f2937',
    '--shadow': 'rgba(0,0,0,0.1)',
    '--overlay': 'rgba(0,0,0,0.4)',
  },
  midnight: {
    '--bg': '#0a0e1a',
    '--bg-secondary': '#111827',
    '--bg-tertiary': '#1f2937',
    '--text': '#e2e8f0',
    '--text-secondary': '#94a3b8',
    '--text-muted': '#475569',
    '--border': '#1e293b',
    '--accent': '#8b5cf6',
    '--accent-hover': '#a78bfa',
    '--accent-muted': '#6d28d9',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--error': '#f43f5e',
    '--info': '#0ea5e9',
    '--user-bubble': '#1e1b4b',
    '--assistant-bubble': '#111827',
    '--code-bg': '#0f172a',
    '--code-text': '#cbd5e1',
    '--shadow': 'rgba(0,0,0,0.5)',
    '--overlay': 'rgba(0,0,0,0.75)',
  },
  forest: {
    '--bg': '#0a1a0f',
    '--bg-secondary': '#112215',
    '--bg-tertiary': '#1a3320',
    '--text': '#d4e8d8',
    '--text-secondary': '#8fbc94',
    '--text-muted': '#4a7a52',
    '--border': '#1e3a25',
    '--accent': '#34d399',
    '--accent-hover': '#6ee7b7',
    '--accent-muted': '#059669',
    '--success': '#22c55e',
    '--warning': '#eab308',
    '--error': '#f87171',
    '--info': '#38bdf8',
    '--user-bubble': '#064e3b',
    '--assistant-bubble': '#112215',
    '--code-bg': '#0d1f12',
    '--code-text': '#a7f3d0',
    '--shadow': 'rgba(0,0,0,0.45)',
    '--overlay': 'rgba(0,0,0,0.7)',
  },
  arctic: {
    '--bg': '#f0f4f8',
    '--bg-secondary': '#e2e8f0',
    '--bg-tertiary': '#cbd5e1',
    '--text': '#1e293b',
    '--text-secondary': '#475569',
    '--text-muted': '#94a3b8',
    '--border': '#cbd5e1',
    '--accent': '#0ea5e9',
    '--accent-hover': '#0284c7',
    '--accent-muted': '#7dd3fc',
    '--success': '#10b981',
    '--warning': '#f59e0b',
    '--error': '#ef4444',
    '--info': '#3b82f6',
    '--user-bubble': '#dbeafe',
    '--assistant-bubble': '#e2e8f0',
    '--code-bg': '#f1f5f9',
    '--code-text': '#334155',
    '--shadow': 'rgba(0,0,0,0.08)',
    '--overlay': 'rgba(0,0,0,0.35)',
  },
};

/**
 * Get CSS variables for a given theme.
 * 'system' resolves to dark (with light via media query in globals.css).
 */
export function getThemeCSSVars(theme: ThemeName): Record<string, string> {
  if (theme === 'system') {
    return { ...THEME_CSS_VARS.dark };
  }
  return { ...THEME_CSS_VARS[theme] };
}
