'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Calendar,
  Film,
  Tv,
  Layers,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  Clock,
  ArrowUpDown,
  Filter,
  Check,
  X,
} from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getMediaGenreNames } from '@/lib/tmdb';
import MediaCard from './MediaCard';

interface UpcomingHubClientProps {
  upcomingMovies: MediaItem[];
  upcomingSeasons: MediaItem[];
  upcomingNewShows: MediaItem[];
}

type TabType = 'all' | 'movies' | 'shows' | 'seasons' | 'new_shows';
type TimeFilter = 'all' | 'this_month' | 'next_month' | 'later';

export default function UpcomingHubClient({
  upcomingMovies,
  upcomingSeasons,
  upcomingNewShows,
}: UpcomingHubClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Read initial tab from URL ?tab=...
  const tabParam = searchParams.get('tab') as TabType | null;
  const initialTab: TabType =
    tabParam && ['all', 'movies', 'shows', 'seasons', 'new_shows'].includes(tabParam)
      ? tabParam
      : 'all';

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortOrder, setSortOrder] = useState<'date_asc' | 'popularity'>('date_asc');

  // Keep state in sync with URL
  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (newTab: TabType) => {
    setActiveTab(newTab);
    const params = new URLSearchParams(window.location.search);
    if (newTab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', newTab);
    }
    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  };

  // Combine items according to active tab
  const tabItems = useMemo(() => {
    switch (activeTab) {
      case 'movies':
        return upcomingMovies;
      case 'seasons':
        return upcomingSeasons;
      case 'new_shows':
        return upcomingNewShows;
      case 'shows':
        return [...upcomingSeasons, ...upcomingNewShows];
      case 'all':
      default:
        return [...upcomingMovies, ...upcomingSeasons, ...upcomingNewShows];
    }
  }, [activeTab, upcomingMovies, upcomingSeasons, upcomingNewShows]);

  // Date filtering logic
  const now = useMemo(() => new Date(), []);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredItems = useMemo(() => {
    let result = tabItems;

    // 1. Text search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.original_title?.toLowerCase().includes(q)
      );
    }

    // 2. Timeframe filter
    if (timeFilter !== 'all') {
      result = result.filter((item) => {
        if (!item.upcoming_date) return false;
        const d = new Date(item.upcoming_date);
        if (isNaN(d.getTime())) return false;

        const itemMonth = d.getMonth();
        const itemYear = d.getFullYear();

        if (timeFilter === 'this_month') {
          return itemMonth === currentMonth && itemYear === currentYear;
        }

        if (timeFilter === 'next_month') {
          const nextMonth = (currentMonth + 1) % 12;
          const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
          return itemMonth === nextMonth && itemYear === nextYear;
        }

        if (timeFilter === 'later') {
          // Beyond next month
          const threshold = new Date(currentYear, currentMonth + 2, 1).getTime();
          return d.getTime() >= threshold;
        }

        return true;
      });
    }

    // 3. Sorting
    result = [...result].sort((a, b) => {
      if (sortOrder === 'popularity') {
        return (b.popularity || 0) - (a.popularity || 0);
      }
      // date_asc
      const dateA = a.upcoming_date ? new Date(a.upcoming_date).getTime() : Infinity;
      const dateB = b.upcoming_date ? new Date(b.upcoming_date).getTime() : Infinity;
      return dateA - dateB;
    });

    return result;
  }, [tabItems, searchQuery, timeFilter, sortOrder, currentMonth, currentYear]);

  // Format countdown relative label
  const getCountdownLabel = (dateStr?: string | null) => {
    if (!dateStr) return null;
    try {
      const target = new Date(dateStr).getTime();
      const diffMs = target - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays <= 0) return 'Premiär idag!';
      if (diffDays === 1) return 'Imorgon';
      if (diffDays < 7) return `Om ${diffDays} dagar`;
      if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `Om ${weeks} ${weeks === 1 ? 'vecka' : 'veckor'}`;
      }
      const months = Math.floor(diffDays / 30);
      return `Om ${months} ${months === 1 ? 'månad' : 'månader'}`;
    } catch {
      return null;
    }
  };

  const totalAll = upcomingMovies.length + upcomingSeasons.length + upcomingNewShows.length;

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2B3443] pb-4">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-1">
          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 font-bold'
                : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Alla kommande</span>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'all'
                  ? 'bg-black/20 text-[#0F1218]'
                  : 'bg-[#0F1218] text-[#8D97A8]'
              }`}
            >
              {totalAll}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('movies')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'movies'
                ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 font-bold'
                : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
            }`}
          >
            <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Kommande filmer</span>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'movies'
                  ? 'bg-black/20 text-[#0F1218]'
                  : 'bg-[#0F1218] text-[#8D97A8]'
              }`}
            >
              {upcomingMovies.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('seasons')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'seasons'
                ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 font-bold'
                : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Nya säsonger</span>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'seasons'
                  ? 'bg-black/20 text-[#0F1218]'
                  : 'bg-[#0F1218] text-[#8D97A8]'
              }`}
            >
              {upcomingSeasons.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('new_shows')}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'new_shows'
                ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 font-bold'
                : 'bg-[#171C25] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443]'
            }`}
          >
            <Tv className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Nya serier</span>
            <span
              className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'new_shows'
                  ? 'bg-black/20 text-[#0F1218]'
                  : 'bg-[#0F1218] text-[#8D97A8]'
              }`}
            >
              {upcomingNewShows.length}
            </span>
          </button>
        </div>

        {/* View Mode Switcher */}
        <div className="hidden sm:flex items-center gap-1 bg-[#171C25] border border-[#2B3443] p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-[#1E2531] text-[#ECE9E3]'
                : 'text-[#8D97A8] hover:text-[#ECE9E3]'
            }`}
            title="Rutnät"
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#1E2531] text-[#ECE9E3]'
                : 'text-[#8D97A8] hover:text-[#ECE9E3]'
            }`}
            title="Lista"
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#171C25]/80 p-3 rounded-2xl border border-[#2B3443]">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-[#8D97A8] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Sök bland kommande titlar..."
            className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none focus:border-[#E9A23B]/60"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D97A8] hover:text-[#ECE9E3]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Timeframe pill filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs text-[#8D97A8] font-medium mr-1 hidden lg:inline">Tidsperiod:</span>
          {(
            [
              { id: 'all', label: 'Alla datum' },
              { id: 'this_month', label: 'Denna månad' },
              { id: 'next_month', label: 'Nästa månad' },
              { id: 'later', label: 'Längre fram' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTimeFilter(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                timeFilter === t.id
                  ? 'bg-[#E9A23B]/20 text-[#E9A23B] border border-[#E9A23B]/40 font-semibold'
                  : 'bg-[#0F1218] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Sort Order Selector */}
        <div className="flex items-center gap-2">
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as any)}
            className="bg-[#0F1218] border border-[#2B3443] text-xs text-[#ECE9E3] rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#E9A23B]/60 cursor-pointer"
          >
            <option value="date_asc">Premiärdatum (snabbast först)</option>
            <option value="popularity">Popularitet (mest efterlängtade)</option>
          </select>
        </div>
      </div>

      {/* Results Count & active filter tag */}
      <div className="flex items-center justify-between text-xs text-[#8D97A8]">
        <div>
          Visar <span className="text-[#ECE9E3] font-semibold">{filteredItems.length}</span> kommande{' '}
          {activeTab === 'movies'
            ? 'filmer'
            : activeTab === 'seasons'
            ? 'säsonger'
            : activeTab === 'new_shows'
            ? 'nya serier'
            : 'titlar'}
        </div>
        {(searchQuery || timeFilter !== 'all') && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setTimeFilter('all');
            }}
            className="text-[#E9A23B] hover:underline cursor-pointer"
          >
            Rensa filter
          </button>
        )}
      </div>

      {/* Grid or List View */}
      {filteredItems.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredItems.map((item) => (
              <div
                key={`upcoming-hub-${item.media_type}-${item.id}-${item.upcoming_season || 'main'}`}
                className="relative group"
              >
                <MediaCard item={item} />
                {/* Countdown chip and release service badge underneath */}
                <div className="mt-1 flex items-center justify-between text-[11px] text-[#8D97A8] gap-1">
                  {item.upcoming_date && (
                    <span className="flex items-center gap-1 text-[#E9A23B] font-medium truncate">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{getCountdownLabel(item.upcoming_date)}</span>
                    </span>
                  )}
                  {item.release_service && (
                    <span className="text-[10px] font-semibold text-[#ECE9E3] bg-[#1E2531] border border-[#2B3443] px-1.5 py-0.2 rounded truncate max-w-[100px]" title={item.release_service}>
                      {item.release_service}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List Mode */
          <div className="space-y-2.5">
            {filteredItems.map((item) => {
              const countdown = getCountdownLabel(item.upcoming_date);
              const genreNames = getMediaGenreNames(item, 2);
              return (
                <div
                  key={`upcoming-list-${item.media_type}-${item.id}-${item.upcoming_season || 'main'}`}
                  className="bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/40 rounded-2xl p-3 sm:p-4 flex items-center gap-4 transition-all"
                >
                  <div className="w-16 sm:w-20 aspect-[2/3] rounded-xl overflow-hidden bg-[#0F1218] flex-shrink-0 border border-[#2B3443]">
                    <img
                      src={
                        item.poster_path
                          ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                          : '/placeholder-poster.svg'
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#1E2531] border border-[#2B3443] text-[#ECE9E3]">
                        {item.media_type === 'movie' ? 'Film' : 'Serie'}
                      </span>
                      {genreNames.length > 0 && (
                        <span className="text-[10px] text-[#8D97A8] font-medium hidden sm:inline">
                          • {genreNames.join(', ')}
                        </span>
                      )}
                      {item.upcoming_label && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9A23B]/15 border border-[#E9A23B]/30 text-[#E9A23B]">
                          {item.upcoming_label}
                        </span>
                      )}
                      {item.release_service && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#1E2531] border border-[#2B3443] text-[#ECE9E3] flex items-center gap-1">
                          <Tv className="w-3 h-3 text-[#E9A23B]" />
                          <span>{item.release_service}</span>
                        </span>
                      )}
                      {countdown && (
                        <span className="text-[11px] font-semibold text-[#6FA98A] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {countdown}
                        </span>
                      )}
                    </div>

                    <a
                      href={`/${item.media_type}/${item.id}`}
                      className="text-base sm:text-lg font-bold text-[#ECE9E3] hover:text-[#E9A23B] transition-colors truncate block"
                    >
                      {item.title}
                    </a>

                    {item.overview && (
                      <p className="text-xs text-[#8D97A8] line-clamp-2 mt-1">
                        {item.overview}
                      </p>
                    )}
                  </div>

                  <div className="flex-shrink-0">
                    <a
                      href={`/${item.media_type}/${item.id}`}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-xs font-semibold text-[#ECE9E3] border border-[#2B3443] transition-colors"
                    >
                      Detaljer
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-[#171C25]/50 border border-[#2B3443] rounded-3xl p-8">
          <Calendar className="w-12 h-12 text-[#8D97A8] mx-auto mb-3 opacity-60" />
          <h3 className="text-base sm:text-lg font-bold text-[#ECE9E3]">
            Inga kommande titlar matchade filtret
          </h3>
          <p className="text-xs sm:text-sm text-[#8D97A8] mt-1 max-w-md mx-auto">
            Testa att välja en annan tidsperiod eller rensa din sökning för att se fler premiärer.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setTimeFilter('all');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-[#E9A23B] text-[#0F1218] text-xs font-bold hover:bg-[#F2B04E] transition-colors cursor-pointer"
          >
            Återställ filter
          </button>
        </div>
      )}
    </div>
  );
}
