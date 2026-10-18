'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Film,
  Tv,
  Ticket,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { MediaItem, MovieMonetizationFilter } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS, filterUpcomingByProviders } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

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
  const [catalogMonetization, setCatalogMonetization] = useState<MovieMonetizationFilter>('all');

  const [filteredPopular, setFilteredPopular] = useState<MediaItem[]>(popularMovies);
  const [filteredRentBuy, setFilteredRentBuy] = useState<MediaItem[]>(rentBuyMovies);
  const [filteredCuratedRows, setFilteredCuratedRows] = useState<CuratedCategoryRow[]>(curatedRows);
  const [loadingSections, setLoadingSections] = useState(false);

  // Restore saved provider filter from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('bingelog_selected_providers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedProviderIds(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSelectProviders = (ids: number[]) => {
    setSelectedProviderIds(ids);
    try {
      if (ids.length > 0) {
        sessionStorage.setItem('bingelog_selected_providers', JSON.stringify(ids));
      } else {
        sessionStorage.removeItem('bingelog_selected_providers');
      }
    } catch {
      // ignore
    }
  };

  const selectedProviderNames = useMemo(
    () =>
      selectedProviderIds
        .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
        .filter(Boolean) as string[],
    [selectedProviderIds]
  );

  const providerLabel =
    selectedProviderNames.length === 1
      ? selectedProviderNames[0]
      : selectedProviderNames.length === 2
      ? `${selectedProviderNames[0]} & ${selectedProviderNames[1]}`
      : selectedProviderNames.length > 2
      ? `${selectedProviderNames.slice(0, 2).join(', ')} +${selectedProviderNames.length - 2}`
      : '';

  // When user selects streaming providers at the top, update ALL movie sections on the page
  useEffect(() => {
    if (selectedProviderIds.length === 0) {
      setFilteredPopular(popularMovies);
      setFilteredRentBuy(rentBuyMovies);
      setFilteredCuratedRows(curatedRows);
      setLoadingSections(false);
      return;
    }

    let isMounted = true;
    const fetchMovieSections = async () => {
      setLoadingSections(true);
      try {
        const params = new URLSearchParams();
        params.set('pageType', 'movies');
        params.set('providerIds', selectedProviderIds.join(','));

        const res = await fetch(`/api/page-sections?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFilteredPopular(data.popularMovies || []);
            setFilteredRentBuy(data.rentBuyMovies || []);
            setFilteredCuratedRows(data.curatedRows || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch filtered movie sections:', err);
      } finally {
        if (isMounted) {
          setLoadingSections(false);
        }
      }
    };

    fetchMovieSections();
    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, popularMovies, rentBuyMovies, curatedRows]);

  const isFilteredByProvider = selectedProviderIds.length > 0;

  // Upcoming movies filtered by selected providers
  const activeUpcomingMovies = useMemo(
    () => filterUpcomingByProviders(upcomingMovies, selectedProviderIds),
    [upcomingMovies, selectedProviderIds]
  );

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Välj dina streamingtjänster för att filtrera samtliga filmsektioner och genrer, eller visa allt inklusive bioaktuella filmer och hyr/köp.
        </p>
      </div>

      {/* 1. Top Streaming Service Filter (Controls the ENTIRE movies page) */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/85 border border-[#2B3443] space-y-3 shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Tv className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-[#ECE9E3] tracking-tight">
              Filtrera sidan efter dina streamingtjänster
            </span>
            {selectedProviderNames.length > 0 ? (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E9A23B]/15 border border-[#E9A23B]/40 text-[#E9A23B] flex items-center gap-1.5">
                {loadingSections && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Visar: {selectedProviderNames.join(', ')}</span>
              </span>
            ) : (
              <span className="text-xs text-[#8D97A8] hidden sm:inline">
                • Visar nyheter, bio, hyr/köp och alla genrer från samtliga tjänster
              </span>
            )}
          </div>

          {selectedProviderIds.length > 0 && (
            <button
              type="button"
              onClick={() => handleSelectProviders([])}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-xs font-semibold text-[#ECE9E3] hover:text-[#E9A23B] transition-colors flex-shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Visa alla tjänster</span>
            </button>
          )}
        </div>

        <ProviderFilterTabs
          selectedProviderIds={selectedProviderIds}
          onSelectProvider={handleSelectProviders}
        />
      </div>

      {/* 2. Top Horizontal Row: "Nya filmer på streaming" */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="movie"
      />

      {/* 3. Horizontal Row: "Populära filmer" (reacts to selected streaming services) */}
      {filteredPopular.length > 0 && (
        <HorizontalMediaRow
          title={
            isFilteredByProvider
              ? `Populära filmer på ${providerLabel}`
              : 'Populära filmer just nu'
          }
          description={
            isFilteredByProvider
              ? `De mest streamade och populära filmerna just nu på ${selectedProviderNames.join(', ')}`
              : 'Filmerna som flest tittar på just nu i Sverige'
          }
          iconType="sparkles"
          iconColor="text-[#E9A23B]"
          items={filteredPopular}
        />
      )}

      {/* 4. Horizontal Row: "Bioaktuella filmer" - Visas som default, försvinner när man filtrerar på streamingtjänster */}
      {!isFilteredByProvider && theatricalMovies.length > 0 && (
        <HorizontalMediaRow
          title="Bioaktuella filmer just nu"
          description="Filmer som visas på biografer i Sverige just nu"
          badge="På bio"
          iconType="film"
          iconColor="text-[#E9A23B]"
          items={theatricalMovies}
        />
      )}

      {/* 5. Horizontal Row: "Nytt att hyra & köpa" - Visas som default eller om vald tjänst har hyr/köp */}
      {filteredRentBuy.length > 0 && (
        <HorizontalMediaRow
          title={
            isFilteredByProvider
              ? `Hyr & köp på ${providerLabel}`
              : 'Nytt att hyra & köpa digitalt'
          }
          description={
            isFilteredByProvider
              ? `Nya filmer tillgängliga att hyra eller köpa på ${selectedProviderNames.join(', ')}`
              : 'Nya biofilmer som nu finns att hyra eller köpa på Apple TV, Prime Video, Viaplay, SF Anytime m.fl.'
          }
          badge="Hyr & Köp"
          iconType="film"
          iconColor="text-sky-400"
          items={filteredRentBuy}
        />
      )}

      {/* 6. Kommande filmer (filtreras efter valda tjänster) */}
      {activeUpcomingMovies.length > 0 && (
        <HorizontalMediaRow
          title={
            isFilteredByProvider
              ? `Kommande filmer på ${providerLabel}`
              : 'Kommande filmer'
          }
          description={
            isFilteredByProvider
              ? `Kommande filmer på ${selectedProviderNames.join(', ')}`
              : 'Biopremiärer och filmer som släpps snart'
          }
          iconType="calendar"
          iconColor="text-[#E9A23B]"
          items={activeUpcomingMovies}
          moreLink={{
            href: '/upcoming?tab=movies',
            label: 'Visa alla kommande',
          }}
        />
      )}

      {/* 7. Samtliga genre- & kategorisektioner (anpassas dynamiskt till valda streamingtjänster!) */}
      <div className={`space-y-2 transition-opacity duration-200 ${loadingSections ? 'opacity-60' : 'opacity-100'}`}>
        {filteredCuratedRows.map((row) => (
          <HorizontalMediaRow
            key={`movie-row-${row.id}`}
            title={isFilteredByProvider ? `${row.title} • ${providerLabel}` : row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 8. Utforska hela filmkatalogen med filter för Alla / Streama / Bioaktuella / Hyr & Köp + Genrer */}
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
            {!isFilteredByProvider && (
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
            )}
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
          onExternalProviderChange={handleSelectProviders}
          externalMonetizationType={catalogMonetization}
          onExternalMonetizationChange={setCatalogMonetization}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
