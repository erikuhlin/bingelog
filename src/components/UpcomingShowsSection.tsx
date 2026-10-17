'use client';

import React, { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { Calendar, ChevronLeft, ChevronRight, Sparkles, Tv, Layers, ArrowRight } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import MediaCard from './MediaCard';

interface UpcomingShowsSectionProps {
  upcomingSeasons: MediaItem[];
  upcomingNewShows: MediaItem[];
}

type UpcomingTab = 'seasons' | 'new_shows' | 'all';

export default function UpcomingShowsSection({
  upcomingSeasons,
  upcomingNewShows,
}: UpcomingShowsSectionProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  // Default to all
  const defaultTab: UpcomingTab = 'all';
  const [activeTab, setActiveTab] = useState<UpcomingTab>(defaultTab);

  // Combine both for "Alla"
  const allUpcoming = useMemo(() => {
    const combined = [...upcomingSeasons, ...upcomingNewShows];
    // Sort by date
    combined.sort((a, b) => {
      const dateA = a.upcoming_date ? new Date(a.upcoming_date).getTime() : Infinity;
      const dateB = b.upcoming_date ? new Date(b.upcoming_date).getTime() : Infinity;
      return dateA - dateB;
    });
    return combined;
  }, [upcomingSeasons, upcomingNewShows]);

  // Current active items
  const currentItems = useMemo(() => {
    switch (activeTab) {
      case 'seasons':
        return upcomingSeasons;
      case 'new_shows':
        return upcomingNewShows;
      case 'all':
      default:
        return allUpcoming;
    }
  }, [activeTab, upcomingSeasons, upcomingNewShows, allUpcoming]);

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

  if (allUpcoming.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-14 relative w-full max-w-full overflow-hidden">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-3 min-w-0">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#E9A23B] flex-shrink-0" />
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight">
              Kommande serier &amp; säsonger
            </h2>
          </div>
          <p className="text-xs text-[#8D97A8] mt-0.5">
            Serier och säsonger som ännu inte haft premiär
          </p>
        </div>

        {/* Tab selector & Scroll buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* Quick Tabs */}
          <div className="flex items-center bg-[#171C25] border border-[#2B3443] p-1 rounded-xl">
            {upcomingSeasons.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('seasons');
                  if (rowRef.current) rowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'seasons'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#E9A23B]" />
                <span>Nya säsonger</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'seasons' ? 'bg-[#E9A23B]/20 text-[#E9A23B]' : 'bg-[#0F1218] text-[#8D97A8]'
                  }`}
                >
                  {upcomingSeasons.length}
                </span>
              </button>
            )}

            {upcomingNewShows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('new_shows');
                  if (rowRef.current) rowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'new_shows'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3.5 h-3.5 text-sky-400" />
                <span>Nya serier</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === 'new_shows' ? 'bg-sky-400/20 text-sky-400' : 'bg-[#0F1218] text-[#8D97A8]'
                  }`}
                >
                  {upcomingNewShows.length}
                </span>
              </button>
            )}

            {upcomingSeasons.length > 0 && upcomingNewShows.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('all');
                  if (rowRef.current) rowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-[#1E2531] text-[#ECE9E3] shadow-sm'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                Alla ({allUpcoming.length})
              </button>
            )}
          </div>

          {/* Desktop Scroll Arrows */}
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

          {/* Visa alla kommande link */}
          <Link
            href={`/upcoming?tab=${activeTab === 'seasons' ? 'seasons' : activeTab === 'new_shows' ? 'new_shows' : 'shows'}`}
            className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors whitespace-nowrap flex-shrink-0"
          >
            <span>Visa alla</span>
            <ArrowRight className="w-3.5 h-3.5 flex-shrink-0" />
          </Link>
        </div>
      </div>

      {/* Horizontal Carousel Track */}
      <div
        ref={rowRef}
        className="w-full max-w-full flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-none snap-x snap-mandatory overscroll-x-contain"
      >
        {currentItems.map((item) => (
          <div
            key={`upcoming-${item.id}-${item.upcoming_season || 'new'}`}
            className="w-36 xs:w-40 sm:w-44 md:w-48 flex-shrink-0 snap-start"
          >
            <MediaCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
