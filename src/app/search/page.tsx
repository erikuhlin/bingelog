'use client';

import React, { useState, useEffect, Suspense, useTransition, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  User,
  Film,
  Tv,
  Star,
  SlidersHorizontal,
  Loader2,
  ArrowLeft,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  getPersonDetails,
  getPersonCombinedCredits,
  searchMedia,
  getImageUrl,
} from '@/lib/tmdb';
import { MediaItem, PersonDetails, PersonSearchResult, MediaType } from '@/lib/types';
import MediaCard from '@/components/MediaCard';
import AdvancedFilterBar from '@/components/AdvancedFilterBar';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // URL parameters
  const queryParam = searchParams.get('q') || '';
  const personParam = searchParams.get('person') || '';
  const genreParam = searchParams.get('genre') ? parseInt(searchParams.get('genre')!, 10) : null;
  const ratingParam = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : null;
  const yearParam = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : null;
  const langParam = searchParams.get('lang') || null;
  const typeParam = (searchParams.get('type') as 'all' | MediaType) || 'all';
  const sortParam = searchParams.get('sort') || 'popularity.desc';
  const isAdvancedParam = searchParams.get('advanced') === 'true';

  // State
  const [inputQuery, setInputQuery] = useState(queryParam);
  const [mediaType, setMediaType] = useState<'all' | MediaType>(typeParam);
  const [genreId, setGenreId] = useState<number | null>(genreParam);
  const [minRating, setMinRating] = useState<number | null>(ratingParam);
  const [year, setYear] = useState<number | null>(yearParam);
  const [originalLanguage, setOriginalLanguage] = useState<string | null>(langParam);
  const [sortBy, setSortBy] = useState<string>(sortParam);
  const [selectedPersons, setSelectedPersons] = useState<PersonSearchResult[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(isAdvancedParam || Boolean(genreParam || ratingParam || yearParam || langParam));

  const [rawItems, setRawItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync input query with queryParam
  useEffect(() => {
    setInputQuery(queryParam);
  }, [queryParam]);

  // Load initial person(s) if personParam is provided in URL
  useEffect(() => {
    if (!personParam) {
      setSelectedPersons([]);
      return;
    }

    const ids = personParam.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
    if (ids.length === 0) return;

    let isMounted = true;
    Promise.all(ids.map((id) => getPersonDetails(id))).then((detailsList) => {
      if (!isMounted) return;
      const validPersons: PersonSearchResult[] = detailsList
        .filter(Boolean)
        .map((p) => ({
          id: p!.id,
          name: p!.name,
          profile_path: p!.profile_path,
          known_for_department: p!.known_for_department,
        }));
      setSelectedPersons(validPersons);
    });

    return () => {
      isMounted = false;
    };
  }, [personParam]);

  // Helper to update URL params
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all' || (key === 'sort' && val === 'popularity.desc')) {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });
    startTransition(() => {
      const qs = params.toString();
      router.replace(`/search${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };

  // Active filter count
  const activeFilterCount =
    (selectedPersons.length > 0 ? 1 : 0) +
    (mediaType !== 'all' ? 1 : 0) +
    (genreId !== null ? 1 : 0) +
    (minRating !== null ? 1 : 0) +
    (year !== null ? 1 : 0) +
    (originalLanguage !== null ? 1 : 0) +
    (sortBy !== 'popularity.desc' ? 1 : 0);

  // Reset all filters
  const handleResetFilters = () => {
    setMediaType('all');
    setGenreId(null);
    setMinRating(null);
    setYear(null);
    setOriginalLanguage(null);
    setSortBy('popularity.desc');
    setSelectedPersons([]);
    updateUrl({
      type: null,
      genre: null,
      minRating: null,
      year: null,
      lang: null,
      sort: null,
      person: null,
      advanced: null,
    });
  };

  // Handlers for filter bar
  const handleMediaTypeChange = (type: 'all' | MediaType) => {
    setMediaType(type);
    updateUrl({ type });
  };
  const handleGenreChange = (id: number | null) => {
    setGenreId(id);
    updateUrl({ genre: id ? String(id) : null });
  };
  const handleMinRatingChange = (rating: number | null) => {
    setMinRating(rating);
    updateUrl({ minRating: rating ? String(rating) : null });
  };
  const handleYearChange = (y: number | null) => {
    setYear(y);
    updateUrl({ year: y ? String(y) : null });
  };
  const handleLangChange = (lang: string | null) => {
    setOriginalLanguage(lang);
    updateUrl({ lang });
  };
  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrl({ sort });
  };
  const handlePersonsChange = (persons: PersonSearchResult[]) => {
    setSelectedPersons(persons);
    updateUrl({ person: persons.length > 0 ? persons.map((p) => p.id).join(',') : null });
  };

  // Load raw data based on persons, query, or discover
  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      setLoading(true);
      try {
        if (selectedPersons.length > 0) {
          // Fetch combined credits for each selected person
          const creditsLists = await Promise.all(
            selectedPersons.map((p) => getPersonCombinedCredits(p.id))
          );

          if (!isMounted) return;

          if (creditsLists.length === 1) {
            setRawItems(creditsLists[0]);
          } else {
            // Find intersection (titles present in ALL selected persons' credits)
            const firstSet = new Map<string, MediaItem>(
              creditsLists[0].map((item) => [`${item.media_type}-${item.id}`, item])
            );

            for (let i = 1; i < creditsLists.length; i++) {
              const currentKeys = new Set(
                creditsLists[i].map((item) => `${item.media_type}-${item.id}`)
              );
              for (const key of firstSet.keys()) {
                if (!currentKeys.has(key)) {
                  firstSet.delete(key);
                }
              }
            }
            setRawItems(Array.from(firstSet.values()));
          }
        } else if (queryParam.trim()) {
          // Standard text search
          const results = await searchMedia(queryParam.trim(), true);
          if (isMounted) {
            setRawItems(results);
          }
        } else if (activeFilterCount > 0) {
          // Discover by filter when no query is present
          const params = new URLSearchParams();
          if (mediaType !== 'all') params.set('mediaType', mediaType);
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
              setRawItems(data.results || []);
            }
          }
        } else {
          setRawItems([]);
        }
      } catch (err) {
        console.error('Error fetching search items:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedPersons, queryParam, activeFilterCount, genreId, minRating, year, originalLanguage, sortBy, mediaType]);

  // Apply local filters and sort
  const filteredItems = useMemo(() => {
    return rawItems
      .filter((item) => {
        // Format
        if (mediaType === 'movie' && item.media_type !== 'movie') return false;
        if (mediaType === 'tv' && item.media_type !== 'tv') return false;

        // Genre
        if (genreId && (!item.genre_ids || !item.genre_ids.includes(genreId))) {
          return false;
        }

        // Year
        if (year) {
          const itemYear = (item.release_date || item.first_air_date || '').slice(0, 4);
          if (itemYear !== String(year)) return false;
        }

        // Min rating
        if (minRating && (item.vote_average || 0) < minRating) {
          return false;
        }

        // Language
        if (originalLanguage && item.original_language !== originalLanguage) {
          return false;
        }

        // Query text filtering if person was selected AND query typed
        if (selectedPersons.length > 0 && queryParam.trim()) {
          const q = queryParam.trim().toLowerCase();
          const matchTitle = (item.title || '').toLowerCase().includes(q);
          const matchOriginal = (item.original_title || '').toLowerCase().includes(q);
          if (!matchTitle && !matchOriginal) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'vote_average.desc') {
          return (b.vote_average || 0) - (a.vote_average || 0);
        }
        if (sortBy === 'primary_release_date.desc') {
          const dateA = a.release_date || a.first_air_date || '0000';
          const dateB = b.release_date || b.first_air_date || '0000';
          return dateB.localeCompare(dateA);
        }
        // Default popularity
        return (b.popularity || 0) - (a.popularity || 0);
      });
  }, [rawItems, mediaType, genreId, year, minRating, originalLanguage, queryParam, selectedPersons, sortBy]);

  const movieCount = filteredItems.filter((i) => i.media_type === 'movie').length;
  const tvCount = filteredItems.filter((i) => i.media_type === 'tv').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      updateUrl({ q: inputQuery.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1218] text-[#ECE9E3] pb-24">
      {/* Header section */}
      <section className="pt-6 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#2B3443]/60">
        {/* Navigation / Back / Reset Link */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => {
              if (selectedPersons.length > 0 || activeFilterCount > 0) {
                handleResetFilters();
              } else if (queryParam) {
                updateUrl({ q: null });
              } else {
                router.push('/');
              }
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>
              {selectedPersons.length > 0 || activeFilterCount > 0
                ? 'Rensa filter & visa alla'
                : queryParam
                ? 'Rensa sökning'
                : 'Tillbaka till Utforska'}
            </span>
          </button>
        </div>

        {/* Search Input Bar (Inline on the page) */}
        <form onSubmit={handleSearchSubmit} className="mb-6 max-w-xl">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8D97A8] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Sök bland filmer, serier och personer..."
              style={{ fontSize: '16px' }}
              className="w-full bg-[#171C25] border border-[#2B3443] focus:border-[#E9A23B] rounded-2xl pl-10 pr-24 py-2.5 text-xs sm:text-sm text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-3 py-1.5 bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Sök
            </button>
          </div>
        </form>

        {/* HERO: Person, Query, or Filter Header */}
        {selectedPersons.length > 0 ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            {/* Avatars */}
            <div className="flex -space-x-3 overflow-hidden p-1">
              {selectedPersons.map((p) => (
                <div
                  key={p.id}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-[#171C25] border-2 border-[#E9A23B] flex-shrink-0 flex items-center justify-center shadow-xl"
                >
                  {p.profile_path ? (
                    <img
                      src={getImageUrl(p.profile_path, 'w300')}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-7 h-7 text-[#8D97A8]" />
                  )}
                </div>
              ))}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#E9A23B]/20 text-[#E9A23B] text-xs font-bold border border-[#E9A23B]/30">
                  {selectedPersons.length === 1 ? 'Skådespelare' : `${selectedPersons.length} skådespelare`}
                </span>
                {activeFilterCount > 1 && (
                  <span className="text-xs text-[#E9A23B] font-semibold">
                    +{activeFilterCount - 1} aktiva filter
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ECE9E3] tracking-tight mt-1">
                {selectedPersons.length === 1
                  ? `Titlar med ${selectedPersons[0].name}`
                  : `Titlar med ${selectedPersons.map((p) => p.name).join(' & ')}`}
              </h1>
              <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
                Visar {filteredItems.length} matchande produktioner (filtrerat från talkshows och gästspel)
              </p>
            </div>
          </div>
        ) : queryParam ? (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ECE9E3] tracking-tight">
              Sökresultat för &quot;{queryParam}&quot;
            </h1>
            <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
              Hittade {filteredItems.length} {filteredItems.length === 1 ? 'titel' : 'titlar'}
              {activeFilterCount > 0 && ` (${activeFilterCount} filter aktiva)`}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ECE9E3] tracking-tight">
              Avancerad sökning
            </h1>
            <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
              Kombinera skådespelare, genre, betyg och årtal för att hitta exakt det du vill se.
            </p>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Filter Toggle Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isFilterOpen || activeFilterCount > 0
                  ? 'bg-[#1E2531] text-[#ECE9E3] border-[#2B3443]'
                  : 'bg-[#171C25] text-[#8D97A8] border-[#2B3443] hover:text-[#ECE9E3]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Fler filter &amp; sortering</span>
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#E9A23B] text-[#0F1218] text-[10px] font-black flex items-center justify-center">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-xs text-[#8D97A8] hover:text-[#E9A23B] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Återställ</span>
              </button>
            )}
          </div>

          {filteredItems.length > 0 && (
            <div className="text-xs text-[#8D97A8]">
              Visar <strong className="text-[#ECE9E3]">{filteredItems.length}</strong> titlar
              {movieCount > 0 && tvCount > 0 && (
                <span> ({movieCount} filmer, {tvCount} serier)</span>
              )}
            </div>
          )}
        </div>

        {/* Expandable AdvancedFilterBar */}
        {isFilterOpen && (
          <AdvancedFilterBar
            mediaType={mediaType}
            onMediaTypeChange={handleMediaTypeChange}
            genreId={genreId}
            onGenreChange={handleGenreChange}
            minRating={minRating}
            onMinRatingChange={handleMinRatingChange}
            year={year}
            onYearChange={handleYearChange}
            originalLanguage={originalLanguage}
            onOriginalLanguageChange={handleLangChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            onReset={handleResetFilters}
            activeFilterCount={activeFilterCount}
            selectedPersons={selectedPersons}
            onPersonsChange={handlePersonsChange}
          />
        )}

        {/* Content list / grid */}
        <div>
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#E9A23B] mx-auto" />
              <p className="text-xs text-[#8D97A8]">Laddar titlar...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#2B3443] rounded-3xl bg-[#171C25]/40 px-4">
              <Search className="w-10 h-10 text-[#8D97A8] mx-auto mb-2.5" />
              <h3 className="text-base font-bold text-[#ECE9E3]">Inga titlar matchade dina filter</h3>
              <p className="text-xs text-[#8D97A8] max-w-sm mx-auto mt-1">
                {activeFilterCount > 0
                  ? 'Prova att ta bort något filter eller sök på en annan skådespelare.'
                  : 'Skriv in en sökfras eller välj ett filter ovan för att hitta titlar.'}
              </p>
              {activeFilterCount > 0 ? (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Återställ alla filter</span>
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Utforska trendande</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {filteredItems.map((item) => (
                <MediaCard key={`${item.media_type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0F1218] py-24 text-center text-xs text-[#8D97A8]">
          <Loader2 className="w-8 h-8 animate-spin text-[#E9A23B] mx-auto mb-2" />
          <span>Laddar...</span>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
