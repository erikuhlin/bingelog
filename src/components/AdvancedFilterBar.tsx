'use client';

import React, { useState } from 'react';
import { SlidersHorizontal, X, Film, Tv, Star, RotateCcw } from 'lucide-react';
import { MOCK_GENRES } from '@/lib/mock-data';
import { MediaType } from '@/lib/types';

interface AdvancedFilterBarProps {
  mediaType: 'all' | MediaType;
  onMediaTypeChange: (type: 'all' | MediaType) => void;
  genreId: number | null;
  onGenreChange: (id: number | null) => void;
  minRating: number | null;
  onMinRatingChange: (rating: number | null) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onReset: () => void;
  activeFilterCount: number;
}

export default function AdvancedFilterBar({
  mediaType,
  onMediaTypeChange,
  genreId,
  onGenreChange,
  minRating,
  onMinRatingChange,
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
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            isOpen || activeFilterCount > 0
              ? 'bg-zinc-800 text-white border-zinc-700'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
          <span>Fler filter</span>
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-rose-400 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Återställ filter</span>
          </button>
        )}
      </div>

      {/* Expandable filters box */}
      {isOpen && (
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-150">
          {/* Media Type */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              Format
            </label>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <button
                type="button"
                onClick={() => onMediaTypeChange('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mediaType === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Alla
              </button>
              <button
                type="button"
                onClick={() => onMediaTypeChange('movie')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  mediaType === 'movie' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Film className="w-3 h-3 text-rose-400" />
                <span>Film</span>
              </button>
              <button
                type="button"
                onClick={() => onMediaTypeChange('tv')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  mediaType === 'tv' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Tv className="w-3 h-3 text-sky-400" />
                <span>Serie</span>
              </button>
            </div>
          </div>

          {/* Genre */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              Genre
            </label>
            <select
              value={genreId || ''}
              onChange={(e) => onGenreChange(e.target.value ? parseInt(e.target.value, 10) : null)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              <option value="">Alla genrer</option>
              {MOCK_GENRES.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* Min Rating */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              Lägsta betyg
            </label>
            <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
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
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    minRating === r.val ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-400 mb-1.5">
              Sortera efter
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-rose-500"
            >
              <option value="popularity.desc">Populäritet (Högst)</option>
              <option value="vote_average.desc">Betyg (Högst)</option>
              <option value="primary_release_date.desc">Utgivningsdatum (Nyast)</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
