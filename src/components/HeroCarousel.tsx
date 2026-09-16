'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Star, Info, Film, Tv, ChevronLeft, ChevronRight } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import StatusSelector from './StatusSelector';

interface HeroCarouselProps {
  items: MediaItem[];
  autoPlayIntervalMs?: number;
}

export default function HeroCarousel({
  items,
  autoPlayIntervalMs = 6000,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const touchEndY = useRef<number | null>(null);

  const carouselItems = items.slice(0, 6);
  const total = carouselItems.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Autoplay effect
  useEffect(() => {
    if (isPaused || total <= 1) return;
    const interval = setInterval(nextSlide, autoPlayIntervalMs);
    return () => clearInterval(interval);
  }, [isPaused, total, nextSlide, autoPlayIntervalMs]);

  // Touch swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    touchStartX.current = e.targetTouches[0].clientX;
    touchStartY.current = e.targetTouches[0].clientY;
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
    touchEndY.current = e.targetTouches[0].clientY;
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (
      touchStartX.current === null ||
      touchEndX.current === null ||
      touchStartY.current === null ||
      touchEndY.current === null
    ) {
      return;
    }

    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 40;

    // Only swipe if horizontal movement exceeds vertical movement to avoid interfering with scrolling
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > minSwipeDistance) {
      if (diffX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  const handleTouchCancel = () => {
    setIsPaused(false);
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    touchEndY.current = null;
  };

  if (!items || items.length === 0) return null;

  return (
    <div
      className="relative w-full h-[420px] xs:h-[440px] sm:h-[480px] md:h-[530px] rounded-3xl overflow-hidden mb-8 md:mb-12 border border-[#2B3443] shadow-2xl group select-none bg-[#0F1218] touch-pan-y"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Slides */}
      {carouselItems.map((item, index) => {
        const isActive = index === currentIndex;
        const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
        const detailUrl = `/${item.media_type}/${item.id}`;

        return (
          <div
            key={`hero-${item.media_type}-${item.id}`}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'
            }`}
          >
            {/* Backdrop Image */}
            <img
              src={getBackdropUrl(item.backdrop_path, 'original')}
              alt={item.title}
              className="w-full h-full object-cover object-center"
              loading={index === 0 ? 'eager' : 'lazy'}
            />

            {/* Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F1218] via-[#0F1218]/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F1218]/95 via-[#0F1218]/60 to-transparent" />

            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 pb-14 sm:p-8 sm:pb-8 md:p-12 max-w-2xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#E9A23B] text-[#0F1218] font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-[#E9A23B]/30">
                  🔥 Trendar #{index + 1}
                </span>

                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171C25]/90 text-[#ECE9E3] font-semibold text-[10px] sm:text-xs border border-[#2B3443]">
                  {item.media_type === 'movie' ? (
                    <>
                      <Film className="w-3 h-3 text-[#E9A23B]" />
                      <span>Film</span>
                    </>
                  ) : (
                    <>
                      <Tv className="w-3 h-3 text-[#6FA98A]" />
                      <span>Serie</span>
                    </>
                  )}
                </span>

                {year && <span className="text-[#8D97A8] text-xs font-medium">{year}</span>}

                {item.vote_average > 0 && (
                  <span className="flex items-center gap-1 text-xs font-bold text-[#E9A23B] bg-[#171C25]/90 px-2 py-0.5 rounded-full border border-[#2B3443]">
                    <Star className="w-3 h-3 fill-[#E9A23B]" />
                    <span>{item.vote_average.toFixed(1)}</span>
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#ECE9E3] tracking-tight leading-tight mb-2 sm:mb-2.5 drop-shadow-md">
                {item.title}
              </h1>

              {/* Overview */}
              <p className="text-[#ECE9E3]/85 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed max-w-xl">
                {item.overview}
              </p>

              {/* Watch provider badges */}
              {item.watch_providers && item.watch_providers.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[11px] font-semibold text-[#8D97A8]">Tillgänglig på:</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    {item.watch_providers.map((p) => (
                      <div
                        key={p.provider_id}
                        title={p.provider_name}
                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#171C25] border border-[#2B3443] text-[11px] text-[#ECE9E3] shadow-md flex-shrink-0"
                      >
                        <img
                          src={getImageUrl(p.logo_path, 'w300')}
                          alt={p.provider_name}
                          className="w-4 h-4 rounded-md object-cover"
                        />
                        <span className="font-semibold text-[10px]">{p.provider_name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                <Link
                  href={detailUrl}
                  className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#E9A23B]/20 hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap flex-shrink-0"
                >
                  <Info className="w-4 h-4" />
                  <span>Mer information</span>
                </Link>

                <div className="w-auto flex-shrink-0">
                  <StatusSelector
                    tmdbId={item.id}
                    mediaType={item.media_type}
                    title={item.title}
                    posterPath={item.poster_path}
                    backdropPath={item.backdrop_path}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Navigation Arrows (visible on hover or desktop) */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Föregående titel"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#171C25]/80 hover:bg-[#1E2531] text-[#ECE9E3] border border-[#2B3443] backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg active:scale-90"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Nästa titel"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-[#171C25]/80 hover:bg-[#1E2531] text-[#ECE9E3] border border-[#2B3443] backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-lg active:scale-90"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Paginator Dots */}
      {total > 1 && (
        <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 sm:left-auto sm:right-6 sm:bottom-5 sm:translate-x-0 z-20 flex items-center gap-1.5 bg-[#0F1218]/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#2B3443]/70 shadow-lg">
          {carouselItems.map((_, i) => (
            <button
              key={`dot-${i}`}
              type="button"
              onClick={() => setCurrentIndex(i)}
              aria-label={`Gå till titel ${i + 1}`}
              className={`transition-all rounded-full cursor-pointer ${
                i === currentIndex
                  ? 'w-5 h-2 bg-[#E9A23B]'
                  : 'w-2 h-2 bg-[#8D97A8]/40 hover:bg-[#8D97A8]'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
