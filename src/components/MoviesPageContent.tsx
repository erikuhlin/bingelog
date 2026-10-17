'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Tv,
  Ticket,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { MediaItem, MovieMonetizationFilter } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';
import MediaCard from './MediaCard';

interface MoviesPageContentProps {
  popularMovies: MediaItem[];
  initialNewReleases: MediaItem[];
  theatricalMovies: MediaItem[];
  rentBuyMovies: MediaItem[];
  upcomingMovies: MediaItem[];
  curatedRows: CuratedCategoryRow[];
}

export default function MoviesPageContent({
  popularMovies,
  initialNewReleases,
  theatricalMovies,
  rentBuyMovies,
  upcomingMovies,
  curatedRows,
}: MoviesPageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [activeSectionTab, setActiveSectionTab] = useState<'theatrical' | 'flatrate' | 'rent_buy'>('theatrical');
  const [catalogMonetization, setCatalogMonetization] = useState<MovieMonetizationFilter>('all');

  const [streamingTabItems, setStreamingTabItems] = useState<MediaItem[]>(popularMovies);
  const [loadingStreamingTab, setLoadingStreamingTab] = useState(false);
  const modeRowRef = useRef<HTMLDivElement>(null);

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  // When user selects streaming providers at the top, update the "Streama" tab items
  useEffect(() => {
    if (selectedProviderIds.length === 0) {
      setStreamingTabItems(popularMovies);
      return;
    }

    let isMounted = true;
    const fetchForProviders = async () => {
      setLoadingStreamingTab(true);
      try {
        const params = new URLSearchParams();
        params.set('mediaType', 'movie');
        params.set('monetizationType', 'flatrate');
        params.set('providerIds', selectedProviderIds.join(','));
        params.set('sortBy', 'popularity.desc');
        params.set('page', '1');

        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setStreamingTabItems(data.results || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch streaming movies for section:', err);
      } finally {
        if (isMounted) {
          setLoadingStreamingTab(false);
        }
      }
    };

    fetchForProviders();
    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, popularMovies]);

  const scrollModeRowLeft = () => {
    if (modeRowRef.current) {
      modeRowRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollModeRowRight = () => {
    if (modeRowRef.current) {
      modeRowRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  const currentModeItems =
    activeSectionTab === 'theatrical'
      ? theatricalMovies
      : activeSectionTab === 'rent_buy'
      ? rentBuyMovies
      : streamingTabItems;

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Se färska nyheter på dina streamingtjänster, bioaktuella premiärer, hyr- & köpfilmer och utforska hela filmkatalogen.
        </p>
      </div>

      {/* 1. Top Streaming Service Selector */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/80 border border-[#2B3443] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Tv className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[#ECE9E3] tracking-tight truncate">
              Välj streamingtjänst
            </span>
            {selectedProviderNames.length > 0 ? (
              <span className="text-xs font-semibold text-[#E9A23B] truncate hidden xs:inline">
                • {selectedProviderNames.join(', ')}
              </span>
            ) : (
              <span className="text-xs text-[#8D97A8] hidden sm:inline">
                • Visar nyheter och filmer från samtliga tjänster
              </span>
            )}
          </div>

          {selectedProviderIds.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedProviderIds([])}
              className="flex items-center gap-1 text-xs font-semibold text-[#8D97A8] hover:text-[#E9A23B] transition-colors flex-shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Visa alla</span>
            </button>
          )}
        </div>

        <ProviderFilterTabs
          selectedProviderIds={selectedProviderIds}
          onSelectProvider={setSelectedProviderIds}
        />
      </div>

      {/* 2. Top Horizontal Row: "Nya filmer på streaming" (reacts to selected streaming services) */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="movie"
      />

      {/* 3. Smart Section: Bioaktuella / Streama / Hyr & Köp */}
      <section className="mb-8 sm:mb-12 relative w-full max-w-full overflow-hidden p-4 sm:p-6 rounded-3xl bg-[#171C25]/50 border border-[#2B3443]/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {activeSectionTab === 'theatrical' ? (
                <Ticket className="w-5 h-5 text-[#E9A23B] flex-shrink-0" />
              ) : activeSectionTab === 'rent_buy' ? (
                <ShoppingBag className="w-5 h-5 text-sky-400 flex-shrink-0" />
              ) : (
                <Tv className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              )}
              <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight">
                {activeSectionTab === 'theatrical'
                  ? 'Bioaktuella filmer just nu'
                  : activeSectionTab === 'rent_buy'
                  ? 'Nytt att hyra & köpa digitalt'
                  : selectedProviderNames.length > 0
                  ? `Populärt att streama på ${selectedProviderNames.join(' & ')}`
                  : 'Populärt att streama'}
              </h2>
            </div>
            <p className="text-xs text-[#8D97A8] mt-0.5">
              {activeSectionTab === 'theatrical'
                ? 'Filmer som visas på biografer i Sverige just nu'
                : activeSectionTab === 'rent_buy'
                ? 'Nya biofilmer som nu finns att hyra eller köpa på Apple TV, SF Anytime, Viaplay m.fl.'
                : 'Populära filmer som ingår i ditt streamingabonnemang'}
            </p>
          </div>

          <div className="flex items-center justify-between md:justify-end gap-2.5 flex-shrink-0">
            {/* Switcher Tabs: Bioaktuella | Streama | Hyr & Köp */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0F1218] border border-[#2B3443]">
              <button
                type="button"
                onClick={() => setActiveSectionTab('theatrical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSectionTab === 'theatrical'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Ticket className="w-3.5 h-3.5" />
                <span>Bioaktuella</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionTab('flatrate')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSectionTab === 'flatrate'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Streama</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSectionTab('rent_buy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeSectionTab === 'rent_buy'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Hyr & Köp</span>
              </button>
            </div>

            {/* Scroll Buttons */}
            <div className="hidden md:flex items-center gap-1.5">
              <button
                type="button"
                onClick={scrollModeRowLeft}
                aria-label="Scrolla vänster"
                className="w-7 h-7 rounded-xl bg-[#0F1218] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={scrollModeRowRight}
                aria-label="Scrolla höger"
                className="w-7 h-7 rounded-xl bg-[#0F1218] hover:bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loadingStreamingTab && activeSectionTab === 'flatrate' ? (
          <div className="h-64 flex flex-col items-center justify-center gap-2 text-[#8D97A8]">
            <Loader2 className="w-6 h-6 animate-spin text-[#E9A23B]" />
            <span className="text-xs">Hämtar filmer...</span>
          </div>
        ) : (
          <div
            ref={modeRowRef}
            className="w-full max-w-full flex overflow-x-auto gap-3 sm:gap-4 pb-2 scrollbar-none snap-x snap-mandatory overscroll-x-contain"
          >
            {currentModeItems.map((item) => (
              <div
                key={`mode-${activeSectionTab}-${item.id}`}
                className="w-36 xs:w-40 sm:w-44 md:w-48 flex-shrink-0 snap-start"
              >
                <MediaCard item={item} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Kommande filmer */}
      {upcomingMovies.length > 0 && (
        <HorizontalMediaRow
          title="Kommande filmer"
          description="Biopremiärer och filmer som släpps snart"
          iconType="calendar"
          iconColor="text-[#E9A23B]"
          items={upcomingMovies}
          moreLink={{
            href: '/upcoming?tab=movies',
            label: 'Visa alla kommande',
          }}
        />
      )}

      {/* 5. Netflix-liknande kategorier (inklusive säsongsanpassad sektion) */}
      <div className="space-y-2">
        {curatedRows.map((row) => (
          <HorizontalMediaRow
            key={`movie-row-${row.id}`}
            title={row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 6. Utforska hela filmkatalogen med filter för Alla / Streama / Bioaktuella / Hyr & Köp + Genrer */}
      <div className="pt-6 border-t border-[#2B3443] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#8D97A8] uppercase tracking-wider">
            Filtrera filmkatalogen efter tillgänglighet
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setCatalogMonetization('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alla</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogMonetization('flatrate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'flatrate'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Streama</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogMonetization('theatrical')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'theatrical'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <Ticket className="w-3.5 h-3.5" />
              <span>Bioaktuella</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogMonetization('rent_buy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'rent_buy'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Hyr & Köp</span>
            </button>
          </div>
        </div>

        <ExploreFeed
          initialTrending={popularMovies}
          defaultMediaType="movie"
          title="Populära filmer"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={setSelectedProviderIds}
          externalMonetizationType={catalogMonetization}
          onExternalMonetizationChange={setCatalogMonetization}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
