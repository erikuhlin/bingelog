'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Tv, Sparkles, Calendar, Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import MediaCard from './MediaCard';
import { useHorizontalScroll } from '@/lib/scrollRestoration';

interface HorizontalMediaRowProps {
  rowId?: string;
  title: string;
  description?: string;
  badge?: string;
  iconType?: 'film' | 'tv' | 'sparkles' | 'calendar' | 'clock';
  iconColor?: string;
  items: MediaItem[];
  moreLink?: {
    href: string;
    label: string;
  };
}

export default function HorizontalMediaRow({
  rowId,
  title,
  description,
  badge,
  iconType,
  iconColor = 'text-[#E9A23B]',
  items,
  moreLink,
}: HorizontalMediaRowProps) {
  const {
    rowRef,
    handleScroll,
    handlePointerDown,
    handleClickCapture,
    scrollLeftBy,
    scrollRightBy,
  } = useHorizontalScroll({
    rowId: rowId || title,
    itemsCount: items?.length || 0,
  });

  const IconComponent =
    iconType === 'film'
      ? Film
      : iconType === 'tv'
      ? Tv
      : iconType === 'sparkles'
      ? Sparkles
      : iconType === 'calendar'
      ? Calendar
      : iconType === 'clock'
      ? Clock
      : null;

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-14 relative w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {IconComponent && <IconComponent className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 ${iconColor}`} />}
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight">
              {title}
            </h2>
            {badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-xs text-[#8D97A8] mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Scroll Buttons (visible on md screens and up) */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scrollLeftBy(340)}
              aria-label="Scrolla vänster"
              className="w-7 h-7 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => scrollRightBy(340)}
              aria-label="Scrolla höger"
              className="w-7 h-7 rounded-xl bg-[#171C25] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {moreLink && (
            <Link
              href={moreLink.href}
              className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
            >
              <span>{moreLink.label}</span>
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      <div
        ref={rowRef}
        onScroll={handleScroll}
        onPointerDown={handlePointerDown}
        onClickCapture={handleClickCapture}
        className="w-full max-w-full flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-none snap-x snap-mandatory overscroll-x-contain"
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
