'use client';

import { useUIStore } from '@/stores';
import { getThemeColors } from '@/config/themes';
import { useEffect, useState } from 'react';

export function useTheme() {
  const { theme, setTheme } = useUIStore();
  const colors = getThemeColors(theme);

  useEffect(() => {
    const root = document.documentElement;
    // Set data-theme attribute for CSS selector targeting
    root.setAttribute('data-theme', theme);
    // Apply theme colors as CSS custom properties
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value);
    });
  }, [theme, colors]);

  return { theme, setTheme, colors };
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export function useBreakpoint() {
  const isMobile = useMediaQuery('(max-width: 639px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  return { isMobile, isTablet, isDesktop };
}

export function useKeyboardShortcut(
  key: string,
  callback: () => void,
  options?: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean }
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (options?.ctrl && !e.ctrlKey) return;
      if (options?.shift && !e.shiftKey) return;
      if (options?.alt && !e.altKey) return;
      if (options?.meta && !e.metaKey) return;
      if (e.key.toLowerCase() === key.toLowerCase()) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [key, callback, options]);
}

export function useClickOutside(ref: React.RefObject<HTMLElement | null>, callback: () => void) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [ref, callback]);
}

export function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((prev: T) => T)) => {
    const next = value instanceof Function ? value(stored) : value;
    setStored(next);
    window.localStorage.setItem(key, JSON.stringify(next));
  };

  return [stored, setValue];
}


