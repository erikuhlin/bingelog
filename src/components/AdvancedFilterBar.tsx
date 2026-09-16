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
              ? 'bg-[#1E2531] text-[#ECE9E3] border-[#2B3443]'
              : 'bg-[#171C25] text-[#8D97A8] border-[#2B3443] hover:text-[#ECE9E3]'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#E9A23B]" />
          <span>Fler filter</span>
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
            className="flex items-center gap-1.5 text-xs text-[#8D97A8] hover:text-[#E9A23B] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Återställ filter</span>
          </button>
        )}
      </div>

      {/* Expandable filters box */}
      {isOpen && (
        <div className="p-4 rounded-2xl bg-[#171C25] border border-[#2B3443] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in zoom-in-95 duration-150 shadow-xl">
          {/* Media Type */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
              Format
            </label>
            <div className="flex bg-[#0F1218] p-1 rounded-xl border border-[#2B3443]">
              <button
                type="button"
                onClick={() => onMediaTypeChange('all')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  mediaType === 'all' ? 'bg-[#1E2531] text-[#ECE9E3]' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                Alla
              </button>
              <button
                type="button"
                onClick={() => onMediaTypeChange('movie')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  mediaType === 'movie' ? 'bg-[#1E2531] text-[#ECE9E3]' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Film className="w-3 h-3 text-[#E9A23B]" />
                <span>Film</span>
              </button>
              <button
                type="button"
                onClick={() => onMediaTypeChange('tv')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1 transition-colors ${
                  mediaType === 'tv' ? 'bg-[#1E2531] text-[#ECE9E3]' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                }`}
              >
                <Tv className="w-3 h-3 text-sky-400" />
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
              className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl px-3 py-2 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B]"
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
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    minRating === r.val ? 'bg-[#E9A23B] text-[#0F1218] font-bold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div>
            <label className="block text-[11px] font-semibold text-[#8D97A8] mb-1.5">
              Sortera efter
            </label>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="w-full bg-[#0F1218] border border-[#2B3443] rounded-xl px-3 py-2 text-xs text-[#ECE9E3] focus:outline-none focus:border-[#E9A23B]"
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
