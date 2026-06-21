'use client';

import { useEffect, useCallback, useRef } from 'react';

interface FocusTrapOptions {
  isActive: boolean;
  onEscape?: () => void;
}

/**
 * Traps focus within a container element.
 * Useful for modals, dialogs, and panels.
 */
export function useFocusTrap({ isActive, onEscape }: FocusTrapOptions) {
  const containerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors);
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    // Focus first element on activate
    firstFocusable?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift+Tab: wrap to last
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable?.focus();
          }
        } else {
          // Tab: wrap to first
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable?.focus();
          }
        }
      }
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);

  return containerRef;
}

/**
 * Manages roving tabindex for a list of items.
 * Arrow keys move focus, Home/End jump to first/last.
 */
export function useRovingTabindex(itemCount: number, orientation: 'horizontal' | 'vertical' = 'vertical') {
  const itemRefs = useRef<(HTMLElement | null)[]>([]);
  const activeIndex = useRef(0);

  const setItemRef = useCallback((index: number) => (el: HTMLElement | null) => {
    itemRefs.current[index] = el;
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';

    if (e.key === prevKey) {
      e.preventDefault();
      const prev = (index - 1 + itemCount) % itemCount;
      itemRefs.current[prev]?.focus();
      activeIndex.current = prev;
    } else if (e.key === nextKey) {
      e.preventDefault();
      const next = (index + 1) % itemCount;
      itemRefs.current[next]?.focus();
      activeIndex.current = next;
    } else if (e.key === 'Home') {
      e.preventDefault();
      itemRefs.current[0]?.focus();
      activeIndex.current = 0;
    } else if (e.key === 'End') {
      e.preventDefault();
      itemRefs.current[itemCount - 1]?.focus();
      activeIndex.current = itemCount - 1;
    }
  }, [itemCount, orientation]);

  return { setItemRef, handleKeyDown, activeIndex };
}
