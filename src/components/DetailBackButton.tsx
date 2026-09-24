'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MediaType } from '@/lib/types';

interface DetailBackButtonProps {
  mediaType?: MediaType;
}

export default function DetailBackButton({ mediaType }: DetailBackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      // Fallback navigation if directly accessed through URL
      const fallbackUrl = mediaType === 'movie' ? '/movies' : mediaType === 'tv' ? '/shows' : '/';
      router.push(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] transition-colors shadow-sm cursor-pointer active:scale-95"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      <span>Tillbaka till översikten</span>
    </button>
  );
}
