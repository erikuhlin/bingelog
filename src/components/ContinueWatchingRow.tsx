'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Check, Sparkles, Calendar } from 'lucide-react';
import { UserMediaRecord } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';

export interface SeriesMetaInfo {
  episode_count: number;
  runtime?: number;
  status?: string;
  next_air_date?: string | null;
}

interface ContinueWatchingRowProps {
  items: UserMediaRecord[];
  seriesMeta: Record<number, SeriesMetaInfo>;
  onMarkNextWatched: (item: UserMediaRecord, nextSeason: number, nextEpisode: number) => Promise<void>;
}

export default function ContinueWatchingRow({
  items,
  seriesMeta,
  onMarkNextWatched,
}: ContinueWatchingRowProps) {
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  // Strictly TV shows with status 'watching'
  const watchingShows = items.filter(
    (item) => item.media_type === 'tv' && item.status === 'watching'
  );

  if (watchingShows.length === 0) {
    return null;
  }

  return (
    <section className="mb-10" aria-label="Fortsätt titta">
      <div className="flex items-center gap-2 mb-3.5">
        <div className="p-1.5 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B]">
          <Play className="w-4 h-4 fill-current" />
        </div>
        <h2 className="text-xl font-bold text-[#ECE9E3] tracking-tight">Fortsätt titta</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E2531] text-[#8D97A8] border border-[#2B3443]">
          {watchingShows.length}
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#2B3443] focus:outline-none">
        {watchingShows.map((show) => {
          const meta = seriesMeta[show.tmdb_id];
          const curSeason = show.current_season || 1;
          const curEpisode = show.current_episode || 0;
          const totalInSeason = meta?.episode_count || show.total_episodes_in_season || 10;
          const epsLeft = Math.max(0, totalInSeason - curEpisode);
          const isSeasonComplete = totalInSeason > 0 && curEpisode >= totalInSeason;
          const isUpdating = updatingId === show.tmdb_id;

          const handleActionClick = async () => {
            if (isSeasonComplete || isUpdating) return;
            setUpdatingId(show.tmdb_id);
            try {
              await onMarkNextWatched(show, curSeason, curEpisode + 1);
            } finally {
              setUpdatingId(null);
            }
          };

          return (
            <div
              key={`continue-${show.tmdb_id}`}
              className="flex-shrink-0 w-80 sm:w-96 p-3.5 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/50 transition-all flex flex-col justify-between shadow-lg"
            >
              {/* Top part: Poster & Title info */}
              <div className="flex items-start gap-3.5">
                <Link
                  href={`/tv/${show.tmdb_id}`}
                  className="w-[74px] aspect-[2/3] rounded-xl overflow-hidden bg-[#0F1218] flex-shrink-0 border border-[#2B3443] hover:opacity-90 transition-opacity"
                >
                  <img
                    src={getImageUrl(show.poster_path, 'w300')}
                    alt={show.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </Link>

                <div className="flex-1 min-w-0">
                  <Link
                    href={`/tv/${show.tmdb_id}`}
                    className="font-bold text-sm text-[#ECE9E3] hover:text-[#E9A23B] transition-colors line-clamp-1"
                    title={show.title}
                  >
                    {show.title}
                  </Link>

                  {/* Position text */}
                  <p className="text-xs font-semibold text-[#E9A23B] mt-0.5">
                    {curEpisode === 0
                      ? `Säsong ${curSeason}`
                      : `Säsong ${curSeason}, avsnitt ${curEpisode}`}
                  </p>

                  {/* Filmstrip visualization matching the exact brand color steps */}
                  <div
                    aria-hidden="true"
                    className="flex items-center gap-1 my-2 py-0.5 overflow-x-hidden"
                  >
                    {Array.from({ length: Math.min(totalInSeason, 24) }, (_, idx) => {
                      const epNum = idx + 1;
                      const isSeen = epNum < curEpisode;
                      const isCurrent = epNum === curEpisode;

                      return (
                        <div
                          key={`strip-${epNum}`}
                          className={`rounded-full transition-all duration-300 ${
                            isCurrent
                              ? 'w-2 h-3.5 bg-[#E9A23B] shadow-sm shadow-[#E9A23B]/50' // --amber (primär accent)
                              : isSeen
                              ? 'w-1.5 h-2 bg-[#7A5A21]' // --amber-dim (sedda avsnitt)
                              : 'w-1.5 h-1.5 bg-[#2B3443]' // --line (osedda staplar)
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Remaining episodes or Next season indicator */}
                  <div className="text-[11px] text-[#8D97A8]">
                    {isSeasonComplete ? (
                      meta?.next_air_date ? (
                        <span className="flex items-center gap-1 text-[#6FA98A]">
                          <Calendar className="w-3 h-3" />
                          <span>Nästa säsong: {meta.next_air_date}</span>
                        </span>
                      ) : (
                        <span className="text-[#8D97A8] italic">Väntar på nästa säsong</span>
                      )
                    ) : (
                      <span>{epsLeft} {epsLeft === 1 ? 'avsnitt kvar' : 'avsnitt kvar i säsongen'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom part: Action button */}
              <div className="mt-3 pt-3 border-t border-[#2B3443]/60">
                {isSeasonComplete ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 rounded-xl bg-[#1E2531] text-[#8D97A8] text-xs font-semibold cursor-not-allowed text-center border border-[#2B3443]"
                  >
                    Säsongen klar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    disabled={isUpdating}
                    className="w-full py-2 px-3 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] active:scale-[0.98] text-[#0F1218] text-xs font-bold transition-all shadow-md shadow-[#E9A23B]/20 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#E9A23B] focus-visible:outline-none disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>
                      {isUpdating
                        ? 'Uppdaterar...'
                        : curEpisode === 0
                        ? `Börja avsnitt 1`
                        : `Markera avsnitt ${curEpisode + 1} sett`}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
