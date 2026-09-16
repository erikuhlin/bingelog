'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Bookmark,
  Eye,
  CheckCircle2,
  XCircle,
  Star,
  Search,
  Film,
  Tv,
  Sparkles,
  LayoutGrid,
  List,
  UserPlus,
} from 'lucide-react';
import {
  getUserMediaList,
  getAllWatchedEpisodesCount,
  markNextEpisodeWatched,
} from '@/lib/storage';
import { UserMediaRecord, WatchStatus, MediaType } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import { useAuth } from '@/context/AuthContext';
import BrandLogo from '@/components/BrandLogo';
import LibraryStatsHeader from '@/components/LibraryStatsHeader';
import ContinueWatchingRow, { SeriesMetaInfo } from '@/components/ContinueWatchingRow';
import StatusSelector from '@/components/StatusSelector';

type FilterStatus = 'all' | WatchStatus;
type FilterType = 'all' | MediaType;
type SortOption = 'updated' | 'rating' | 'title' | 'year';
type ViewMode = 'grid' | 'list';

function LibraryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [, startTransition] = useTransition();

  // Read state from URL search params
  const statusParam = (searchParams.get('status') as FilterStatus) || 'all';
  const typeParam = (searchParams.get('type') as FilterType) || 'all';
  const sortParam = (searchParams.get('sort') as SortOption) || 'updated';
  const viewParam = (searchParams.get('view') as ViewMode) || 'grid';
  const queryParam = searchParams.get('q') || '';

  const [items, setItems] = useState<UserMediaRecord[]>([]);
  const [totalEpisodesCount, setTotalEpisodesCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState(queryParam);
  const [seriesMeta, setSeriesMeta] = useState<Record<number, SeriesMetaInfo>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Helper to update URL query params
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all' || (key === 'sort' && val === 'updated') || (key === 'view' && val === 'grid')) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    startTransition(() => {
      const qs = params.toString();
      router.replace(`/library${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };

  // Load user collection and total watched episodes
  const loadData = async () => {
    try {
      const [mediaList, epCount] = await Promise.all([
        getUserMediaList(),
        getAllWatchedEpisodesCount(),
      ]);
      setItems(mediaList);
      setTotalEpisodesCount(epCount);

      // Fetch batch metadata for TV shows (especially watching shows)
      const tvIds = mediaList
        .filter((m) => m.media_type === 'tv')
        .map((m) => m.tmdb_id);

      if (tvIds.length > 0) {
        fetchSeriesMeta(tvIds);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeriesMeta = async (tvIds: number[]) => {
    try {
      const res = await fetch(`/api/library/series-cache?ids=${tvIds.join(',')}`);
      if (res.ok) {
        const json = await res.json();
        const results = json.results || {};
        const metaMap: Record<number, SeriesMetaInfo> = {};

        Object.entries(results).forEach(([idStr, data]: [string, any]) => {
          const id = parseInt(idStr, 10);
          const s1 = data.seasons?.find((s: any) => s.season_number === 1) || data.seasons?.[0];
          metaMap[id] = {
            episode_count: s1?.episode_count || 10,
            runtime: data.runtime || 45,
            status: data.status,
            next_air_date: data.next_episode_to_air?.air_date || null,
          };
        });

        setSeriesMeta((prev) => ({ ...prev, ...metaMap }));
      }
    } catch (e) {
      console.warn('Could not fetch series cache:', e);
    }
  };

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      setItems([]);
      return;
    }
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('bingelog_storage_changed', handleStorageChange);
    return () => window.removeEventListener('bingelog_storage_changed', handleStorageChange);
  }, [user]);

  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  const handleMarkNextWatched = async (
    show: UserMediaRecord,
    nextSeason: number,
    nextEpisode: number
  ) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => {
        if (item.tmdb_id === show.tmdb_id && item.media_type === 'tv') {
          return {
            ...item,
            current_season: nextSeason,
            current_episode: nextEpisode,
            status: 'watching',
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    setTotalEpisodesCount((prev) => prev + 1);

    const meta = seriesMeta[show.tmdb_id];
    const isEnded = meta?.status === 'Ended';
    try {
      await markNextEpisodeWatched(show.tmdb_id, nextSeason, nextEpisode, isEnded);
    } catch (err) {
      console.error('Error marking episode watched:', err);
      loadData();
    }
  };

  let totalRuntimeMinutes = 0;
  items.forEach((m) => {
    if (m.media_type === 'movie' && (m.status === 'completed' || m.status === 'watching')) {
      totalRuntimeMinutes += m.runtime || 110;
    }
  });
  totalRuntimeMinutes += totalEpisodesCount * 45;

  // Filtering
  const filtered = items.filter((item) => {
    if (statusParam !== 'all' && item.status !== statusParam) return false;
    if (typeParam !== 'all' && item.media_type !== typeParam) return false;
    if (searchQuery.trim() && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    if (sortParam === 'rating') {
      return (b.user_rating || 0) - (a.user_rating || 0);
    }
    if (sortParam === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortParam === 'year') {
      return b.tmdb_id - a.tmdb_id;
    }
    return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
  });

  // Counts for tabs
  const counts = {
    all: items.length,
    watching: items.filter((i) => i.status === 'watching').length,
    watchlist: items.filter((i) => i.status === 'watchlist').length,
    completed: items.filter((i) => i.status === 'completed').length,
    dropped: items.filter((i) => i.status === 'dropped').length,
  };

  if (authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-[#8D97A8]">
        <div className="w-8 h-8 border-2 border-[#E9A23B] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Laddar bibliotek...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto py-8 sm:py-16 px-4 text-center">
        {/* Brand & Badge */}
        <div className="flex flex-col items-center mb-8">
          <BrandLogo size="lg" className="mb-4 shadow-xl shadow-[#E9A23B]/10" />
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1E2531] border border-[#2B3443] text-xs font-semibold text-[#E9A23B] mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Konto krävs för biblioteket</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-[#ECE9E3] tracking-tight">
            Ditt personliga film- och seriebibliotek
          </h1>
          <p className="text-sm sm:text-base text-[#8D97A8] max-w-xl mt-3 leading-relaxed">
            Skapa ett gratis konto för att hålla koll på sedda avsnitt, spara dina filmer & serier och se direkt vilka streamingtjänster dina titlar finns på.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] shadow-lg shadow-[#E9A23B]/20 transition-all transform active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Skapa gratis konto</span>
          </button>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-semibold text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443] transition-colors cursor-pointer"
          >
            Redan medlem? Logga in
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left mb-10">
          <div className="p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[#1E2531] text-[#E9A23B] flex items-center justify-center mb-3.5">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#ECE9E3] mb-1">Avsnittsspårare</h3>
            <p className="text-xs text-[#8D97A8] leading-relaxed">
              Markera sedda avsnitt med ett klick. Bingelog vet alltid vilket avsnitt du ska se härnäst.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[#1E2531] text-[#6FA98A] flex items-center justify-center mb-3.5">
              <Tv className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#ECE9E3] mb-1">Streamingkoll</h3>
            <p className="text-xs text-[#8D97A8] leading-relaxed">
              Se direkt vilka svenska tjänster som Netflix, Viaplay, Max och SVT som visar just dina sparade titlar.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] flex flex-col">
            <div className="w-10 h-10 rounded-xl bg-[#1E2531] text-[#ECE9E3] flex items-center justify-center mb-3.5">
              <Bookmark className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-[#ECE9E3] mb-1">Molnsynkat & säkert</h3>
            <p className="text-xs text-[#8D97A8] leading-relaxed">
              Dina listor sparas tryggt i molnet och finns till hands oavsett om du använder mobil, surfplatta eller dator.
            </p>
          </div>
        </div>

        {/* Free explore link */}
        <p className="text-xs text-[#8D97A8]">
          Vill du bara kika runt först?{' '}
          <Link href="/" className="text-[#E9A23B] hover:underline font-medium">
            Utforska filmer & serier fritt utan konto →
          </Link>
        </p>
      </div>
    );
  }

  const displayName = user?.user_metadata?.username || user?.email?.split('@')[0];

  return (
    <div className="space-y-8 pb-16">
      {/* 1. Header with Stats */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-2.5">
              <Bookmark className="w-7 h-7 text-[#E9A23B]" />
              <span>{displayName}s bibliotek</span>
            </h1>
            <p className="text-sm text-[#8D97A8] mt-1">
              Din samling, dina sedda avsnitt och din historik samlad på ett ställe.
            </p>
          </div>
        </div>

        {/* 3 Key Stats Numbers */}
        <LibraryStatsHeader
          totalTitles={counts.all}
          totalWatchedEpisodes={totalEpisodesCount}
          totalRuntimeMinutes={totalRuntimeMinutes}
        />
      </div>

      {/* 2. "Fortsätt titta" — Horizontal Row */}
      <ContinueWatchingRow
        items={items}
        seriesMeta={seriesMeta}
        onMarkNextWatched={handleMarkNextWatched}
      />

      {/* 3. The Collection — Filterable List & Grid */}
      <section aria-label="Samlingen">
        {/* Status Tabs (role="tablist" / role="tab") */}
        <div
          role="tablist"
          aria-label="Statusfilter"
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-[#2B3443]"
        >
          {[
            { id: 'all', label: 'Alla', count: counts.all, icon: Sparkles },
            { id: 'watching', label: 'Tittar på', count: counts.watching, icon: Eye },
            { id: 'watchlist', label: 'Vill se', count: counts.watchlist, icon: Bookmark },
            { id: 'completed', label: 'Har sett', count: counts.completed, icon: CheckCircle2 },
            { id: 'dropped', label: 'Avbrutna', count: counts.dropped, icon: XCircle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = statusParam === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                onClick={() => updateUrl({ status: tab.id })}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all focus-visible:ring-2 focus-visible:ring-[#E9A23B] focus-visible:outline-none ${
                  isSelected
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 font-bold'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#171C25]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                    isSelected ? 'bg-[#0F1218]/20 text-[#0F1218] font-black' : 'bg-[#1E2531] text-[#8D97A8]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Toolbar: Search, Type filter, Sort, View Toggle */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#8D97A8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateUrl({ q: e.target.value || null });
                }}
                placeholder="Sök i biblioteket..."
                className="w-full bg-[#171C25] border border-[#2B3443] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none focus:border-[#E9A23B] focus-visible:ring-1 focus-visible:ring-[#E9A23B]"
              />
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-[#171C25] p-0.5 rounded-xl border border-[#2B3443]">
              <button
                type="button"
                onClick={() => updateUrl({ type: 'all' })}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  typeParam === 'all' ? 'bg-[#1E2531] text-[#ECE9E3] font-semibold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                Alla typer
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ type: 'tv' })}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                  typeParam === 'tv' ? 'bg-[#1E2531] text-[#ECE9E3] font-semibold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3 h-3 text-sky-400" />
                <span>Serier</span>
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ type: 'movie' })}
                className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-colors ${
                  typeParam === 'movie' ? 'bg-[#1E2531] text-[#ECE9E3] font-semibold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Film className="w-3 h-3 text-[#E9A23B]" />
                <span>Filmer</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[#8D97A8] hidden sm:inline">Sortera:</span>
              <select
                value={sortParam}
                onChange={(e) => updateUrl({ sort: e.target.value })}
                className="bg-[#171C25] border border-[#2B3443] rounded-xl px-2.5 py-1 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B]"
              >
                <option value="updated">Senast uppdaterad</option>
                <option value="rating">Mitt betyg (högst)</option>
                <option value="title">Titel (A–Ö)</option>
              </select>
            </div>

            {/* View Mode Toggle (Grid vs List) */}
            <div className="flex items-center gap-1 bg-[#171C25] p-0.5 rounded-xl border border-[#2B3443]">
              <button
                type="button"
                aria-pressed={viewParam === 'grid'}
                aria-label="Rutnätsvy"
                onClick={() => updateUrl({ view: 'grid' })}
                className={`p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#E9A23B] ${
                  viewParam === 'grid' ? 'bg-[#1E2531] text-[#E9A23B]' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
                title="Rutnät"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                aria-pressed={viewParam === 'list'}
                aria-label="Listvy"
                onClick={() => updateUrl({ view: 'list' })}
                className={`p-1.5 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#E9A23B] ${
                  viewParam === 'list' ? 'bg-[#1E2531] text-[#E9A23B]' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
                title="Lista"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Display: Grid or List */}
        <div className="mt-6" id={`panel-${statusParam}`} role="tabpanel">
          {sorted.length === 0 ? (
            /* Empty state */
            <div className="py-20 text-center border border-dashed border-[#2B3443] rounded-3xl bg-[#171C25]/40 px-4">
              <Bookmark className="w-10 h-10 text-[#8D97A8] mx-auto mb-2.5" />
              <h3 className="text-base font-bold text-[#ECE9E3]">Inget här ännu</h3>
              <p className="text-xs text-[#8D97A8] max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'Inga sparade titlar matchade din sökning.'
                  : 'Lägg till titlar från Utforska för att hålla koll på vad du vill se eller titta på.'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold transition-colors focus-visible:ring-2 focus-visible:ring-[#E9A23B]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Utforska titlar</span>
              </Link>
            </div>
          ) : viewParam === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5">
              {sorted.map((item) => {
                const isTv = item.media_type === 'tv';
                const curSeason = item.current_season || 1;
                const curEp = item.current_episode || 0;
                const meta = seriesMeta[item.tmdb_id];
                const totalInSeason = meta?.episode_count || item.total_episodes_in_season || 10;
                const progressPct = isTv && curEp > 0 ? Math.min(100, Math.round((curEp / totalInSeason) * 100)) : 0;

                return (
                  <div
                    key={`${item.media_type}-${item.tmdb_id}`}
                    className="group relative flex flex-col bg-[#171C25] rounded-2xl border border-[#2B3443] overflow-hidden hover:border-[#E9A23B]/60 transition-all shadow-sm"
                  >
                    {/* Poster */}
                    <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0F1218]">
                      <Link href={`/${item.media_type}/${item.tmdb_id}`} className="block w-full h-full">
                        <img
                          src={getImageUrl(item.poster_path, 'w500')}
                          alt={item.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </Link>

                      {/* Status indicator badge (top-right) */}
                      <div className="absolute top-2 right-2 pointer-events-none">
                        {item.status === 'watching' && isTv && curEp > 0 ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#E9A23B] text-[#0F1218] text-[10px] font-black tracking-tight shadow-md">
                            S{curSeason} A{curEp}
                          </span>
                        ) : item.status === 'completed' ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#6FA98A] text-[#0F1218] text-[10px] font-bold shadow-md">
                            Sedd
                          </span>
                        ) : item.status === 'dropped' ? (
                          <span className="px-1.5 py-0.5 rounded-md bg-[#1E2531] text-[#8D97A8] border border-[#2B3443] text-[10px] font-semibold">
                            Avbruten
                          </span>
                        ) : null}
                      </div>

                      {/* Progress bar at the bottom of the poster */}
                      {isTv && progressPct > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#0F1218]/90 overflow-hidden">
                          <div
                            className="h-full bg-[#E9A23B] transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Meta info & Rating */}
                    <div className="p-2.5 sm:p-3 flex flex-col flex-1 justify-between gap-1.5">
                      <div>
                        <Link
                          href={`/${item.media_type}/${item.tmdb_id}`}
                          className="font-bold text-xs text-[#ECE9E3] line-clamp-2 hover:text-[#E9A23B] transition-colors leading-snug"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8D97A8]">
                          <span className="capitalize">{item.media_type === 'movie' ? 'Film' : 'Serie'}</span>
                          {item.user_rating && (
                            <span className="flex items-center gap-0.5 text-[#E9A23B] font-semibold">
                              <Star className="w-3 h-3 fill-[#E9A23B]" />
                              <span>{item.user_rating}/10</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-1 border-t border-[#2B3443]/50">
                        <StatusSelector
                          tmdbId={item.tmdb_id}
                          mediaType={item.media_type}
                          title={item.title}
                          posterPath={item.poster_path}
                          backdropPath={item.backdrop_path}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="border border-[#2B3443] rounded-2xl overflow-hidden bg-[#171C25] divide-y divide-[#2B3443]/60">
              {sorted.map((item) => {
                const isTv = item.media_type === 'tv';
                const curSeason = item.current_season || 1;
                const curEp = item.current_episode || 0;
                const meta = seriesMeta[item.tmdb_id];
                const totalInSeason = meta?.episode_count || item.total_episodes_in_season || 10;
                const epsLeft = Math.max(0, totalInSeason - curEp);

                return (
                  <div
                    key={`list-${item.media_type}-${item.tmdb_id}`}
                    className="p-3 sm:p-4 flex items-center justify-between gap-4 hover:bg-[#1E2531]/60 transition-colors"
                  >
                    {/* Left: Thumbnail & Title */}
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <Link
                        href={`/${item.media_type}/${item.tmdb_id}`}
                        className="w-10 sm:w-12 aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1218] flex-shrink-0 border border-[#2B3443]"
                      >
                        <img
                          src={getImageUrl(item.poster_path, 'w300')}
                          alt={item.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </Link>

                      <div className="min-w-0">
                        <Link
                          href={`/${item.media_type}/${item.tmdb_id}`}
                          className="font-bold text-xs sm:text-sm text-[#ECE9E3] hover:text-[#E9A23B] transition-colors truncate block"
                        >
                          {item.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8D97A8]">
                          <span className="capitalize">{item.media_type === 'movie' ? 'Film' : 'Serie'}</span>
                          {item.user_rating && (
                            <span className="flex items-center gap-0.5 text-[#E9A23B] font-semibold">
                              <Star className="w-3 h-3 fill-[#E9A23B]" />
                              <span>{item.user_rating}/10</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Position (Hidden on small screens) */}
                    <div className="hidden md:block w-36 text-xs text-[#ECE9E3] text-left">
                      {isTv ? (
                        curEp > 0 ? (
                          <span>
                            S{curSeason} A{curEp} <span className="text-[#8D97A8]">·</span> {epsLeft} kvar
                          </span>
                        ) : (
                          <span className="text-[#8D97A8]">Ej påbörjad</span>
                        )
                      ) : (
                        <span className="text-[#8D97A8]">—</span>
                      )}
                    </div>

                    {/* Right: Status selector */}
                    <div className="w-36 sm:w-44 flex-shrink-0">
                      <StatusSelector
                        tmdbId={item.tmdb_id}
                        mediaType={item.media_type}
                        title={item.title}
                        posterPath={item.poster_path}
                        backdropPath={item.backdrop_path}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-[#8D97A8]">Laddar bibliotek...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
