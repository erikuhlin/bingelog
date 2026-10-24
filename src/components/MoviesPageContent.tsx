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
  SlidersHorizontal,
} from 'lucide-react';
import { MediaItem, MovieMonetizationFilter } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS, filterUpcomingByProviders } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';
import AdvancedFilterBar from './AdvancedFilterBar';
import { getCachedPageSections, setCachedPageSections } from '@/lib/scrollRestoration';

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
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = sessionStorage.getItem('bingelog_selected_providers');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });
  const [catalogMonetization, setCatalogMonetization] = useState<MovieMonetizationFilter>('all');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const initialProviderKey = selectedProviderIds.length > 0 ? `movies_${selectedProviderIds.slice().sort().join(',')}` : '';
  const initialCached = initialProviderKey ? getCachedPageSections(initialProviderKey) : null;

  const [filteredPopular, setFilteredPopular] = useState<MediaItem[]>(() => initialCached?.popularMovies || popularMovies);
  const [filteredRentBuy, setFilteredRentBuy] = useState<MediaItem[]>(() => initialCached?.rentBuyMovies || rentBuyMovies);
  const [filteredCuratedRows, setFilteredCuratedRows] = useState<CuratedCategoryRow[]>(() => initialCached?.curatedRows || curatedRows);
  const [loadingSections, setLoadingSections] = useState(false);

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

    const cacheKey = `movies_${selectedProviderIds.slice().sort().join(',')}`;
    const cached = getCachedPageSections(cacheKey);
    if (cached) {
      setFilteredPopular(cached.popularMovies || []);
      setFilteredRentBuy(cached.rentBuyMovies || []);
      setFilteredCuratedRows(cached.curatedRows || []);
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
          setCachedPageSections(cacheKey, data);
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

  const activeFilterCount =
    (genreId ? 1 : 0) +
    (minRating ? 1 : 0) +
    (year ? 1 : 0) +
    (originalLanguage ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  const hasAnyFilterActive =
    activeFilterCount > 0 || selectedProviderIds.length > 0 || catalogMonetization !== 'all';

  const handleResetAllFilters = () => {
    setSelectedProviderIds([]);
    setCatalogMonetization('all');
    setGenreId(null);
    setMinRating(null);
    setYear(null);
    setOriginalLanguage(null);
    setSortBy('popularity.desc');
    setIsFilterOpen(false);
    try {
      sessionStorage.removeItem('bingelog_selected_providers');
    } catch {
      // ignore
    }
  };

  const isTheatricalMode = catalogMonetization === 'theatrical';
  const isRentBuyMode = catalogMonetization === 'rent_buy';
  const isStreamingOnly = catalogMonetization === 'flatrate' || isFilteredByProvider;

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Välj hur du vill titta (bio, hyr/köp eller streaming) och filtrera på dina favorittjänster och genrer på ett och samma ställe.
        </p>
      </div>

      {/* 1. Unified Filter Control Card (All types of filtering gathered in one place) */}
      <div className="p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/85 border border-[#2B3443] space-y-3.5 shadow-lg backdrop-blur-sm">
        {/* Row 1: Mode/Availability Tabs (Alla / Streama / Bioaktuella / Hyr & Köp) + More Filters & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#0F1218] rounded-2xl border border-[#2B3443] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setCatalogMonetization('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alla filmer</span>
            </button>
            <button
              type="button"
              onClick={() => setCatalogMonetization('flatrate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                catalogMonetization === 'flatrate'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
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
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
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
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Hyr & Köp</span>
            </button>
          </div>

          {/* Right Action buttons: Fler filter toggle + Reset */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-[#1E2531] text-[#ECE9E3] border-[#E9A23B]/60 shadow-sm'
                  : 'bg-[#0F1218] text-[#8D97A8] border-[#2B3443] hover:text-[#ECE9E3]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Fler filter</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#E9A23B] text-[#0F1218] text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasAnyFilterActive && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-xs font-semibold text-[#8D97A8] hover:text-[#E9A23B] transition-colors flex-shrink-0 cursor-pointer"
                title="Återställ alla filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Återställ</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Streaming Services Pills (or Info Banner when Bioaktuella is chosen) */}
        {!isTheatricalMode ? (
          <div className="space-y-1.5 pt-1 border-t border-[#2B3443]/50">
            <div className="flex items-center justify-between text-xs text-[#8D97A8] font-medium">
              <span className="flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-[#E9A23B]" />
                <span>
                  {isRentBuyMode ? 'Filtrera på tjänster med hyr/köp:' : 'Filtrera på dina streamingtjänster:'}
                </span>
              </span>
              {selectedProviderNames.length > 0 && (
                <span className="text-[#E9A23B] font-bold text-[11px]">
                  {loadingSections ? 'Uppdaterar sektioner...' : `Visar: ${selectedProviderNames.join(', ')}`}
                </span>
              )}
            </div>
            <ProviderFilterTabs
              selectedProviderIds={selectedProviderIds}
              onSelectProvider={handleSelectProviders}
            />
          </div>
        ) : (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#0F1218]/60 border border-[#2B3443] text-xs text-[#8D97A8]">
            <div className="flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#E9A23B]" />
              <span>Visar filmer som går på svenska biografer just nu.</span>
            </div>
            <button
              type="button"
              onClick={() => setCatalogMonetization('flatrate')}
              className="text-[#E9A23B] hover:underline font-semibold cursor-pointer"
            >
              Växla till streaming
            </button>
          </div>
        )}

        {/* Expandable Advanced Filter Bar (Genre, Rating, Year, Sorting, Language) */}
        {isFilterOpen && (
          <AdvancedFilterBar
            mediaType="movie"
            onMediaTypeChange={() => {}}
            genreId={genreId}
            onGenreChange={setGenreId}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            year={year}
            onYearChange={setYear}
            originalLanguage={originalLanguage}
            onOriginalLanguageChange={setOriginalLanguage}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onReset={() => {
              setGenreId(null);
              setMinRating(null);
              setYear(null);
              setOriginalLanguage(null);
              setSortBy('popularity.desc');
            }}
            activeFilterCount={activeFilterCount}
          />
        )}
      </div>

      {/* When in Theatrical mode: Highlight bio films directly */}
      {isTheatricalMode && (
        <>
          {theatricalMovies.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_theatrical"
              title="Bioaktuella filmer just nu"
              description="Filmer som visas på biografer i Sverige just nu"
              badge="På bio"
              iconType="film"
              iconColor="text-[#E9A23B]"
              items={theatricalMovies}
            />
          )}
        </>
      )}

      {/* When in Rent/Buy mode: Highlight digital rent & buy directly */}
      {isRentBuyMode && (
        <>
          {filteredRentBuy.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_rent_buy"
              title={isFilteredByProvider ? `Hyr & köp på ${providerLabel}` : 'Nytt att hyra & köpa digitalt'}
              description={
                isFilteredByProvider
                  ? `Nya filmer tillgängliga att hyra eller köpa på ${selectedProviderNames.join(', ')}`
                  : 'Nya filmer tillgängliga att hyra eller köpa på Apple TV, Prime Video, Viaplay m.fl.'
              }
              badge="Hyr & Köp"
              iconType="film"
              iconColor="text-sky-400"
              items={filteredRentBuy}
            />
          )}
        </>
      )}

      {/* When in All or Streaming mode: Show regular streaming rows */}
      {!isTheatricalMode && !isRentBuyMode && (
        <>
          {/* 2. Top Horizontal Row: "Nya filmer på streaming" */}
          <StreamingNewsRow
            initialItems={initialNewReleases}
            selectedProviderIds={selectedProviderIds}
            defaultMediaType="movie"
          />

          {/* 3. Horizontal Row: "Populära filmer" */}
          {filteredPopular.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_popular"
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

          {/* 4. Horizontal Row: "Bioaktuella filmer" - Visas endast om ej filtrerat på abonnemangstjänst och läget är Alla */}
          {!isStreamingOnly && theatricalMovies.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_theatrical"
              title="Bioaktuella filmer just nu"
              description="Filmer som visas på biografer i Sverige just nu"
              badge="På bio"
              iconType="film"
              iconColor="text-[#E9A23B]"
              items={theatricalMovies}
            />
          )}

          {/* 5. Horizontal Row: "Nytt att hyra & köpa" */}
          {!isStreamingOnly && filteredRentBuy.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_rent_buy"
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

          {/* 6. Kommande filmer */}
          {activeUpcomingMovies.length > 0 && (
            <HorizontalMediaRow
              rowId="movies_upcoming"
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

          {/* 7. Samtliga genre- & kategorisektioner */}
          <div className={`space-y-2 transition-opacity duration-200 ${loadingSections ? 'opacity-60' : 'opacity-100'}`}>
            {filteredCuratedRows.map((row) => (
              <HorizontalMediaRow
                key={`movie-row-${row.id}`}
                rowId={`movies_curated_${row.id}`}
                title={isFilteredByProvider ? `${row.title} • ${providerLabel}` : row.title}
                description={row.description}
                badge={row.badge}
                iconType={row.iconType}
                iconColor={row.iconColor}
                items={row.items}
              />
            ))}
          </div>
        </>
      )}

      {/* 8. Utforska hela filmkatalogen synkad med toppfiltren */}
      <div className="pt-6 border-t border-[#2B3443] space-y-4">
        <ExploreFeed
          initialTrending={popularMovies}
          defaultMediaType="movie"
          title={
            isTheatricalMode
              ? 'Bioaktuella filmer'
              : isRentBuyMode
              ? 'Hyr- & köpfilmer'
              : isFilteredByProvider
              ? `Filmer på ${providerLabel}`
              : 'Utforska filmer'
          }
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={handleSelectProviders}
          externalMonetizationType={catalogMonetization}
          onExternalMonetizationChange={setCatalogMonetization}
          externalGenreId={genreId}
          onExternalGenreChange={setGenreId}
          externalMinRating={minRating}
          onExternalMinRatingChange={setMinRating}
          externalYear={year}
          onExternalYearChange={setYear}
          externalSortBy={sortBy}
          onExternalSortChange={setSortBy}
          externalOriginalLanguage={originalLanguage}
          onExternalOriginalLanguageChange={setOriginalLanguage}
          hideProviderTabs={true}
          hideFilterBar={true}
        />
      </div>
    </div>
  );
}
