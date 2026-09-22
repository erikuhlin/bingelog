'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, Film, Tv, RotateCcw } from 'lucide-react';
import { MOCK_GENRES } from '@/lib/mock-data';
import { MediaType } from '@/lib/types';

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
}: AdvancedFilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            isOpen || activeFilterCount > 0
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
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-[#8D97A8] hover:text-[#E9A23B] transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Återställ alla filter</span>
          </button>
        )}
      </div>

      {/* Expandable filters box */}
      {isOpen && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
          {/* 1. Media Type */}
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

          {/* 2. Genre */}
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

          {/* 3. Utgivningsår */}
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

          {/* 4. Språk / Svenskt innehåll */}
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

          {/* 5. Min Rating */}
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

          {/* 6. Sort */}
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-5 pt-2 border-t border-[#2B3443]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
          </div>
        </div>
      )}
    </div>
  );
}
