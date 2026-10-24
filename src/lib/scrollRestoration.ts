'use client';

import { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// In-memory module caches to avoid repeated network calls and UI flashing when navigating back
const pageSectionsCache = new Map<string, any>();
const streamingNewsCache = new Map<string, any>();

export function getCachedPageSections(key: string): any | null {
  return pageSectionsCache.get(key) || null;
}

export function setCachedPageSections(key: string, data: any): void {
  pageSectionsCache.set(key, data);
}

export function getCachedStreamingNews(key: string): any | null {
  return streamingNewsCache.get(key) || null;
}

export function setCachedStreamingNews(key: string, data: any): void {
  streamingNewsCache.set(key, data);
}

/**
 * Clears saved vertical and horizontal scroll state for a specific page route.
 * Used when a user clicks a top navbar link to intentionally start fresh at the top of a page.
 */
export function clearPageScrollState(pathname: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`bingelog_scroll_${pathname}`);
    const prefix = `bingelog_hscroll_${pathname}_`;
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

export interface UseHorizontalScrollOptions {
  rowId: string;
  itemsCount?: number;
}

/**
 * Hook to manage horizontal scroll state persistence and restoration for carousels / side-scrolling rows.
 * Remembers scrollLeft in sessionStorage so when a user navigates to a movie/show and returns,
 * the row restores immediately to the exact item they were looking at.
 */
export function useHorizontalScroll({ rowId, itemsCount = 0 }: UseHorizontalScrollOptions) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const cleanRowId = (rowId || 'row').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  const storageKey = `bingelog_hscroll_${pathname}_${cleanRowId}`;

  const isRestoringRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveScroll = useCallback(() => {
    if (typeof window === 'undefined' || !rowRef.current || isRestoringRef.current) return;
    const scrollLeft = rowRef.current.scrollLeft;
    try {
      if (scrollLeft > 0) {
        sessionStorage.setItem(storageKey, String(Math.round(scrollLeft)));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleScroll = useCallback(() => {
    if (isRestoringRef.current) return;
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(saveScroll, 100);
  }, [saveScroll]);

  // Immediate save on click / pointer down to capture position before route transition starts
  const handlePointerDown = useCallback(() => {
    saveScroll();
  }, [saveScroll]);

  // Restore scroll position whenever component mounts or items become available
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let saved = '';
    try {
      saved = sessionStorage.getItem(storageKey) || '';
    } catch {
      return;
    }

    if (!saved) return;
    const scrollLeft = parseFloat(saved);
    if (isNaN(scrollLeft) || scrollLeft <= 0) return;

    const el = rowRef.current;
    if (!el) return;

    isRestoringRef.current = true;

    const restore = () => {
      if (rowRef.current) {
        rowRef.current.scrollLeft = scrollLeft;
      }
    };

    // Attempt instant restore across consecutive frames to handle CSS snap layout settling
    restore();
    const raf1 = requestAnimationFrame(restore);
    const raf2 = requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });

    const timer1 = setTimeout(restore, 60);
    const timer2 = setTimeout(() => {
      restore();
      isRestoringRef.current = false;
    }, 150);

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [storageKey, itemsCount]);

  const scrollLeftBy = (amount = 340) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -amount, behavior: 'smooth' });
    }
  };

  const scrollRightBy = (amount = 340) => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return {
    rowRef,
    handleScroll,
    handlePointerDown,
    saveScroll,
    scrollLeftBy,
    scrollRightBy,
  };
}

/**
 * Restores and records window vertical scroll position (scrollY) per pathname.
 * Ensures the user stays on the exact same vertical section of the page after navigating back.
 */
export function usePageScrollRestoration() {
  const pathname = usePathname();
  const isRestoringRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const scrollKey = `bingelog_scroll_${pathname}`;
    let raw = '';
    try {
      raw = sessionStorage.getItem(scrollKey) || '';
    } catch {
      return;
    }

    if (!raw) return;
    const savedY = parseFloat(raw);
    if (isNaN(savedY) || savedY <= 0) return;

    isRestoringRef.current = true;

    const restore = () => {
      if (isRestoringRef.current) {
        window.scrollTo({ top: savedY, behavior: 'instant' });
      }
    };

    restore();
    const raf1 = requestAnimationFrame(restore);
    const raf2 = requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });
    const timer1 = setTimeout(restore, 60);
    const timer2 = setTimeout(restore, 160);
    const timer3 = setTimeout(restore, 320);
    const timerEnd = setTimeout(() => {
      restore();
      isRestoringRef.current = false;
    }, 500);

    const cancel = () => {
      isRestoringRef.current = false;
    };
    window.addEventListener('wheel', cancel, { passive: true, once: true });
    window.addEventListener('touchmove', cancel, { passive: true, once: true });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timerEnd);
      window.removeEventListener('wheel', cancel);
      window.removeEventListener('touchmove', cancel);
    };
  }, [pathname]);
}
