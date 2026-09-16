'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import StatusSelector from './StatusSelector';

interface MediaCardProps {
  item: MediaItem;
}

export default function MediaCard({ item }: MediaCardProps) {
  const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
  const detailUrl = `/${item.media_type}/${item.id}`;

  return (
    <div className="group relative flex flex-col bg-zinc-900/60 rounded-2xl border border-zinc-800/80 overflow-hidden hover:border-zinc-700 transition-all hover:shadow-xl hover:shadow-black/50">
      {/* Poster wrapper */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-zinc-950">
        <Link href={detailUrl} className="block w-full h-full">
          <img
            src={getImageUrl(item.poster_path, 'w500')}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges on top of poster */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[11px] font-semibold text-zinc-200 border border-zinc-800">
            {item.media_type === 'movie' ? (
              <>
                <Film className="w-3 h-3 text-rose-400" />
                <span>Film</span>
              </>
            ) : (
              <>
                <Tv className="w-3 h-3 text-sky-400" />
                <span>Serie</span>
              </>
            )}
          </span>

          {item.vote_average > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950/80 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-zinc-800">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span>{item.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Quick status button floating at bottom of poster on hover/focus */}
        <div className="absolute bottom-2.5 right-2.5 opacity-90 group-hover:opacity-100 transition-opacity">
          <StatusSelector
            tmdbId={item.id}
            mediaType={item.media_type}
            title={item.title}
            posterPath={item.poster_path}
            backdropPath={item.backdrop_path}
          />
        </div>
      </div>

      {/* Info content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between gap-1">
        <Link href={detailUrl} className="hover:text-rose-400 transition-colors">
          <h3 className="font-semibold text-sm text-zinc-100 line-clamp-1 leading-snug">
            {item.title}
          </h3>
        </Link>
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span>{year}</span>
          {item.origin_country?.[0] && (
            <span className="text-[10px] font-medium text-zinc-400 px-1.5 py-0.5 rounded bg-zinc-800/80">
              {item.origin_country[0]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
