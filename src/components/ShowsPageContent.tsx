'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Tv, RotateCcw, Loader2 } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { CuratedCategoryRow } from '@/lib/seasonal';
import { SWEDISH_STREAMING_PROVIDERS, filterUpcomingByProviders } from '@/lib/tmdb';
import ProviderFilterTabs from './ProviderFilterTabs';
import StreamingNewsRow from './StreamingNewsRow';
import UpcomingShowsSection from './UpcomingShowsSection';
import HorizontalMediaRow from './HorizontalMediaRow';
import ExploreFeed from './ExploreFeed';

interface ShowsPageContentProps {
  popularShows: MediaItem[];
  initialNewReleases: MediaItem[];
  upcomingSeasons: MediaItem[];
  upcomingNewShows: MediaItem[];
  curatedRows: CuratedCategoryRow[];
}

export default function ShowsPageContent({
  popularShows,
  initialNewReleases,
  upcomingSeasons,
  upcomingNewShows,
  curatedRows,
}: ShowsPageContentProps) {
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [filteredPopular, setFilteredPopular] = useState<MediaItem[]>(popularShows);
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

  // When user selects streaming providers at the top, update ALL series sections on the page
  useEffect(() => {
    if (selectedProviderIds.length === 0) {
      setFilteredPopular(popularShows);
      setFilteredCuratedRows(curatedRows);
      setLoadingSections(false);
      return;
    }

    let isMounted = true;
    const fetchShowSections = async () => {
      setLoadingSections(true);
      try {
        const params = new URLSearchParams();
        params.set('pageType', 'shows');
        params.set('providerIds', selectedProviderIds.join(','));

        const res = await fetch(`/api/page-sections?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setFilteredPopular(data.popularShows || []);
            setFilteredCuratedRows(data.curatedRows || []);
          }
        }
      } catch (err) {
        console.error('Failed to fetch filtered show sections:', err);
      } finally {
        if (isMounted) {
          setLoadingSections(false);
        }
      }
    };

    fetchShowSections();
    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, popularShows, curatedRows]);

  const isFilteredByProvider = selectedProviderIds.length > 0;

  const activeUpcomingSeasons = useMemo(
    () => filterUpcomingByProviders(upcomingSeasons, selectedProviderIds),
    [upcomingSeasons, selectedProviderIds]
  );

  const activeUpcomingNewShows = useMemo(
    () => filterUpcomingByProviders(upcomingNewShows, selectedProviderIds),
    [upcomingNewShows, selectedProviderIds]
  );

  return (
    <div className="space-y-8 sm:space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Tv className="w-7 h-7 sm:w-8 sm:h-8 text-[#6FA98A]" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Välj dina streamingtjänster för att filtrera samtliga seriesektioner, nya säsonger och genrer efter det du abonnerar på.
        </p>
      </div>

      {/* 1. Top Streaming Service Filter (Controls the ENTIRE shows page) */}
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
                • Visar nyheter, kommande och alla genrer från samtliga tjänster
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

      {/* 2. Top Horizontal Row: "Nya serier & säsonger på streaming" */}
      <StreamingNewsRow
        initialItems={initialNewReleases}
        selectedProviderIds={selectedProviderIds}
        defaultMediaType="tv"
      />

      {/* 3. Horizontal Row: "Populära & trendande serier" (reacts to selected streaming services) */}
      {filteredPopular.length > 0 && (
        <HorizontalMediaRow
          title={
            isFilteredByProvider
              ? `Populärt & trendar på ${providerLabel}`
              : 'Populära & trendande serier'
          }
          description={
            isFilteredByProvider
              ? `De mest streamade och omtalade serierna just nu på ${selectedProviderNames.join(', ')}`
              : 'Serierna som flest tittar på och pratar om just nu'
          }
          iconType="sparkles"
          iconColor="text-[#E9A23B]"
          items={filteredPopular}
        />
      )}

      {/* 4. Kommande serier & nya säsonger (filtreras efter valda tjänster) */}
      <UpcomingShowsSection
        upcomingSeasons={activeUpcomingSeasons}
        upcomingNewShows={activeUpcomingNewShows}
      />

      {/* 5. Samtliga genre- & kategorisektioner (anpassas dynamiskt till valda streamingtjänster!) */}
      <div className={`space-y-2 transition-opacity duration-200 ${loadingSections ? 'opacity-60' : 'opacity-100'}`}>
        {filteredCuratedRows.map((row) => (
          <HorizontalMediaRow
            key={`show-row-${row.id}`}
            title={isFilteredByProvider ? `${row.title} • ${providerLabel}` : row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 6. Main Series Catalog synced with top streaming selector */}
      <div className="pt-4 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={popularShows}
          defaultMediaType="tv"
          title="Utforska serier"
          externalProviderIds={selectedProviderIds}
          onExternalProviderChange={handleSelectProviders}
          hideProviderTabs={true}
        />
      </div>
    </div>
  );
}
