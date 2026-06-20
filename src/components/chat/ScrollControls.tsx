'use client';

import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface ScrollControlsProps {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function ScrollControls({ containerRef }: ScrollControlsProps) {
  const [showJumpUp, setShowJumpUp] = useState(false);
  const [showJumpDown, setShowJumpDown] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowJumpUp(scrollTop > 200);
      setShowJumpDown(scrollTop + clientHeight < scrollHeight - 200);
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  const scrollTo = (position: 'top' | 'bottom') => {
    const container = containerRef.current;
    if (!container) return;
    container.scrollTo({
      top: position === 'top' ? 0 : container.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <div className="fixed bottom-20 right-4 flex flex-col gap-2 z-40">
      {showJumpUp && (
        <button
          onClick={() => scrollTo('top')}
          className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-all shadow-lg"
          title="Jump to top"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      )}
      {showJumpDown && (
        <button
          onClick={() => scrollTo('bottom')}
          className="w-9 h-9 rounded-full bg-[var(--bg-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-tertiary)] transition-all shadow-lg"
          title="Jump to bottom"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
