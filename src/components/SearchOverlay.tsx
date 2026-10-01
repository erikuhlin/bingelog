'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Clock,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
  Film,
  Tv,
  Star,
  Loader2,
  Trash2,
  User,
  Check,
} from 'lucide-react';
import { searchMultiLive, getImageUrl } from '@/lib/tmdb';
import { MediaItem, PersonSearchResult, WatchStatus } from '@/lib/types';
import { getLocalMedia } from '@/lib/storage';

const RECENT_SEARCHES_KEY = 'bingelog_recent_searches';
const MAX_RECENT_SEARCHES = 6;

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export default function SearchOverlay({
  isOpen,
  onClose,
  initialQuery = '',
}: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<{ titles: MediaItem[]; actors: PersonSearchResult[] }>({
    titles: [],
    actors: [],
  });
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [userMediaMap, setUserMediaMap] = useState<Record<string, WatchStatus>>({});

  // Sync state when opened
  useEffect(() => {
    if (!isOpen) return;

    // Load recent searches
    try {
      const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch {
      // Ignore
    }

    // Load user media to show 'I biblioteket' badges
    const localMedia = getLocalMedia();
    const map: Record<string, WatchStatus> = {};
    localMedia.forEach((m) => {
      map[`${m.media_type}-${m.tmdb_id}`] = m.status;
    });
    setUserMediaMap(map);

    // Autofocus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({ titles: [], actors: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchMultiLive(trimmed);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      const updated = [trimmed, ...recentSearches.filter((s) => s.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const removeRecentSearch = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((s) => s !== text);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // Ignore
    }
  };

  const handleSelectTitle = (item: MediaItem) => {
    saveRecentSearch(item.title);
    onClose();
    router.push(`/${item.media_type}/${item.id}`);
  };

  const handleSelectActor = (actor: PersonSearchResult) => {
    saveRecentSearch(actor.name);
    onClose();
    router.push(`/search?person=${actor.id}`);
  };

  const handleFullSearch = (searchQueryToUse?: string) => {
    const q = (searchQueryToUse || query).trim();
    if (!q) return;
    saveRecentSearch(q);
    onClose();
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleOpenAdvanced = () => {
    onClose();
    router.push('/search?advanced=true');
  };

  if (!isOpen) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = results.titles.length > 0 || results.actors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 backdrop-blur-md md:pt-14 md:px-4 animate-in fade-in duration-200">
      {/* Container: Fullscreen on mobile, elevated modal card on tablet/desktop */}
      <div
        className="w-full h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-2xl bg-[#0F1218] md:bg-[#171C25] md:border md:border-[#2B3443] md:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Search Input Bar */}
        <div className="p-3 sm:p-4 border-b border-[#2B3443] flex items-center gap-2.5 sm:gap-3 bg-[#171C25]">
          <div className="relative flex-1 flex items-center">
            <Search className="w-5 h-5 text-[#E9A23B] absolute left-3.5 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFullSearch();
                }
              }}
              placeholder="Sök filmer, serier eller skådespelare..."
              style={{ fontSize: '16px' }}
              className="w-full bg-[#0F1218] border border-[#2B3443] focus:border-[#E9A23B] rounded-2xl pl-11 pr-10 py-3 text-sm text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none transition-colors"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                className="absolute right-3 p-1 text-[#8D97A8] hover:text-[#ECE9E3] transition-colors"
                title="Rensa"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 rounded-xl text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] transition-colors flex-shrink-0 cursor-pointer"
          >
            Avbryt
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-6">
          {/* EMPTY STATE: Recent searches & Advanced search */}
          {!hasQuery && (
            <div className="space-y-6 animate-in fade-in duration-150">
              {/* Top Banner: Avancerad sökning */}
              <button
                type="button"
                onClick={handleOpenAdvanced}
                className="w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#E9A23B]/10 to-[#E9A23B]/5 border border-[#E9A23B]/30 hover:border-[#E9A23B] group transition-all text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#E9A23B]/20 text-[#E9A23B] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#ECE9E3] group-hover:text-[#E9A23B] transition-colors">
                      Avancerad sökning
                    </h4>
                    <p className="text-xs text-[#8D97A8] mt-0.5">
                      Filtrera på streamingtjänst, genrer, betyg och årtal
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#8D97A8] group-hover:text-[#E9A23B] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>

              {/* Senaste sökningar */}
              {recentSearches.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#8D97A8] uppercase tracking-wider flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Senaste sökningar</span>
                    </span>
                    <button
                      type="button"
                      onClick={clearAllRecent}
                      className="text-[11px] text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer"
                    >
                      Rensa alla
                    </button>
                  </div>

                  <div className="divide-y divide-[#2B3443]/40 rounded-2xl bg-[#0F1218]/60 border border-[#2B3443]/60 overflow-hidden">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => {
                          setQuery(item);
                          handleFullSearch(item);
                        }}
                        className="flex items-center justify-between px-3.5 py-3 hover:bg-[#1E2531]/60 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-[#8D97A8] group-hover:text-[#E9A23B] transition-colors flex-shrink-0" />
                          <span className="text-xs sm:text-sm text-[#ECE9E3] group-hover:text-[#E9A23B] transition-colors truncate">
                            {item}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removeRecentSearch(e, item)}
                          className="text-[#8D97A8] hover:text-red-400 p-1 transition-colors"
                          title="Ta bort från historik"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ACTIVE SEARCH STATE */}
          {hasQuery && (
            <div className="space-y-6">
              {/* Loading Indicator */}
              {isSearching && (
                <div className="flex items-center justify-center py-6 text-xs text-[#8D97A8] gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#E9A23B]" />
                  <span>Söker bland titlar och skådespelare...</span>
                </div>
              )}

              {/* No results */}
              {!isSearching && !hasResults && (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E2531] text-[#8D97A8] mx-auto flex items-center justify-center">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-[#ECE9E3]">
                    Inga resultat för &quot;{query}&quot;
                  </h3>
                  <p className="text-xs text-[#8D97A8] max-w-xs mx-auto">
                    Kolla stavningen eller prova att söka med filter.
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAdvanced}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E9A23B] text-[#0F1218] text-xs font-bold hover:bg-[#F2B04E] transition-all cursor-pointer"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Prova avancerad sökning</span>
                  </button>
                </div>
              )}

              {/* 1. TITLAR (Movies & Series) */}
              {!isSearching && results.titles.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#8D97A8] uppercase tracking-wider">
                      Titlar ({results.titles.length})
                    </span>
                  </div>

                  <div className="divide-y divide-[#2B3443]/40 rounded-2xl bg-[#0F1218]/60 border border-[#2B3443]/60 overflow-hidden">
                    {results.titles.map((item) => {
                      const libraryStatus = userMediaMap[`${item.media_type}-${item.id}`];
                      const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';

                      return (
                        <button
                          key={`${item.media_type}-${item.id}`}
                          type="button"
                          onClick={() => handleSelectTitle(item)}
                          className="w-full p-2.5 sm:p-3 flex items-center gap-3 hover:bg-[#1E2531]/80 transition-colors text-left cursor-pointer group"
                        >
                          {/* Poster */}
                          <div className="w-10 sm:w-11 aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1218] flex-shrink-0 border border-[#2B3443]">
                            <img
                              src={getImageUrl(item.poster_path, 'w300')}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#ECE9E3] group-hover:text-[#E9A23B] transition-colors truncate">
                                {item.title}
                              </span>
                              {libraryStatus && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-[#6FA98A]/20 text-[#6FA98A] border border-[#6FA98A]/40 text-[10px] font-bold">
                                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                                  <span>I biblioteket</span>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8D97A8]">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-[#1E2531] text-[10px] text-[#ECE9E3]">
                                {item.media_type === 'movie' ? 'Film' : 'Serie'}
                              </span>
                              {year && <span>{year}</span>}
                              {item.vote_average > 0 && (
                                <span className="flex items-center gap-0.5 text-[#E9A23B] font-semibold">
                                  <Star className="w-3 h-3 fill-[#E9A23B]" />
                                  <span>{item.vote_average.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-[#8D97A8] group-hover:text-[#E9A23B] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. SKÅDESPELARE (Actors/Personer) */}
              {!isSearching && results.actors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-bold text-[#8D97A8] uppercase tracking-wider flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-[#E9A23B]" />
                      <span>Personer ({results.actors.length})</span>
                    </span>
                  </div>

                  <div className="divide-y divide-[#2B3443]/40 rounded-2xl bg-[#0F1218]/60 border border-[#2B3443]/60 overflow-hidden">
                    {results.actors.map((actor) => {
                      const knownForList = (actor.known_for || [])
                        .map((k) => k.title || k.name)
                        .filter(Boolean)
                        .slice(0, 3)
                        .join(', ');

                      return (
                        <button
                          key={actor.id}
                          type="button"
                          onClick={() => handleSelectActor(actor)}
                          className="w-full p-2.5 sm:p-3 flex items-center gap-3 hover:bg-[#1E2531]/80 transition-colors text-left cursor-pointer group"
                        >
                          {/* Profile Avatar */}
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0 flex items-center justify-center">
                            {actor.profile_path ? (
                              <img
                                src={getImageUrl(actor.profile_path, 'w300')}
                                alt={actor.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                loading="lazy"
                              />
                            ) : (
                              <User className="w-5 h-5 text-[#8D97A8]" />
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs sm:text-sm text-[#ECE9E3] group-hover:text-[#E9A23B] transition-colors truncate block">
                              {actor.name}
                            </span>
                            {knownForList && (
                              <span className="text-[11px] text-[#8D97A8] truncate block mt-0.5">
                                Känd för: {knownForList}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1 text-xs text-[#E9A23B] font-semibold flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>Se titlar</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions: Enter to see all results / Advanced search */}
        {hasQuery && (
          <div className="p-3 sm:p-4 border-t border-[#2B3443] bg-[#171C25] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={() => handleFullSearch()}
              className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] text-xs font-bold transition-all shadow-md shadow-[#E9A23B]/10 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Visa alla resultat för &quot;{query}&quot;</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdvanced}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] border border-[#2B3443] transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Förfina med filter</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
