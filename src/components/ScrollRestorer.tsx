'use client';

import { useEffect } from 'react';
import { usePageScrollRestoration } from '@/lib/scrollRestoration';

export default function ScrollRestorer() {
  usePageScrollRestoration();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handlePopState = () => {
      try {
        sessionStorage.setItem('bingelog_back_nav', '1');
      } catch {
        // ignore
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return null;
}
