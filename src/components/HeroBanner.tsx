'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Info, Film, Tv } from 'lucide-react';
import { MediaItem } from '@/lib/types';
import { getBackdropUrl, getImageUrl } from '@/lib/tmdb';
import StatusSelector from './StatusSelector';

interface HeroBannerProps {
  item: MediaItem;
}

export default function HeroBanner({ item }: HeroBannerProps) {
  const year = item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '';
  const detailUrl = `/${item.media_type}/${item.id}`;

  return (
    <div className="relative w-full h-[380px] sm:h-[460px] md:h-[520px] rounded-3xl overflow-hidden mb-8 md:mb-10 border border-[#2B3443] shadow-2xl">
      {/* Backdrop image */}
      <img
        src={getBackdropUrl(item.backdrop_path, 'original')}
        alt={item.title}
        className="w-full h-full object-cover object-center"
      />

      {/* Gradients matching #0F1218 */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1218] via-[#0F1218]/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1218]/95 via-[#0F1218]/60 to-transparent" />

      {/* Content overlay */}
      <div className="absolute inset-0 flex flex-col justify-end p-4 sm:p-6 md:p-10 max-w-2xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 mb-2.5">
          <span className="px-2.5 py-0.5 rounded-full bg-[#E9A23B] text-[#0F1218] font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-lg shadow-[#E9A23B]/30">
            🔥 Trendar nu
          </span>
          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#171C25]/90 text-[#ECE9E3] font-semibold text-[10px] sm:text-xs border border-[#2B3443]">
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
          {year && <span className="text-[#8D97A8] text-xs font-medium">{year}</span>}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1 text-xs font-bold text-[#E9A23B] bg-[#171C25]/90 px-2 py-0.5 rounded-full border border-[#2B3443]">
              <Star className="w-3.5 h-3.5 fill-[#E9A23B]" />
              <span>{item.vote_average.toFixed(1)}</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-[#ECE9E3] tracking-tight leading-tight mb-2 sm:mb-2.5">
          {item.title}
        </h1>

        <p className="text-[#ECE9E3]/85 text-xs sm:text-sm line-clamp-2 sm:line-clamp-3 mb-4 leading-relaxed max-w-xl">
          {item.overview}
        </p>

        {/* Watch provider badges on hero if available */}
        {item.watch_providers && item.watch_providers.length > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-[11px] font-semibold text-[#8D97A8]">Tillgänglig på:</span>
            <div className="flex items-center gap-1.5">
              {item.watch_providers.map((p) => (
                <div
                  key={p.provider_id}
                  title={p.provider_name}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[#171C25] border border-[#2B3443] text-[11px] text-[#ECE9E3] shadow-md"
                >
                  <img
                    src={getImageUrl(p.logo_path, 'w300')}
                    alt={p.provider_name}
                    className="w-4 h-4 rounded-md object-cover"
                  />
                  <span className="font-semibold text-[10px]">{p.provider_name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Link
            href={detailUrl}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] font-bold text-xs sm:text-sm transition-all shadow-lg shadow-[#E9A23B]/20 hover:scale-105 active:scale-95"
          >
            <Info className="w-4 h-4" />
            <span>Mer information</span>
          </Link>

          <div className="w-auto">
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
    </div>
  );
}
