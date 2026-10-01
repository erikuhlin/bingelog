'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Film, Tv, RotateCcw, User, Search, X, Loader2 } from 'lucide-react';
import { MOCK_GENRES } from '@/lib/mock-data';
import { MediaType, PersonSearchResult } from '@/lib/types';
import { searchMultiLive, getImageUrl } from '@/lib/tmdb';

interface AdvancedFilterBarProps {
  mediaType: 'all' | MediaType;
  onMediaTypeChange: (type: 'all' | MediaType) => void;
  genreId: number | null;
  onGenreChange: (id: number | null) => void;
  minRating: number | null;
  onMinRatingChange: (rating: number | null) => void;
  year: number | null;
  onYearChange: (year: number | null) => void;
  originalLanguage: string | null;
  onOriginalLanguageChange: (lang: string | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
  activeFilterCount: number;
  selectedPersons?: PersonSearchResult[];
  onPersonsChange?: (persons: PersonSearchResult[]) => void;
}

const YEAR_OPTIONS = [
  { label: 'Alla år', value: null },
  { label: '2025', value: 2025 },
  { label: '2024', value: 2024 },
  { label: '2023', value: 2023 },
  { label: '2022', value: 2022 },
  { label: '2021', value: 2021 },
  { label: '2020', value: 2020 },
  { label: '2019', value: 2019 },
  { label: '2015', value: 2015 },
  { label: '2010', value: 2010 },
  { label: '2000', value: 2000 },
  { label: '1990', value: 1990 },
];

export default function AdvancedFilterBar({
  mediaType,
  onMediaTypeChange,
  genreId,
  onGenreChange,
  minRating,
  onMinRatingChange,
  year,
  onYearChange,
  originalLanguage,
  onOriginalLanguageChange,
  sortBy,
  onSortChange,
  onReset,
  activeFilterCount,
  selectedPersons = [],
  onPersonsChange,
}: AdvancedFilterBarProps) {
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState<PersonSearchResult[]>([]);
  const [isSearchingPerson, setIsSearchingPerson] = useState(false);
  const [isPersonDropdownOpen, setIsPersonDropdownOpen] = useState(false);
  const personDropdownRef = useRef<HTMLDivElement>(null);

  // Debounced person search
  useEffect(() => {
    const trimmed = personQuery.trim();
    if (!trimmed) {
      setPersonResults([]);
      setIsSearchingPerson(false);
      return;
    }

    setIsSearchingPerson(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchMultiLive(trimmed);
        setPersonResults(res.actors || []);
        setIsPersonDropdownOpen(true);
      } catch (err) {
        console.error('Failed to search persons:', err);
      } finally {
        setIsSearchingPerson(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [personQuery]);

  // Click outside listener for person dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (personDropdownRef.current && !personDropdownRef.current.contains(e.target as Node)) {
        setIsPersonDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddPerson = (actor: PersonSearchResult) => {
    if (!onPersonsChange) return;
    if (!selectedPersons.some((p) => p.id === actor.id)) {
      onPersonsChange([...selectedPersons, actor]);
    }
    setPersonQuery('');
    setPersonResults([]);
    setIsPersonDropdownOpen(false);
  };

  const handleRemovePerson = (actorId: number) => {
    if (!onPersonsChange) return;
    onPersonsChange(selectedPersons.filter((p) => p.id !== actorId));
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
      {/* 1. Medverkande / Skådespelare Typeahead Section (if onPersonsChange is provided) */}
      {onPersonsChange && (
        <div className="pb-3 border-b border-[#2B3443]/60">
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#E9A23B]" />
              <span>Medverkande / Skådespelare</span>
            </span>
            {selectedPersons.length > 0 && (
              <span className="text-[10px] text-[#E9A23B] font-bold">
                {selectedPersons.length} {selectedPersons.length === 1 ? 'vald' : 'valda'}
              </span>
            )}
          </label>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Selected Person Chips */}
            {selectedPersons.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {selectedPersons.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl bg-[#E9A23B]/15 border border-[#E9A23B]/40 text-xs font-semibold text-[#ECE9E3] shadow-sm animate-in fade-in duration-150"
                  >
                    <span className="w-5 h-5 rounded-full overflow-hidden bg-[#0F1218] border border-[#E9A23B]/40 flex-shrink-0 flex items-center justify-center">
                      {person.profile_path ? (
                        <img
                          src={getImageUrl(person.profile_path, 'w300')}
                          alt={person.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-3 h-3 text-[#8D97A8]" />
                      )}
                    </span>
                    <span>{person.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePerson(person.id)}
                      className="text-[#9EA8B6] hover:text-[#ECE9E3] p-0.5 rounded-md hover:bg-[#E9A23B]/20 transition-colors cursor-pointer"
                      title={`Ta bort ${person.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Typeahead Search Input */}
            <div ref={personDropdownRef} className="relative flex-1 min-w-[200px]">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[#8D97A8] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={personQuery}
                  onChange={(e) => setPersonQuery(e.target.value)}
                  onFocus={() => personResults.length > 0 && setIsPersonDropdownOpen(true)}
                  placeholder={
                    selectedPersons.length > 0
                      ? 'Lägg till fler skådespelare...'
                      : 'Sök skådespelare (t.ex. Pedro Pascal)...'
                  }
                  style={{ fontSize: '16px' }}
                  className="w-full bg-[#0F1218] border border-[#2B3443] focus:border-[#E9A23B] rounded-xl pl-9 pr-8 py-2 text-xs text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none transition-colors"
                />
                {isSearchingPerson ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#E9A23B] animate-spin absolute right-3 pointer-events-none" />
                ) : personQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPersonQuery('');
                      setPersonResults([]);
                    }}
                    className="absolute right-2.5 text-[#8D97A8] hover:text-[#ECE9E3] p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Live Dropdown Results */}
              {isPersonDropdownOpen && personResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-[#2B3443]/60 max-h-60 overflow-y-auto">
                  {personResults.map((actor) => {
                    const isAlreadySelected = selectedPersons.some((p) => p.id === actor.id);
                    const knownFor = (actor.known_for || [])
                      .map((k) => k.title || k.name)
                      .filter(Boolean)
                      .slice(0, 2)
                      .join(', ');

                    return (
                      <button
                        key={actor.id}
                        type="button"
                        disabled={isAlreadySelected}
                        onClick={() => handleAddPerson(actor)}
                        className={`w-full p-2.5 flex items-center gap-2.5 transition-colors text-left cursor-pointer ${
                          isAlreadySelected
                            ? 'opacity-40 cursor-not-allowed bg-[#0F1218]/40'
                            : 'hover:bg-[#1E2531]'
                        }`}
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0 flex items-center justify-center">
                          {actor.profile_path ? (
                            <img
                              src={getImageUrl(actor.profile_path, 'w300')}
                              alt={actor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-[#8D97A8]" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-[#ECE9E3] truncate">{actor.name}</p>
                          {knownFor && (
                            <p className="text-[10px] text-[#8D97A8] truncate mt-0.5">
                              Känd för: {knownFor}
                            </p>
                          )}
                        </div>
                        {isAlreadySelected ? (
                          <span className="text-[10px] text-[#8D97A8] font-medium">Vald</span>
                        ) : (
                          <span className="text-xs text-[#E9A23B] font-bold">+ Välj</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Grid of standard filters: Format, Genre, Utgivningsår, Svenskt innehåll, Lägsta betyg */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Format */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
            Format
          </label>
          <div className="flex bg-[#0F1218] p-1 rounded-xl border border-[#2B3443]">
            <button
              type="button"
              onClick={() => onMediaTypeChange('all')}
              className={`flex-1 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                mediaType === 'all'
                  ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3] font-medium'
              }`}
            >
              Alla
            </button>
            <button
              type="button"
              onClick={() => onMediaTypeChange('movie')}
              className={`flex-1 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                mediaType === 'movie'
                  ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3] font-medium'
              }`}
            >
              <Film className={`w-3 h-3 ${mediaType === 'movie' ? 'text-[#0F1218]' : 'text-[#E9A23B]'}`} />
              <span>Film</span>
            </button>
            <button
              type="button"
              onClick={() => onMediaTypeChange('tv')}
              className={`flex-1 py-1.5 text-xs rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                mediaType === 'tv'
                  ? 'bg-[#E9A23B] text-[#0F1218] font-bold shadow-sm'
                  : 'text-[#8D97A8] hover:text-[#ECE9E3] font-medium'
              }`}
            >
              <Tv className={`w-3 h-3 ${mediaType === 'tv' ? 'text-[#0F1218]' : 'text-[#6FA98A]'}`} />
              <span>Serie</span>
            </button>
          </div>
        </div>

        {/* Genre */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
            Genre
          </label>
          <select
            value={genreId || ''}
            onChange={(e) => onGenreChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl px-3 py-2 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B] cursor-pointer"
          >
            <option value="">Alla genrer</option>
            {MOCK_GENRES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>

        {/* Utgivningsår */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
            Utgivningsår
          </label>
          <select
            value={year || ''}
            onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value, 10) : null)}
            className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl px-3 py-2 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B] cursor-pointer"
          >
            {YEAR_OPTIONS.map((y) => (
              <option key={y.label} value={y.value || ''}>
                {y.label}
              </option>
            ))}
          </select>
        </div>

        {/* Språk / Svenskt innehåll */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
            Svenskt innehåll
          </label>
          <button
            type="button"
            onClick={() => onOriginalLanguageChange(originalLanguage === 'sv' ? null : 'sv')}
            className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              originalLanguage === 'sv'
                ? 'bg-[#E9A23B] text-[#0F1218] border-[#E9A23B] font-bold shadow-sm'
                : 'bg-[#0F1218] text-[#8D97A8] border-[#2B3443] hover:text-[#ECE9E3]'
            }`}
          >
            <span>🇸🇪 Svensk produktion</span>
          </button>
        </div>

        {/* Lägsta betyg */}
        <div>
          <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
            Lägsta betyg
          </label>
          <div className="flex bg-[#0F1218] p-1 rounded-xl border border-[#2B3443]">
            {[
              { label: 'Alla', val: null },
              { label: '★ 6+', val: 6 },
              { label: '★ 7+', val: 7 },
              { label: '★ 8+', val: 8 },
            ].map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => onMinRatingChange(r.val)}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  minRating === r.val ? 'bg-[#E9A23B] text-[#0F1218] font-bold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Sortering & Återställ row */}
      <div className="pt-2 border-t border-[#2B3443]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#8D97A8]">Sortera efter:</span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: 'Mest populära', value: 'popularity.desc' },
              { label: 'Högst betyg', value: 'vote_average.desc' },
              { label: 'Nyast utgivning', value: 'primary_release_date.desc' },
            ].map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => onSortChange(s.value)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  sortBy === s.value
                    ? 'bg-[#1E2531] text-[#E9A23B] border border-[#2B3443]'
                    : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-[#8D97A8] hover:text-[#E9A23B] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Återställ alla filter</span>
          </button>
        )}
      </div>
    </div>
  );
}
