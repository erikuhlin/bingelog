'use client';

import React from 'react';
import Link from 'next/link';
import { Star, PlayCircle, Info } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getBackdropUrl } from '@/lib/tmdb';
import StatusSelector from './StatusSelector';

interface HeroBannerProps {
  item: MediaItem;
}

export default function HeroBanner({ item }: HeroBannerProps) {
  const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
  const detailUrl = `/${item.media_type}/${item.id}`;

  return (
    <div className="relative w-full h-[480px] md:h-[560px] rounded-3xl overflow-hidden mb-10 border border-zinc-800 shadow-2xl">
      {/* Backdrop image */}
      <img
        src={getBackdropUrl(item.backdrop_path, 'original')}
        alt={item.title}
        className="w-full h-full object-cover object-center"
      />

      {/* Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/90 via-zinc-950/40 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-12 max-w-2xl">
        <div className="flex items-center gap-3 mb-3">
          <span className="px-2.5 py-1 rounded-full bg-rose-600/90 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-rose-900/40">
            🔥 Trendar nu
          </span>
          <span className="px-2.5 py-1 rounded-full bg-zinc-900/80 text-zinc-300 font-semibold text-xs border border-zinc-800">
            {item.media_type === 'movie' ? 'Film' : 'TV-Serie'}
          </span>
          {year && <span className="text-zinc-400 text-xs font-medium">{year}</span>}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-3">
          {item.title}
        </h1>

        <p className="text-zinc-300 text-sm md:text-base line-clamp-3 mb-6 leading-relaxed max-w-xl">
          {item.overview}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={detailUrl}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm transition-all shadow-lg shadow-rose-900/30 hover:scale-105 active:scale-95"
          >
            <Info className="w-4 h-4" />
            <span>Mer information</span>
          </Link>

          <StatusSelector
            tmdbId={item.id}
            mediaType={item.media_type}
            title={item.title}
            posterPath={item.poster_path}
            backdropPath={item.backdrop_path}
          />
        </div>
      </div>
    </div>
  );
}
