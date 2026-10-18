'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tv, RotateCcw, Loader2 } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS, filterUpcomingByProviders } from '@/lib/tmdb';
import HeroCarousel from './HeroCarousel';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import ContinueWatchingSection from './ContinueWatchingSection';
import ForYouSection from './ForYouSection';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

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

  // Hero items: if filtered by provider, show top items with backdrop from selected providers
  const activeHeroItems = useMemo(() => {
    if (!isFilteredByProvider) return carouselItems;
    const withBackdrop = filteredTrending.filter((i) => i.backdrop_path);
    return withBackdrop.length > 0 ? withBackdrop.slice(0, 5) : carouselItems;
  }, [isFilteredByProvider, filteredTrending, carouselItems]);

  // Trending row items
  const activeTrendingList = useMemo(() => {
    if (!isFilteredByProvider) return trendingList;
    return filteredTrending.length > 5 ? filteredTrending.slice(5) : filteredTrending;
  }, [isFilteredByProvider, filteredTrending, trendingList]);

  // Upcoming items filtered by selected providers
  const activeUpcoming = useMemo(
    () => filterUpcomingByProviders(initialUpcoming, selectedProviderIds),
    [initialUpcoming, selectedProviderIds]
  );

  return (
    <div className="w-full max-w-full overflow-hidden">
      {/* 1. Top-level Streaming Service Filter (Controls the ENTIRE page) */}
      <div className="mb-6 sm:mb-8 p-3.5 sm:p-5 rounded-3xl bg-[#171C25]/85 border border-[#2B3443] backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-3">
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
                • Visar nyheter, bio, hyr/köp och genrer från samtliga tjänster
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

      {/* 2. Hero Carousel (#1–#5) */}
      {activeHeroItems.length > 0 && <HeroCarousel items={activeHeroItems} />}

      {/* 3. "Nyheter på streaming" - Horizontal side-scroll */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="all"
      />

      {/* 4. "Tittar på" - Active Series with progress bar for user */}
      <ContinueWatchingSection />

      {/* 5. "För dig" - Personalized Recommendations (Adapts to selected providers!) */}
      <ForYouSection selectedProviderIds={selectedProviderIds} />

      {/* 6. "Trendar i veckan" / "Populärt på valda tjänster" */}
      {activeTrendingList.length > 0 && (
        <HorizontalMediaRow
          title={
            isFilteredByProvider
              ? `Trendar & populärt på ${providerLabel}`
              : 'Trendar i veckan'
          }
          description={
            isFilteredByProvider
              ? `Mest populära filmer och serier just nu på ${selectedProviderNames.join(', ')}`
              : 'De mest omtalade och populära titlarna den här veckan'
          }
          iconType="sparkles"
          iconColor="text-[#E9A23B]"
          items={activeTrendingList}
        />
      )}

      {/* 7. "Bioaktuella filmer" - Visas som default, försvinner när man filtrerar på streamingtjänster */}
      {!isFilteredByProvider && theatricalMovies.length > 0 && (
        <HorizontalMediaRow
          title="Bioaktuella filmer just nu"
          description="Filmer som går på svenska biografer just nu"
          badge="På bio"
          iconType="film"
          iconColor="text-[#E9A23B]"
          items={theatricalMovies}
        />
      )}

      {/* 8. "Nytt att hyra & köpa" - Visas som default eller om vald tjänst har hyr/köp (Apple TV, Prime Video, Viaplay) */}
      {filteredRentBuy.length > 0 && (
        <HorizontalMediaRow
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
            title={isFilteredByProvider ? `${row.title} • ${providerLabel}` : row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 11. Utforska hela katalogen längst ner */}
      <div className="pt-6 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={popularCombined}
          defaultMediaType="all"
          title="Utforska hela katalogen"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={handleSelectProviders}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
