'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { Film, Tv, Sparkles, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import MediaCard from './MediaCard';

interface HorizontalMediaRowProps {
  title: string;
  iconType?: 'film' | 'tv' | 'sparkles';
  iconColor?: string;
  items: MediaItem[];
  moreLink?: {
    href: string;
    label: string;
  };
}

export default function HorizontalMediaRow({
  title,
  iconType,
  iconColor = 'text-[#E9A23B]',
  items,
  moreLink,
}: HorizontalMediaRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  const IconComponent =
    iconType === 'film'
      ? Film
      : iconType === 'tv'
      ? Tv
      : iconType === 'sparkles'
      ? Sparkles
      : null;

  const scrollLeft = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (rowRef.current) {
      rowRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-14 relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className={`w-5 h-5 ${iconColor}`} />}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight">
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Buttons (visible on md screens and up) */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={scrollLeft}
              aria-label="Scrolla vänster"
              className="w-7 h-7 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              aria-label="Scrolla höger"
              className="w-7 h-7 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {moreLink && (
            <Link
              href={moreLink.href}
              className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors"
            >
              <span>{moreLink.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={rowRef}
        className="flex overflow-x-auto gap-3.5 sm:gap-4 pb-3 scrollbar-none snap-x snap-mandatory overscroll-x-contain -mx-4 px-4 sm:mx-0 sm:px-0"
      >
        {items.map((item) => (
          <div
            key={`row-${item.media_type}-${item.id}`}
            className="w-36 xs:w-40 sm:w-44 md:w-48 flex-shrink-0 snap-start"
          >
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
