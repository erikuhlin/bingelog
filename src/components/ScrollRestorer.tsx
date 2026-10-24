'use client';

import { useEffect } from 'react';
import { usePageScrollRestoration } from '@/lib/scrollRestoration';

export default function ScrollRestorer() {
  usePageScrollRestoration();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    const handlePopState = () => {
      try {
        sessionStorage.setItem('bingelog_back_nav', '1');
      } catch {
        // ignore
      }
    };

    // Save scroll position immediately on click when navigating to any detail page
    const handleCaptureClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      // When clicking a link that leads to another page or detail item
      if (href.startsWith('/') && !href.startsWith('#')) {
        try {
          sessionStorage.setItem(
            `bingelog_scroll_${window.location.pathname}`,
            String(Math.round(window.scrollY))
          );
        } catch {
          // ignore
        }
      }
    };

    const handlePageHide = () => {
      try {
        if (window.scrollY > 0) {
          sessionStorage.setItem(
            `bingelog_scroll_${window.location.pathname}`,
            String(Math.round(window.scrollY))
          );
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    document.addEventListener('click', handleCaptureClick, { capture: true });
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleCaptureClick, { capture: true });
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, []);

  return null;
}
