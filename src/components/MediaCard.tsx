'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Star, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import StatusSelector from './StatusSelector';

interface MediaCardProps {
  item: MediaItem;
}

function ProviderMiniBadge({ logoPath, name }: { logoPath: string; name: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !logoPath) {
    return (
      <div
        title={name}
        className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-[#1E2531] border border-[#2B3443] text-[#ECE9E3] font-black text-[9px] flex items-center justify-center flex-shrink-0 shadow-md"
      >
        {name.slice(0, 1)}
      </div>
    );
  }

  return (
    <div
      title={name}
      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden border border-[#0F1218] shadow-lg bg-[#0F1218] flex-shrink-0"
    >
      <img
        src={getImageUrl(logoPath, 'w300')}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default function MediaCard({ item }: MediaCardProps) {
  const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
  const detailUrl = `/${item.media_type}/${item.id}`;

  const handleNavigate = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`bingelog_scroll_${window.location.pathname}`, String(window.scrollY));
    }
  };

  return (
    <div className="group relative flex flex-col bg-[#171C25] rounded-2xl border border-[#2B3443] overflow-hidden hover:border-[#E9A23B]/60 transition-all hover:shadow-xl hover:shadow-black/50">
      {/* Poster wrapper */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0F1218]">
        <Link href={detailUrl} onClick={handleNavigate} className="block w-full h-full">
          <img
            src={getImageUrl(item.poster_path, 'w500')}
            alt={item.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* Badges on top of poster */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#0F1218]/90 backdrop-blur-md text-[10px] font-semibold text-[#ECE9E3] border border-[#2B3443] shadow-sm">
            {item.media_type === 'movie' ? (
              <>
                <Film className="w-3 h-3 text-[#E9A23B]" />
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
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#0F1218]/90 backdrop-blur-md text-[10px] font-bold text-[#E9A23B] border border-[#2B3443] shadow-sm">
              <Star className="w-3 h-3 fill-[#E9A23B] text-[#E9A23B]" />
              <span>{item.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>

        {/* Streaming provider badges on bottom-left of cover */}
        {item.watch_providers && item.watch_providers.length > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center -space-x-1.5 z-10 pointer-events-none">
            {item.watch_providers.slice(0, 3).map((provider) => (
              <ProviderMiniBadge
                key={provider.provider_id}
                logoPath={provider.logo_path}
                name={provider.provider_name}
              />
            ))}
            {item.watch_providers.length > 3 && (
              <span className="w-5 h-5 rounded-md bg-[#0F1218]/90 text-[#ECE9E3] border border-[#2B3443] text-[9px] font-bold flex items-center justify-center">
                +{item.watch_providers.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Info content & Status button */}
      <div className="p-3 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <Link href={detailUrl} onClick={handleNavigate} className="hover:text-[#E9A23B] transition-colors block">
            <h3 className="font-bold text-xs sm:text-sm text-[#ECE9E3] line-clamp-1 leading-snug">
              {item.title}
            </h3>
          </Link>
          <div className="flex items-center justify-between text-[11px] text-[#8D97A8] mt-1">
            <span>{year || '–'}</span>
            {item.origin_country?.[0] && (
              <span className="text-[10px] font-medium text-[#8D97A8] px-1 py-0.2 rounded bg-[#1E2531]">
                {item.origin_country[0]}
              </span>
            )}
          </div>
        </div>

        {/* Status button */}
        <div className="pt-1 border-t border-[#2B3443]/60">
          <StatusSelector
            tmdbId={item.id}
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
}
