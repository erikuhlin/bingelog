'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flame,
} from 'lucide-react';
import { MediaItem, MediaType } from '@/lib/types';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';
import MediaCard from './MediaCard';

interface StreamingNewsRowProps {
  initialItems: MediaItem[];
  selectedProviderIds: number[];
  defaultMediaType?: 'all' | MediaType;
}

export default function StreamingNewsRow({
  initialItems,
  selectedProviderIds,
  defaultMediaType = 'all',
}: StreamingNewsRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initialItems);
  const [loading, setLoading] = useState(false);

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  useEffect(() => {
    const isDefault = selectedProviderIds.length === 0 && defaultMediaType === 'all';
    if (isDefault) {
      setItems(initialItems);
      return;
    }

    let isMounted = true;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('newReleasesOnly', 'true');
        if (defaultMediaType !== 'all') {
          params.set('mediaType', defaultMediaType);
        }
        if (selectedProviderIds.length > 0) {
          params.set('providerIds', selectedProviderIds.join(','));
        }
        params.set('sortBy', 'popularity.desc');
        params.set('page', '1');

        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setItems(data.results || []);
            if (rowRef.current) {
              rowRef.current.scrollTo({ left: 0, behavior: 'smooth' });
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch streaming news:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNews();
    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, defaultMediaType, initialItems]);

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

  const getTitle = () => {
    const prefix =
      defaultMediaType === 'movie'
        ? 'Nya filmer'
        : defaultMediaType === 'tv'
        ? 'Nya serier & säsonger'
        : 'Nyheter';

    if (selectedProviderNames.length === 1) {
      return `${prefix} på ${selectedProviderNames[0]}`;
    }
    if (selectedProviderNames.length === 2) {
      return `${prefix} på ${selectedProviderNames[0]} & ${selectedProviderNames[1]}`;
    }
    if (selectedProviderNames.length > 2) {
      return `${prefix} på valda tjänster (${selectedProviderNames.length})`;
    }
    return `${prefix} på streaming`;
  };

  const getDescription = () => {
    if (selectedProviderNames.length > 0) {
      return `Nyligen släppt och aktuellt på ${selectedProviderNames.join(', ')}`;
    }
    if (defaultMediaType === 'movie') {
      return 'Senaste släppta filmerna som nu finns att streama i Sverige';
    }
    if (defaultMediaType === 'tv') {
      return 'Senaste serierna och nya säsonger som nyligen haft premiär';
    }
    return 'Färska premiärer och nyligen tillagda titlar på svenska streamingtjänster';
  };

  return (
    <section className="mb-8 sm:mb-12 relative w-full max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3.5 sm:mb-4 gap-2.5 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="w-5 h-5 text-[#E9A23B] flex-shrink-0" />
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight truncate">
              {getTitle()}
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B]">
              {selectedProviderNames.length === 1 ? `Nytt på ${selectedProviderNames[0]}` : 'Nyligen släppt'}
            </span>
          </div>
          <p className="text-xs text-[#8D97A8] mt-0.5 truncate">{getDescription()}</p>
        </div>

        <div className="flex items-center justify-end gap-2 flex-shrink-0">
          {/* Scroll Buttons */}
          <div className="flex items-center gap-1.5">
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
        </div>
      </div>

      {/* Horizontal Scroll Track */}
      {loading ? (
        <div className="h-64 sm:h-72 rounded-2xl bg-[#171C25]/50 border border-[#2B3443]/60 flex flex-col items-center justify-center gap-2.5 text-[#8D97A8]">
          <Loader2 className="w-6 h-6 animate-spin text-[#E9A23B]" />
          <span className="text-xs font-medium">
            Hämtar nyheter{selectedProviderNames.length > 0 ? ` på ${selectedProviderNames.join(', ')}` : ''}...
          </span>
        </div>
      ) : items.length > 0 ? (
        <div
          ref={rowRef}
          className="w-full max-w-full flex overflow-x-auto gap-3 sm:gap-4 pb-3 scrollbar-none snap-x snap-mandatory overscroll-x-contain"
        >
          {items.map((item) => (
            <div
              key={`news-${item.media_type}-${item.id}`}
              className="w-36 xs:w-40 sm:w-44 md:w-48 flex-shrink-0 snap-start"
            >
              <MediaCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center rounded-2xl bg-[#171C25]/40 border border-dashed border-[#2B3443]">
          <p className="text-xs text-[#8D97A8]">
            Inga färska nyheter hittades för detta val just nu.
          </p>
        </div>
      )}
    </section>
  );
}
