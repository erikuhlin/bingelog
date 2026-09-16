'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Check, ChevronRight, Sparkles, Calendar } from 'lucide-react';
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
        <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-500">
          <Play className="w-4 h-4 fill-rose-500" />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Fortsätt titta</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
          {watchingShows.length}
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex items-stretch gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-zinc-800 focus:outline-none">
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
              className="flex-shrink-0 w-80 sm:w-96 p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700/80 transition-all flex flex-col justify-between shadow-lg"
            >
              {/* Top part: Poster & Title info */}
              <div className="flex items-start gap-3.5">
                <Link
                  href={`/tv/${show.tmdb_id}`}
                  className="w-[74px] aspect-[2/3] rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0 border border-zinc-800 hover:opacity-90 transition-opacity"
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
                    className="font-bold text-sm text-white hover:text-rose-400 transition-colors line-clamp-1"
                    title={show.title}
                  >
                    {show.title}
                  </Link>

                  {/* Position text */}
                  <p className="text-xs font-semibold text-rose-400 mt-0.5">
                    {curEpisode === 0
                      ? `Säsong ${curSeason}`
                      : `Säsong ${curSeason}, avsnitt ${curEpisode}`}
                  </p>

                  {/* Filmstrip visualization (decorative for screen readers) */}
                  <div
                    aria-hidden="true"
                    className="flex items-center gap-1 my-2 py-0.5 overflow-x-hidden"
                  >
                    {Array.from({ length: Math.min(totalInSeason, 24) }, (_, idx) => {
                      const epNum = idx + 1;
                      const isSeen = epNum <= curEpisode;
                      const isCurrent = epNum === curEpisode;

                      return (
                        <div
                          key={`strip-${epNum}`}
                          className={`rounded-full transition-all duration-300 ${
                            isCurrent
                              ? 'w-2 h-3.5 bg-rose-500 shadow-sm shadow-rose-500/50'
                              : isSeen
                              ? 'w-1.5 h-2 bg-rose-800/70'
                              : 'w-1.5 h-1.5 bg-zinc-800'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Remaining episodes or Next season indicator */}
                  <div className="text-[11px] text-zinc-400">
                    {isSeasonComplete ? (
                      meta?.next_air_date ? (
                        <span className="flex items-center gap-1 text-sky-400">
                          <Calendar className="w-3 h-3" />
                          <span>Nästa säsong: {meta.next_air_date}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-500 italic">Väntar på nästa säsong</span>
                      )
                    ) : (
                      <span>{epsLeft} {epsLeft === 1 ? 'avsnitt kvar' : 'avsnitt kvar i säsongen'}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom part: Action button */}
              <div className="mt-3 pt-3 border-t border-zinc-800/60">
                {isSeasonComplete ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-2 px-3 rounded-xl bg-zinc-800/60 text-zinc-500 text-xs font-semibold cursor-not-allowed text-center border border-zinc-800"
                  >
                    Säsongen klar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleActionClick}
                    disabled={isUpdating}
                    className="w-full py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-md shadow-rose-950/40 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none disabled:opacity-50"
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
