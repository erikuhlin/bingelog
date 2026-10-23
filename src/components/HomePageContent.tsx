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
import HeroCarousel from './HeroCarousel';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import ContinueWatchingSection from './ContinueWatchingSection';
import ForYouSection from './ForYouSection';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';
import AdvancedFilterBar from './AdvancedFilterBar';
import { getCachedPageSections, setCachedPageSections } from '@/lib/scrollRestoration';

interface HomePageContentProps {
  carouselItems: MediaItem[];
  trendingList: MediaItem[];
  initialNewReleases: MediaItem[];
  theatricalMovies: MediaItem[];
  initialRentBuyMovies: MediaItem[];
  initialUpcoming: MediaItem[];
  initialCuratedRows: CuratedCategoryRow[];
  popularCombined: MediaItem[];
}

export default function HomePageContent({
  carouselItems,
  trendingList,
  initialNewReleases,
  theatricalMovies,
  initialRentBuyMovies,
  initialUpcoming,
  initialCuratedRows,
  popularCombined,
}: HomePageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [homeMode, setHomeMode] = useState<'all' | 'movie' | 'tv' | 'theatrical' | 'rent_buy'>('all');
  const [genreId, setGenreId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [filteredTrending, setFilteredTrending] = useState<MediaItem[]>([]);
  const [filteredRentBuy, setFilteredRentBuy] = useState<MediaItem[]>(initialRentBuyMovies);
  const [filteredCuratedRows, setFilteredCuratedRows] = useState<CuratedCategoryRow[]>(initialCuratedRows);
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
    // If user picks a streaming provider while in theatrical mode, switch mode to 'all'
    if (ids.length > 0 && homeMode === 'theatrical') {
      setHomeMode('all');
    }
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

  // Fetch all page sections filtered by selectedProviderIds when providers change
  useEffect(() => {
    if (selectedProviderIds.length === 0) {
      setFilteredTrending([]);
      setFilteredRentBuy(initialRentBuyMovies);
      setFilteredCuratedRows(initialCuratedRows);
      setLoadingSections(false);
      return;
    }

    const cacheKey = `home_${selectedProviderIds.slice().sort().join(',')}`;
    const cached = getCachedPageSections(cacheKey);
    if (cached) {
      setFilteredTrending(cached.trending || []);
      setFilteredRentBuy(cached.rentBuyMovies || []);
      setFilteredCuratedRows(cached.curatedRows || []);
      setLoadingSections(false);
      return;
    }

    let isMounted = true;
    const fetchSections = async () => {
      setLoadingSections(true);
      try {
        const params = new URLSearchParams();
        params.set('pageType', 'home');
        params.set('providerIds', selectedProviderIds.join(','));

        const res = await fetch(`/api/page-sections?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setCachedPageSections(cacheKey, data);
          if (isMounted) {
            setFilteredTrending(data.trending || []);
            setFilteredRentBuy(data.rentBuyMovies || []);
            setFilteredCuratedRows(data.curatedRows || []);
          }
        }
      } catch (err) {
        console.error('Failed to load filtered home sections:', err);
      } finally {
        if (isMounted) {
          setLoadingSections(false);
        }
      }
    };

    fetchSections();
    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, initialRentBuyMovies, initialCuratedRows]);

  const isFilteredByProvider = selectedProviderIds.length > 0;

  // Trending row items
  const activeTrendingList = useMemo(() => {
    if (!isFilteredByProvider) return trendingList;
    return filteredTrending;
  }, [isFilteredByProvider, filteredTrending, trendingList]);

  // Upcoming items filtered by selected providers
  const activeUpcoming = useMemo(
    () => filterUpcomingByProviders(initialUpcoming, selectedProviderIds),
    [initialUpcoming, selectedProviderIds]
  );

  const effectiveMediaType: 'all' | 'movie' | 'tv' =
    homeMode === 'tv'
      ? 'tv'
      : homeMode === 'movie' || homeMode === 'theatrical' || homeMode === 'rent_buy'
      ? 'movie'
      : 'all';

  const effectiveMonetization: MovieMonetizationFilter =
    homeMode === 'theatrical' ? 'theatrical' : homeMode === 'rent_buy' ? 'rent_buy' : 'all';

  const isTheatricalMode = homeMode === 'theatrical';
  const isRentBuyMode = homeMode === 'rent_buy';

  const activeFilterCount =
    (genreId ? 1 : 0) +
    (minRating ? 1 : 0) +
    (year ? 1 : 0) +
    (originalLanguage ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  const hasAnyFilterActive =
    activeFilterCount > 0 || selectedProviderIds.length > 0 || homeMode !== 'all';

  const handleResetAllFilters = () => {
    setSelectedProviderIds([]);
    setHomeMode('all');
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

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* 1. Hero Carousel (#1–#5) */}
      {carouselItems.length > 0 && <HeroCarousel items={carouselItems} />}

      {/* 2. Top Unified Filter Card (All filter types gathered in one logical place right under hero) */}
      <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/85 border border-[#2B3443] space-y-3.5 shadow-lg backdrop-blur-sm">
        {/* Row 1: Mode/Availability Tabs (Alla / Filmer / Serier / Bioaktuella / Hyr & Köp) + More Filters & Reset */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 bg-[#0F1218] rounded-2xl border border-[#2B3443] overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setHomeMode('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                homeMode === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Alla</span>
            </button>
            <button
              type="button"
              onClick={() => setHomeMode('movie')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                homeMode === 'movie'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <Film className="w-3.5 h-3.5" />
              <span>Filmer</span>
            </button>
            <button
              type="button"
              onClick={() => setHomeMode('tv')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                homeMode === 'tv'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Serier</span>
            </button>
            {!isFilteredByProvider && (
              <button
                type="button"
                onClick={() => setHomeMode('theatrical')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  homeMode === 'theatrical'
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
              onClick={() => setHomeMode('rent_buy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                homeMode === 'rent_buy'
                  ? 'bg-[#E9A23B] text-[#0F1218] shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Hyr & Köp</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-[#E9A23B]/10 border-[#E9A23B] text-[#E9A23B]'
                  : 'bg-[#1E2531] border-[#2B3443] text-[#8D97A8] hover:text-[#ECE9E3]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
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
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer"
                title="Återställ alla filter"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Återställ</span>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Streaming Services or Theatrical notice */}
        {isTheatricalMode ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl bg-[#0F1218] border border-[#2B3443]">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#ECE9E3]">
              <Ticket className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
              <span>
                Visar filmer som går på svenska biografer just nu.{' '}
                <span className="text-[#8D97A8]">
                  (Biograffilmer är inte kopplade till streamingtjänster.)
                </span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setHomeMode('all')}
              className="text-xs font-bold text-[#E9A23B] hover:underline self-start sm:self-auto cursor-pointer"
            >
              Visa alla / streaming
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1 border-t border-[#2B3443]/60">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                <Tv className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-[#ECE9E3] tracking-tight">
                  Filtrera efter dina streamingtjänster
                </span>
                {selectedProviderNames.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E9A23B]/15 border border-[#E9A23B]/40 text-[#E9A23B] flex items-center gap-1.5">
                    {loadingSections && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>Valda: {selectedProviderNames.join(', ')}</span>
                  </span>
                ) : (
                  <span className="text-xs text-[#8D97A8] hidden sm:inline">
                    • Visar innehåll från alla tjänster
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
                  <span>Rensa tjänster</span>
                </button>
              )}
            </div>

            <ProviderFilterTabs
              selectedProviderIds={selectedProviderIds}
              onSelectProvider={handleSelectProviders}
            />
          </div>
        )}

        {/* Row 3: Expandable Advanced Filter Bar (Genre, betyg, år, sortering, svenskt m.m.) */}
        {isFilterOpen && (
          <div className="pt-3 border-t border-[#2B3443] animate-fadeIn">
            <AdvancedFilterBar
              mediaType={effectiveMediaType}
              onMediaTypeChange={(type) => {
                if (type === 'all') setHomeMode('all');
                else if (type === 'movie') setHomeMode('movie');
                else if (type === 'tv') setHomeMode('tv');
              }}
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
          </div>
        )}
      </div>

      {/* Mode-specific or Full Feed Sections */}
      {isTheatricalMode ? (
        /* Theatrical mode only */
        <div className="space-y-8 sm:space-y-10">
          {theatricalMovies.length > 0 && (
            <HorizontalMediaRow
              rowId="home_theatrical"
              title="Bioaktuella filmer just nu"
              description="Filmer som visas på biografer i Sverige just nu"
              badge="På bio"
              iconType="film"
              iconColor="text-[#E9A23B]"
              items={theatricalMovies}
            />
          )}
        </div>
      ) : isRentBuyMode ? (
        /* Rent & Buy mode only */
        <div className="space-y-8 sm:space-y-10">
          {filteredRentBuy.length > 0 && (
            <HorizontalMediaRow
              rowId="home_rent_buy"
              title={
                isFilteredByProvider
                  ? `Hyr & köp på ${providerLabel}`
                  : 'Nytt att hyra & köpa digitalt'
              }
              description={
                isFilteredByProvider
                  ? `Nya filmer att hyra eller köpa på ${selectedProviderNames.join(', ')}`
                  : 'Nya biofilmer som nu finns att hyra eller köpa på Apple TV, Prime Video, Viaplay, SF Anytime m.fl.'
              }
              badge="Hyr & Köp"
              iconType="film"
              iconColor="text-sky-400"
              items={filteredRentBuy}
            />
          )}
        </div>
      ) : (
        /* Standard overview (All, Movies or Series) */
        <div className="space-y-8 sm:space-y-10">
          {/* 3. "Nyheter på streaming" - Horizontal side-scroll */}
          <StreamingNewsRow
            key={`news-row-${effectiveMediaType}-${selectedProviderIds.join(',')}`}
            initialItems={initialNewReleases}
            selectedProviderIds={selectedProviderIds}
            defaultMediaType={effectiveMediaType}
          />

          {/* 4. "Tittar på" - Active Series with progress bar for user */}
          {homeMode !== 'movie' && <ContinueWatchingSection />}

          {/* 5. "För dig" - Personalized Recommendations (Adapts to selected providers!) */}
          <ForYouSection selectedProviderIds={selectedProviderIds} />

          {/* 6. "Trendar i veckan" / "Populärt på valda tjänster" */}
          {activeTrendingList.length > 0 && (
            <HorizontalMediaRow
              rowId="home_trending"
              title={
                isFilteredByProvider
                  ? `Trendar & populärt på ${providerLabel}`
                  : 'Trendar i veckan'
              }
              description={
                isFilteredByProvider
                  ? `Mest populära titlar just nu på ${selectedProviderNames.join(', ')}`
                  : 'De mest omtalade och populära titlarna den här veckan'
              }
              iconType="sparkles"
              iconColor="text-[#E9A23B]"
              items={activeTrendingList}
            />
          )}

          {/* 7. "Bioaktuella filmer" - Visas som default, försvinner när man filtrerar på streamingtjänster eller väljer endast serier */}
          {!isFilteredByProvider && homeMode !== 'tv' && theatricalMovies.length > 0 && (
            <HorizontalMediaRow
              rowId="home_theatrical"
              title="Bioaktuella filmer just nu"
              description="Filmer som går på svenska biografer just nu"
              badge="På bio"
              iconType="film"
              iconColor="text-[#E9A23B]"
              items={theatricalMovies}
            />
          )}

          {/* 8. "Nytt att hyra & köpa" - Visas om inte endast serier är valt */}
          {homeMode !== 'tv' && filteredRentBuy.length > 0 && (
            <HorizontalMediaRow
              rowId="home_rent_buy"
              title={
                isFilteredByProvider
                  ? `Hyr & köp på ${providerLabel}`
                  : 'Nytt att hyra & köpa digitalt'
              }
              description={
                isFilteredByProvider
                  ? `Nya filmer att hyra eller köpa på ${selectedProviderNames.join(', ')}`
                  : 'Nya biofilmer som nu finns att hyra eller köpa på Apple TV, Prime Video, Viaplay, SF Anytime m.fl.'
              }
              badge="Hyr & Köp"
              iconType="film"
              iconColor="text-sky-400"
              items={filteredRentBuy}
            />
          )}

          {/* 9. "Kommande premiärer" - Filtreras efter valda streamingtjänster */}
          {activeUpcoming.length > 0 && (
            <HorizontalMediaRow
              rowId="home_upcoming"
              title={
                isFilteredByProvider
                  ? `Kommande på ${providerLabel}`
                  : 'Kommande premiärer'
              }
              description={
                isFilteredByProvider
                  ? `Kommande filmer, serier och säsonger på ${selectedProviderNames.join(', ')}`
                  : 'Efterlängtade filmer, nya serier och säsonger som släpps snart'
              }
              iconType="calendar"
              iconColor="text-[#E9A23B]"
              items={activeUpcoming}
              moreLink={{
                href: '/upcoming',
                label: 'Visa alla kommande',
              }}
            />
          )}

          {/* 10. Samtliga genre- & kategorisektioner (anpassas dynamiskt efter valda streamingtjänster) */}
          <div className={`space-y-2 transition-opacity duration-200 ${loadingSections ? 'opacity-60' : 'opacity-100'}`}>
            {filteredCuratedRows.map((row) => (
              <HorizontalMediaRow
                key={`home-row-${row.id}`}
                rowId={`home_curated_${row.id}`}
                title={isFilteredByProvider ? `${row.title} • ${providerLabel}` : row.title}
                description={row.description}
                badge={row.badge}
                iconType={row.iconType}
                iconColor={row.iconColor}
                items={row.items}
              />
            ))}
          </div>
        </div>
      )}

      {/* 11. Utforska hela katalogen längst ner */}
      <div className="pt-8 sm:pt-10 mt-8 sm:mt-10 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={popularCombined}
          defaultMediaType="all"
          title="Utforska hela katalogen"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={handleSelectProviders}
          externalMediaType={effectiveMediaType}
          onExternalMediaTypeChange={(type) => {
            if (type === 'all' && homeMode !== 'theatrical' && homeMode !== 'rent_buy') setHomeMode('all');
            else if (type === 'movie') setHomeMode('movie');
            else if (type === 'tv') setHomeMode('tv');
          }}
          externalMonetizationType={effectiveMonetization}
          onExternalMonetizationChange={(m) => {
            if (m === 'theatrical') setHomeMode('theatrical');
            else if (m === 'rent_buy') setHomeMode('rent_buy');
            else if (m === 'all' || m === 'flatrate') setHomeMode('all');
          }}
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
