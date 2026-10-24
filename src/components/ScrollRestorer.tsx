'use client';

import { useEffect } from 'react';
import { usePageScrollRestoration } from '@/lib/scrollRestoration';

export default function ScrollRestorer() {
  usePageScrollRestoration();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Capture vertical scroll position immediately upon clicking any link to a detail page
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const link = target?.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      if (
        href.startsWith('/movie/') ||
        href.startsWith('/tv/') ||
        href.startsWith('/person/')
      ) {
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

    document.addEventListener('click', handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleDocumentClick, { capture: true });
    };
  }, []);

  return null;
}
