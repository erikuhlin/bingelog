'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Loader2,
  Frown,
  LayoutGrid,
  List,
  Star,
  Film,
  Tv,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { MediaItem, MediaType, PersonSearchResult } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import MediaCard from './MediaCard';
import StatusSelector from './StatusSelector';
import ProviderFilterTabs from './ProviderFilterTabs';
import AdvancedFilterBar from './AdvancedFilterBar';
import { SWEDISH_STREAMING_PROVIDERS } from '@/lib/tmdb';

interface ExploreFeedProps {
  initialTrending: MediaItem[];
  defaultMediaType?: 'all' | MediaType;
  title?: string;
}

export default function ExploreFeed({
  initialTrending,
  defaultMediaType = 'all',
  title,
}: ExploreFeedProps) {
  const router = useRouter();
  const [selectedProviderIds, setSelectedProviderIds] = useState<number[]>([]);
  const [mediaType, setMediaType] = useState<'all' | MediaType>(defaultMediaType);
  const [genreId, setGenreId] = useState<number | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [year, setYear] = useState<number | null>(null);
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('popularity.desc');

  const [items, setItems] = useState<MediaItem[]>(initialTrending);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const storageKey = `bingelog_explore_state_${defaultMediaType}`;
  const isRestoredRef = useRef(false);

  // Restore feed state and scroll position on mount if returning from detail view
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && Array.isArray(saved.items) && saved.items.length > 0) {
          isRestoredRef.current = true;
          setItems(saved.items);
          setPage(saved.page || 1);
          setHasMore(saved.hasMore ?? true);
          if (saved.selectedProviderIds !== undefined) setSelectedProviderIds(Array.isArray(saved.selectedProviderIds) ? saved.selectedProviderIds : []);
          if (saved.mediaType !== undefined) setMediaType(saved.mediaType);
          if (saved.genreId !== undefined) setGenreId(saved.genreId);
          if (saved.minRating !== undefined) setMinRating(saved.minRating);
          if (saved.year !== undefined) setYear(saved.year);
          if (saved.originalLanguage !== undefined) setOriginalLanguage(saved.originalLanguage);
          if (saved.sortBy !== undefined) setSortBy(saved.sortBy);
          if (saved.viewMode !== undefined) setViewMode(saved.viewMode);

          const savedScroll =
            saved.scrollY ||
            (typeof window !== 'undefined'
              ? Number(sessionStorage.getItem(`bingelog_scroll_${window.location.pathname}`))
              : 0) ||
            0;

          if (savedScroll > 0) {
            requestAnimationFrame(() => {
              setTimeout(() => {
                window.scrollTo({ top: savedScroll, behavior: 'instant' });
              }, 40);
            });
          }
        }
      }
    } catch (err) {
      console.warn('Could not restore feed state:', err);
    }
  }, [storageKey]);

  // Continuously track scroll position throttled
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) return;
      timer = setTimeout(() => {
        timer = null;
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(`bingelog_scroll_${window.location.pathname}`, String(window.scrollY));
        }
      }, 150);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  const isFiltered =
    selectedProviderIds.length > 0 ||
    mediaType !== defaultMediaType ||
    genreId !== null ||
    minRating !== null ||
    year !== null ||
    originalLanguage !== null ||
    sortBy !== 'popularity.desc';

  // Persist explore feed state when items, filters, or pagination changes
  useEffect(() => {
    if (items.length === 0) return;
    try {
      const stateToSave = {
        items,
        page,
        hasMore,
        selectedProviderIds,
        mediaType,
        genreId,
        minRating,
        year,
        originalLanguage,
        sortBy,
        viewMode,
        scrollY: typeof window !== 'undefined' ? window.scrollY : 0,
      };
      sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
    } catch {
      // Ignore quota errors if storage full
    }
  }, [
    items,
    page,
    hasMore,
    selectedProviderIds,
    mediaType,
    genreId,
    minRating,
    year,
    originalLanguage,
    sortBy,
    viewMode,
    storageKey,
  ]);

  const activeFilterCount =
    (selectedProviderIds.length > 0 ? 1 : 0) +
    (mediaType !== defaultMediaType ? 1 : 0) +
    (genreId ? 1 : 0) +
    (minRating ? 1 : 0) +
    (year ? 1 : 0) +
    (originalLanguage ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  const handleReset = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(storageKey);
      sessionStorage.removeItem(`bingelog_scroll_${window.location.pathname}`);
    }
    setSelectedProviderIds([]);
    setMediaType(defaultMediaType);
    setGenreId(null);
    setMinRating(null);
    setYear(null);
    setOriginalLanguage(null);
    setSortBy('popularity.desc');
    setItems(initialTrending);
    setPage(1);
    setHasMore(true);
  };

  // Fetch initial or updated filters
  useEffect(() => {
    if (isRestoredRef.current) {
      isRestoredRef.current = false;
      return;
    }

    if (!isFiltered) {
      setItems(initialTrending);
      setPage(1);
      setHasMore(true);
      return;
    }

    let isMounted = true;
    const fetchFiltered = async () => {
      setLoading(true);
      setPage(1);
      try {
        const params = new URLSearchParams();
        if (mediaType !== 'all') params.set('mediaType', mediaType);
        if (selectedProviderIds.length > 0) params.set('providerIds', selectedProviderIds.join(','));
        if (genreId) params.set('genreId', String(genreId));
        if (minRating) params.set('minRating', String(minRating));
        if (year) params.set('year', String(year));
        if (originalLanguage) params.set('originalLanguage', originalLanguage);
        if (sortBy) params.set('sortBy', sortBy);
        params.set('page', '1');

        const res = await fetch(`/api/discover?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            const results = data.results || [];
            setItems(results);
            setHasMore(data.hasMore ?? results.length >= 10);
          }
        }
      } catch (err) {
        console.error('Failed to load discover items:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFiltered();

    return () => {
      isMounted = false;
    };
  }, [selectedProviderIds, mediaType, genreId, minRating, year, originalLanguage, sortBy, isFiltered, initialTrending]);

  // Load more pages
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      if (mediaType !== 'all') params.set('mediaType', mediaType);
      if (selectedProviderIds.length > 0) params.set('providerIds', selectedProviderIds.join(','));
      if (genreId) params.set('genreId', String(genreId));
      if (minRating) params.set('minRating', String(minRating));
      if (year) params.set('year', String(year));
      if (originalLanguage) params.set('originalLanguage', originalLanguage);
      if (sortBy) params.set('sortBy', sortBy);
      params.set('page', String(nextPage));

      const res = await fetch(`/api/discover?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const newResults: MediaItem[] = data.results || [];
        if (newResults.length > 0) {
          // Deduplicate by ID
          setItems((prev) => {
            const existingIds = new Set(prev.map((i) => `${i.media_type}-${i.id}`));
            const filteredNew = newResults.filter(
              (i) => !existingIds.has(`${i.media_type}-${i.id}`)
            );
            return [...prev, ...filteredNew];
          });
          setPage(nextPage);
          setHasMore(data.hasMore ?? newResults.length >= 10);
        } else {
          setHasMore(false);
        }
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Failed to load more items:', err);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  const selectedProviderNames = selectedProviderIds
    .map((id) => SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === id)?.name)
    .filter(Boolean) as string[];

  const getHeaderTitle = () => {
    const typeLabel = mediaType === 'movie' ? 'filmer' : mediaType === 'tv' ? 'serier' : 'titlar';
    const typePrefix =
      mediaType === 'movie'
        ? 'Populära filmer'
        : mediaType === 'tv'
        ? 'Populära serier'
        : 'Populärt';

    if (selectedProviderNames.length === 1) {
      return `${typePrefix} på ${selectedProviderNames[0]}`;
    }
    if (selectedProviderNames.length > 1) {
      return `${typePrefix} på ${selectedProviderNames.join(' & ')}`;
    }
    if (isFiltered) {
      if (
        mediaType !== defaultMediaType &&
        genreId === null &&
        minRating === null &&
        year === null &&
        originalLanguage === null &&
        sortBy === 'popularity.desc'
      ) {
        return `${typePrefix} på streaming`;
      }
      return `Filtrerade ${typeLabel}`;
    }
    return title || 'Populärt på streaming';
  };

  return (
    <section className="mb-14 space-y-6 w-full max-w-full overflow-hidden">
      {/* Streaming Provider Quick Tabs & Media Type Switcher */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#8D97A8] uppercase tracking-wider">
              Filtrera efter streamingtjänst
            </span>
            {selectedProviderNames.length > 0 && (
              <span className="text-xs font-semibold text-[#E9A23B] hidden sm:inline">
                • {selectedProviderNames.length === 1
                  ? selectedProviderNames[0]
                  : `${selectedProviderNames.slice(0, -1).join(', ')} och ${selectedProviderNames.at(-1)}`}
              </span>
            )}
          </div>

          {/* Quick Media Type Pills (Alla / Filmer / Serier) */}
          {defaultMediaType === 'all' && (
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#171C25] border border-[#2B3443] w-fit self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setMediaType('all')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'all'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Alla</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('movie')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'movie'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Filmer</span>
              </button>
              <button
                type="button"
                onClick={() => setMediaType('tv')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  mediaType === 'tv'
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Serier</span>
              </button>
            </div>
          )}
        </div>

        <ProviderFilterTabs
          selectedProviderIds={selectedProviderIds}
          onSelectProvider={setSelectedProviderIds}
        />
      </div>

      {/* Title & Results count & Action controls (Filter toggle + View Mode switcher on same row) */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <Sparkles className="w-5 h-5 text-[#E9A23B] flex-shrink-0" />
            <h2 className="text-base sm:text-xl md:text-2xl font-bold text-[#ECE9E3] tracking-tight truncate">
              {getHeaderTitle()}
            </h2>
            <span className="text-xs text-[#8D97A8] font-medium ml-1 flex-shrink-0">
              ({items.length} titlar)
            </span>
          </div>

          {/* Action buttons: Filter toggle & View Mode Switcher on the SAME row */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isFilterOpen || activeFilterCount > 0
                    ? 'bg-[#1E2531] text-[#ECE9E3] border-[#2B3443]'
                    : 'bg-[#171C25] text-[#8D97A8] border-[#2B3443] hover:text-[#ECE9E3]'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#E9A23B]" />
                <span>Fler filter & sortering</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#E9A23B] text-[#0F1218] text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleReset}
                  title="Återställ alla filter"
                  className="flex items-center gap-1.5 text-xs text-[#8D97A8] hover:text-[#E9A23B] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Återställ</span>
                </button>
              )}
            </div>

            {/* View Mode Switcher (Grid / List) */}
            <div className="flex items-center gap-1 bg-[#171C25] p-1 rounded-xl border border-[#2B3443] flex-shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Rutnätsvy"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#1E2531] text-[#E9A23B]'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="Listvy"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#1E2531] text-[#E9A23B]'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable filters box */}
        {isFilterOpen && (
          <AdvancedFilterBar
            mediaType={mediaType}
            onMediaTypeChange={setMediaType}
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
            onReset={handleReset}
            activeFilterCount={activeFilterCount}
            onPersonsChange={(persons) => {
              if (persons.length > 0) {
                const params = new URLSearchParams();
                params.set('person', persons.map((p) => p.id).join(','));
                if (mediaType !== 'all') params.set('type', mediaType);
                if (genreId) params.set('genre', String(genreId));
                if (minRating) params.set('minRating', String(minRating));
                if (year) params.set('year', String(year));
                if (originalLanguage) params.set('lang', originalLanguage);
                if (sortBy !== 'popularity.desc') params.set('sort', sortBy);
                router.push(`/search?${params.toString()}`);
              }
            }}
          />
        )}
      </div>

      {/* Content Grid / List / Loading */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#8D97A8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E9A23B]" />
          <span className="text-xs font-medium">Hämtar titlar från streamingtjänster...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-[#2B3443] rounded-3xl bg-[#171C25]/40">
          <Frown className="w-10 h-10 text-[#8D97A8] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#ECE9E3]">Inga titlar matchade dina filter</h3>
          <p className="text-xs text-[#8D97A8] max-w-sm mx-auto mt-1">
            Testa att sänka betyget eller byta streamingtjänst för att se fler resultat.
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-4 px-4 py-2 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] text-xs font-semibold transition-colors cursor-pointer"
          >
            Återställ filter
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid Layout (2 cols mobile, 3 cols sm, 4 cols md/lg) */
        <div className="space-y-8">
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 lg:gap-6">
            {items.map((item) => (
              <MediaCard key={`feed-grid-${item.media_type}-${item.id}`} item={item} />
            ))}
          </div>

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#171C25] hover:bg-[#1E2531] border border-[#2B3443] hover:border-[#E9A23B]/60 text-xs sm:text-sm font-bold text-[#ECE9E3] shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E9A23B]" />
                    <span>Laddar fler titlar...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E9A23B]" />
                    <span>Ladda fler titlar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* List Layout (Detailed rows) */
        <div className="space-y-3">
          {items.map((item) => {
            const year =
              item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
            const detailUrl = `/${item.media_type}/${item.id}`;

            return (
              <div
                key={`feed-list-${item.media_type}-${item.id}`}
                className="p-3 sm:p-4 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/40 transition-all flex items-center justify-between gap-3 sm:gap-4 shadow-sm"
              >
                {/* Poster & Details */}
                <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <Link
                    href={detailUrl}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem(`bingelog_scroll_${window.location.pathname}`, String(window.scrollY));
                      }
                    }}
                    className="relative w-14 sm:w-16 aspect-[2/3] rounded-xl overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0"
                  >
                    <img
                      src={getImageUrl(item.poster_path, 'w300')}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-[#8D97A8] uppercase">
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

                      {year && (
                        <span className="text-[10px] text-[#8D97A8] flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{year}</span>
                        </span>
                      )}

                      {item.vote_average > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-[#E9A23B] ml-1">
                          <Star className="w-3 h-3 fill-[#E9A23B]" />
                          <span>{item.vote_average.toFixed(1)}</span>
                        </span>
                      )}
                    </div>

                    <Link
                      href={detailUrl}
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          sessionStorage.setItem(`bingelog_scroll_${window.location.pathname}`, String(window.scrollY));
                        }
                      }}
                      className="block group"
                    >
                      <h4 className="text-sm font-bold text-[#ECE9E3] group-hover:text-[#E9A23B] transition-colors truncate">
                        {item.title}
                      </h4>
                    </Link>

                    {item.overview && (
                      <p className="text-xs text-[#8D97A8] line-clamp-1 mt-0.5 max-w-xl">
                        {item.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Status Selector action */}
                <div className="flex-shrink-0 w-28 sm:w-36">
                  <StatusSelector
                    tmdbId={item.id}
                    mediaType={item.media_type}
                    title={item.title}
                    posterPath={item.poster_path}
                    backdropPath={item.backdrop_path}
                  />
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-[#171C25] hover:bg-[#1E2531] border border-[#2B3443] hover:border-[#E9A23B]/60 text-xs sm:text-sm font-bold text-[#ECE9E3] shadow-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#E9A23B]" />
                    <span>Laddar fler titlar...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#E9A23B]" />
                    <span>Ladda fler titlar</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
