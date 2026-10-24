'use client';

import { useRef, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// In-memory module caches to avoid repeated network calls and UI flashing when navigating back
const pageSectionsCache = new Map<string, any>();
const streamingNewsCache = new Map<string, any>();
let continueWatchingCache: { active: any[]; meta: Record<number, any> } | null = null;
let forYouCache: { items: any[]; libraryCount: number } | null = null;

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

export function getCachedContinueWatching() {
  return continueWatchingCache;
}

export function setCachedContinueWatching(data: { active: any[]; meta: Record<number, any> }) {
  continueWatchingCache = data;
}

export function getCachedForYou() {
  return forYouCache;
}

export function setCachedForYou(data: { items: any[]; libraryCount: number }) {
  forYouCache = data;
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
 *
 * Restores once cleanly on mount without loops or timer locks, ensuring smooth native gestures.
 */
export function useHorizontalScroll({ rowId, itemsCount = 0 }: UseHorizontalScrollOptions) {
  const rowRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const cleanRowId = (rowId || 'row').toLowerCase().replace(/[^a-z0-9_-]+/g, '_');
  const storageKey = `bingelog_hscroll_${pathname}_${cleanRowId}`;

  const restoredRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const saveScroll = useCallback(() => {
    if (typeof window === 'undefined' || !rowRef.current) return;
    const scrollLeft = rowRef.current.scrollLeft;
    try {
      if (scrollLeft > 5) {
        sessionStorage.setItem(storageKey, String(Math.round(scrollLeft)));
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  const handleScroll = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveScroll, 60);
  }, [saveScroll]);

  // Immediate save on click / pointer down to capture position before route transition starts
  const handlePointerDown = useCallback(() => {
    saveScroll();
  }, [saveScroll]);

  // Captures both horizontal scroll and window vertical scroll immediately upon clicking any item in the row
  const handleClickCapture = useCallback(() => {
    saveScroll();
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`bingelog_scroll_${pathname}`, String(Math.round(window.scrollY)));
      } catch {
        // ignore
      }
    }
  }, [saveScroll, pathname]);

  // Restore scroll position once on mount or when items first become available
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let saved = '';
    try {
      saved = sessionStorage.getItem(storageKey) || '';
    } catch {
      return;
    }

    if (!saved) return;
    const targetScrollLeft = parseFloat(saved);
    if (isNaN(targetScrollLeft) || targetScrollLeft <= 0) return;

    if (restoredRef.current) return;

    const el = rowRef.current;
    if (!el) return;

    // Apply scroll position immediately
    el.scrollLeft = targetScrollLeft;
    restoredRef.current = true;

    // A single animation frame safety check in case items flex layout settled on the next frame
    const rafId = requestAnimationFrame(() => {
      if (rowRef.current && Math.abs(rowRef.current.scrollLeft - targetScrollLeft) > 10) {
        rowRef.current.scrollLeft = targetScrollLeft;
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
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
    handleClickCapture,
    saveScroll,
    scrollLeftBy,
    scrollRightBy,
  };
}

/**
 * Restores window vertical scroll position (scrollY) per pathname on mount.
 * Restores immediately once before paint without multiple delayed timers to prevent jumping.
 */
export function usePageScrollRestoration() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

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

    const restore = () => {
      window.scrollTo({ top: savedY, behavior: 'instant' });
    };

    restore();
    const rafId = requestAnimationFrame(restore);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [pathname]);
}
