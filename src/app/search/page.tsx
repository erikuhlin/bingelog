'use client';

import React, { useState, useEffect, Suspense, useTransition } from 'react';
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
  Calendar,
} from 'lucide-react';
import {
  getPersonDetails,
  getPersonCombinedCredits,
  searchMedia,
  getImageUrl,
} from '@/lib/tmdb';
import { MediaItem, PersonDetails } from '@/lib/types';
import MediaCard from '@/components/MediaCard';

type FilterType = 'all' | 'movie' | 'tv';
type SortOption = 'popularity' | 'newest' | 'rating';

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryParam = searchParams.get('q') || '';
  const personParam = searchParams.get('person') || '';
  const typeParam = (searchParams.get('type') as FilterType) || 'all';
  const sortParam = (searchParams.get('sort') as SortOption) || 'popularity';

  const [inputQuery, setInputQuery] = useState(queryParam);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [person, setPerson] = useState<PersonDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to update URL query params
  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (!val || val === 'all' || (key === 'sort' && val === 'popularity')) {
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

  useEffect(() => {
    setInputQuery(queryParam);
  }, [queryParam]);

  // Load results whenever query or person changes
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setLoading(true);
      try {
        if (personParam) {
          const personId = parseInt(personParam, 10);
          if (!isNaN(personId)) {
            const [pDetails, credits] = await Promise.all([
              getPersonDetails(personId),
              getPersonCombinedCredits(personId),
            ]);
            if (isMounted) {
              setPerson(pDetails);
              setItems(credits);
            }
          }
        } else if (queryParam.trim()) {
          setPerson(null);
          const results = await searchMedia(queryParam.trim(), true);
          if (isMounted) {
            setItems(results);
          }
        } else {
          setPerson(null);
          setItems([]);
        }
      } catch (err) {
        console.error('Error loading search results:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [personParam, queryParam]);

  // Filter items by type
  const filteredByType = items.filter((item) => {
    if (typeParam === 'movie') return item.media_type === 'movie';
    if (typeParam === 'tv') return item.media_type === 'tv';
    return true;
  });

  // Sort items
  const sorted = [...filteredByType].sort((a, b) => {
    if (sortParam === 'newest') {
      const dateA = a.release_date || a.first_air_date || '0000';
      const dateB = b.release_date || b.first_air_date || '0000';
      return dateB.localeCompare(dateA);
    }
    if (sortParam === 'rating') {
      return (b.vote_average || 0) - (a.vote_average || 0);
    }
    // Default popularity
    return (b.popularity || 0) - (a.popularity || 0);
  });

  const movieCount = items.filter((i) => i.media_type === 'movie').length;
  const tvCount = items.filter((i) => i.media_type === 'tv').length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1218] text-[#ECE9E3] pb-24">
      {/* Header section */}
      <section className="pt-6 sm:pt-10 pb-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#2B3443]/60">
        {/* Back Link */}
        <div className="mb-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Tillbaka</span>
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

        {/* HERO: Person or Query Header */}
        {person ? (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-[#171C25] border-2 border-[#E9A23B]/60 flex-shrink-0 flex items-center justify-center shadow-xl">
              {person.profile_path ? (
                <img
                  src={getImageUrl(person.profile_path, 'w300')}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-[#8D97A8]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#E9A23B]/20 text-[#E9A23B] text-xs font-bold border border-[#E9A23B]/30">
                  {person.known_for_department === 'Directing' ? 'Regissör' : 'Skådespelare'}
                </span>
                {person.place_of_birth && (
                  <span className="text-xs text-[#8D97A8]">{person.place_of_birth}</span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ECE9E3] tracking-tight mt-1">
                Titlar med {person.name}
              </h1>
              <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
                Visar {items.length} kända produktioner (exklusive talkshows &amp; gästframträdanden)
              </p>
            </div>
          </div>
        ) : queryParam ? (
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-[#ECE9E3] tracking-tight">
              Sökresultat för &quot;{queryParam}&quot;
            </h1>
            <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
              Hittade {items.length} {items.length === 1 ? 'titel' : 'titlar'}
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#ECE9E3] tracking-tight">
              Sök
            </h1>
            <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
              Hitta filmer, serier och se alla titlar med dina favoritskådespelare.
            </p>
          </div>
        )}
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Controls row: Type chips & Sort dropdown */}
        {items.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-[#2B3443]/40">
            {/* Format Chips (Alla, Filmer, Serier) */}
            <div className="flex items-center gap-1.5 bg-[#171C25] p-1 rounded-xl border border-[#2B3443] w-max">
              <button
                type="button"
                onClick={() => updateUrl({ type: 'all' })}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  typeParam === 'all'
                    ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                    : 'text-[#9EA8B6] hover:text-[#ECE9E3]'
                }`}
              >
                Alla ({items.length})
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ type: 'movie' })}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  typeParam === 'movie'
                    ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                    : 'text-[#9EA8B6] hover:text-[#ECE9E3]'
                }`}
              >
                <Film className={`w-3.5 h-3.5 ${typeParam === 'movie' ? 'text-[#0F1218]' : 'text-[#E9A23B]'}`} />
                <span>Filmer ({movieCount})</span>
              </button>
              <button
                type="button"
                onClick={() => updateUrl({ type: 'tv' })}
                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  typeParam === 'tv'
                    ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                    : 'text-[#9EA8B6] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className={`w-3.5 h-3.5 ${typeParam === 'tv' ? 'text-[#0F1218]' : 'text-[#6FA98A]'}`} />
                <span>Serier ({tvCount})</span>
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8D97A8]">Sortera:</span>
              <select
                value={sortParam}
                onChange={(e) => updateUrl({ sort: e.target.value })}
                className="bg-[#171C25] border border-[#2B3443] rounded-xl px-3 py-1.5 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B] cursor-pointer"
              >
                <option value="popularity">Popularitet (högst)</option>
                <option value="newest">Nyast först</option>
                <option value="rating">Betyg (högst)</option>
              </select>
            </div>
          </div>
        )}

        {/* Content list / grid */}
        <div className="mt-6">
          {loading ? (
            <div className="py-24 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#E9A23B] mx-auto" />
              <p className="text-xs text-[#8D97A8]">Laddar titlar...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className="py-20 text-center border border-dashed border-[#2B3443] rounded-3xl bg-[#171C25]/40 px-4">
              <Search className="w-10 h-10 text-[#8D97A8] mx-auto mb-2.5" />
              <h3 className="text-base font-bold text-[#ECE9E3]">Inga titlar matchade</h3>
              <p className="text-xs text-[#8D97A8] max-w-sm mx-auto mt-1">
                {queryParam || personParam
                  ? 'Inga resultat matchade ditt valda filter.'
                  : 'Skriv in en sökfras ovan för att hitta filmer och serier.'}
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 mt-5 px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Utforska trendande</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 md:gap-5">
              {sorted.map((item) => (
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
