'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Play, Sparkles, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { UserMediaRecord } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import { getShowProgress } from '@/lib/storage';

export interface SeriesMetaInfo {
  episode_count: number;
  runtime?: number;
  status?: string;
  next_air_date?: string | null;
  next_episode?: {
    air_date: string | null;
    episode_number: number;
    season_number: number;
    name?: string;
  } | null;
  last_episode?: {
    air_date: string | null;
    episode_number: number;
    season_number: number;
    name?: string;
  } | null;
  seasons?: {
    season_number: number;
    episode_count: number;
    name?: string;
    air_date?: string | null;
  }[];
}

interface ContinueWatchingRowProps {
  items: UserMediaRecord[];
  seriesMeta: Record<number, SeriesMetaInfo>;
  onMarkNextWatched: (item: UserMediaRecord, nextSeason: number, nextEpisode: number) => Promise<void>;
}

function formatRelativeAirDate(dateStr: string | null | undefined): { isFuture: boolean; label: string } {
  if (!dateStr) return { isFuture: false, label: '' };
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const airDate = new Date(dateStr);
    airDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round((airDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { isFuture: true, label: 'Släpps idag' };
    if (diffDays === 1) return { isFuture: true, label: 'Släpps imorgon' };
    if (diffDays === 2) return { isFuture: true, label: 'Släpps i övermorgon' };
    if (diffDays > 2 && diffDays <= 7) return { isFuture: true, label: `Om ${diffDays} dagar` };
    if (diffDays > 7 && diffDays <= 30) return { isFuture: true, label: `Släpps om ${Math.round(diffDays / 7)} veckor` };
    if (diffDays > 30) {
      const formatted = airDate.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
      return { isFuture: true, label: `Släpps ${formatted}` };
    }
    // Past date
    return { isFuture: false, label: '' };
  } catch {
    return { isFuture: false, label: dateStr };
  }
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

  // Split shows: Actionable (has uncompleted episodes right now) vs Waiting for new season / episode
  const actionableShows: {
    show: UserMediaRecord;
    curSeason: number;
    curEpisode: number;
    totalInSeason: number;
    progressPct: number;
    epsLeft: number;
    nextEpisodeNumber: number;
    isStartingNewSeason?: boolean;
  }[] = [];

  const waitingShows: {
    show: UserMediaRecord;
    curSeason: number;
    curEpisode: number;
    totalInSeason: number;
    meta?: SeriesMetaInfo;
    rel: { isFuture: boolean; label: string };
    nextSeasonNumber?: number;
    isWaitingForEpisode?: boolean;
    waitingEpisodeNumber?: number;
  }[] = [];

  const nowMs = Date.now();

  watchingShows.forEach((show) => {
    const progress = getShowProgress(show.tmdb_id);
    const meta = seriesMeta[show.tmdb_id];
    let curSeason = progress.latestEpisode > 0 ? progress.latestSeason : (show.current_season || 1);
    let curEpisode = progress.latestEpisode > 0 ? progress.latestEpisode : (show.current_episode || 0);
    const seasonObj = meta?.seasons?.find((s) => s.season_number === curSeason);
    const totalInSeason = seasonObj?.episode_count || meta?.episode_count || show.total_episodes_in_season || 10;
    const isSeasonComplete = totalInSeason > 0 && curEpisode >= totalInSeason;

    if (isSeasonComplete) {
      // Check if next season exists and has already aired/started
      const nextSeasonObj = meta?.seasons?.find((s) => s.season_number === curSeason + 1);
      const nextSeasonHasAiredDate = nextSeasonObj?.air_date
        ? new Date(nextSeasonObj.air_date).getTime() <= nowMs
        : false;
      const hasAiredInNextSeason =
        (meta?.last_episode && meta.last_episode.season_number >= curSeason + 1) ||
        (meta?.next_episode && meta.next_episode.season_number === curSeason + 1 && meta.next_episode.episode_number > 1);

      const isNextSeasonAvailable = nextSeasonObj && (nextSeasonHasAiredDate || hasAiredInNextSeason);

      if (isNextSeasonAvailable) {
        // User finished season X, and season X+1 is out! Let them start season X+1 directly
        const nextSeasonTotal = nextSeasonObj.episode_count || 10;
        actionableShows.push({
          show,
          curSeason: curSeason + 1,
          curEpisode: 0,
          totalInSeason: nextSeasonTotal,
          progressPct: 0,
          epsLeft: nextSeasonTotal,
          nextEpisodeNumber: 1,
          isStartingNewSeason: true,
        });
      } else {
        // Waiting for next season
        const nextSeasonNumber = nextSeasonObj ? nextSeasonObj.season_number : curSeason + 1;
        const premiereDate =
          nextSeasonObj?.air_date ||
          (meta?.next_episode?.season_number === nextSeasonNumber ? meta.next_episode.air_date : null);
        const rel = formatRelativeAirDate(premiereDate);

        waitingShows.push({
          show,
          curSeason,
          curEpisode,
          totalInSeason,
          meta,
          rel,
          nextSeasonNumber,
          isWaitingForEpisode: false,
        });
      }
    } else {
      // Season not complete yet
      const nextEpisodeNumber = curEpisode + 1;

      // Check if next episode hasn't aired yet (caught up with currently broadcast weekly episodes)
      const isNextEpisodePending =
        meta?.next_episode &&
        meta.next_episode.season_number === curSeason &&
        meta.next_episode.episode_number === nextEpisodeNumber;

      const epRel = isNextEpisodePending ? formatRelativeAirDate(meta?.next_episode?.air_date) : { isFuture: false, label: '' };

      if (isNextEpisodePending && epRel.isFuture) {
        // Caught up with the currently broadcast episodes of this ongoing season!
        waitingShows.push({
          show,
          curSeason,
          curEpisode,
          totalInSeason,
          meta,
          rel: epRel,
          isWaitingForEpisode: true,
          waitingEpisodeNumber: nextEpisodeNumber,
        });
      } else {
        // Normal watchable episode
        const progressPct = Math.min(100, Math.round((curEpisode / totalInSeason) * 100));
        const epsLeft = Math.max(0, totalInSeason - curEpisode);
        actionableShows.push({
          show,
          curSeason,
          curEpisode,
          totalInSeason,
          progressPct,
          epsLeft,
          nextEpisodeNumber,
          isStartingNewSeason: false,
        });
      }
    }
  });

  const handleActionClick = async (show: UserMediaRecord, season: number, episode: number) => {
    if (updatingId === show.tmdb_id) return;
    setUpdatingId(show.tmdb_id);
    try {
      await onMarkNextWatched(show, season, episode);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 mb-10">
      {/* 1. Actively Watchable Shows ("Fortsätt titta") */}
      {actionableShows.length > 0 && (
        <section aria-label="Fortsätt titta">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="p-1.5 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B]">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-xl font-bold text-[#ECE9E3] tracking-tight">Fortsätt titta</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E2531] text-[#9EA8B6] border border-[#2B3443]">
              {actionableShows.length}
            </span>
          </div>

          {/* Horizontal scroll row */}
          <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#2B3443] focus:outline-none overscroll-x-contain">
            {actionableShows.map(({ show, curSeason, curEpisode, totalInSeason, progressPct, epsLeft, nextEpisodeNumber, isStartingNewSeason }) => {
              const isUpdating = updatingId === show.tmdb_id;

              return (
                <div
                  key={`continue-${show.tmdb_id}`}
                  className="flex-shrink-0 w-72 xs:w-80 sm:w-88 md:w-96 p-3.5 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/50 transition-all flex flex-col justify-between shadow-lg"
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

                      {/* Position label: explicitly clear */}
                      <p className="text-xs font-bold text-[#E9A23B] mt-0.5">
                        {isStartingNewSeason || curEpisode === 0
                          ? `Börja på säsong ${curSeason}`
                          : `Nästa: S${curSeason} A${nextEpisodeNumber}`}
                      </p>

                      {/* Scalable progressbar instead of dots */}
                      <div className="my-2 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-semibold text-[#9EA8B6]">
                          <span>
                            {curEpisode > 0 ? `Avsnitt ${curEpisode} av ${totalInSeason}` : `0 av ${totalInSeason} sedda`}
                          </span>
                          <span>{progressPct}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#0F1218] border border-[#2B3443] overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#B5721E] to-[#E9A23B] rounded-full transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Remaining episodes */}
                      <div className="text-[11px] text-[#9EA8B6]">
                        {epsLeft === 1 ? '1 avsnitt kvar i säsongen' : `${epsLeft} avsnitt kvar i säsongen`}
                      </div>
                    </div>
                  </div>

                  {/* Bottom part: Action button */}
                  <div className="mt-3 pt-3 border-t border-[#2B3443]/60">
                    <button
                      type="button"
                      onClick={() => handleActionClick(show, curSeason, nextEpisodeNumber)}
                      disabled={isUpdating}
                      className="w-full py-2 px-3 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] active:scale-[0.98] text-[#0F1218] text-xs font-bold transition-all shadow-md shadow-[#E9A23B]/20 flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#E9A23B] focus-visible:outline-none disabled:opacity-50 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {isUpdating
                          ? 'Sparar...'
                          : isStartingNewSeason || curEpisode === 0
                          ? `Börja säsong ${curSeason} avsnitt 1`
                          : `Markera A${nextEpisodeNumber} som sett`}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 2. Caught up Shows Waiting for Next Season / Episode */}
      {waitingShows.length > 0 && (
        <section aria-label="Väntar på ny säsong eller avsnitt">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="p-1.5 rounded-xl bg-[#6FA98A]/15 text-[#6FA98A]">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-[#ECE9E3] tracking-tight">Väntar på ny säsong / avsnitt</h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E2531] text-[#9EA8B6] border border-[#2B3443]">
              {waitingShows.length}
            </span>
          </div>

          <div className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-[#2B3443] focus:outline-none overscroll-x-contain">
            {waitingShows.map(
              ({
                show,
                curSeason,
                curEpisode,
                totalInSeason,
                meta,
                rel,
                nextSeasonNumber,
                isWaitingForEpisode,
                waitingEpisodeNumber,
              }) => {
                const isEnded = meta?.status === 'Ended' || meta?.status === 'Canceled';

                return (
                  <div
                    key={`waiting-${show.tmdb_id}`}
                    className="flex-shrink-0 w-72 xs:w-80 sm:w-88 md:w-96 p-3.5 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#6FA98A]/40 transition-all flex flex-col justify-between shadow-lg"
                  >
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
                          className="font-bold text-sm text-[#ECE9E3] hover:text-[#6FA98A] transition-colors line-clamp-1"
                          title={show.title}
                        >
                          {show.title}
                        </Link>

                        {/* Status text */}
                        {isWaitingForEpisode ? (
                          <div className="flex items-center gap-1.5 text-xs text-[#E9A23B] font-semibold mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-[#6FA98A]" />
                            <span>Ikapp med sända avsnitt (A{curEpisode}/{totalInSeason})</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-[#6FA98A] font-semibold mt-1">
                            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Säsong {curSeason} sedd (alla {totalInSeason} avsnitt)</span>
                          </div>
                        )}

                        {/* Status & Premiere details */}
                        <div className="mt-2.5">
                          {isWaitingForEpisode ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E9A23B]/10 text-[#E9A23B] border border-[#E9A23B]/30 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>S{curSeason} A{waitingEpisodeNumber}: {rel.label}</span>
                            </div>
                          ) : rel.label ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#E9A23B]/10 text-[#E9A23B] border border-[#E9A23B]/30 text-xs font-semibold">
                              <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Säsong {nextSeasonNumber}: {rel.label}</span>
                            </div>
                          ) : isEnded ? (
                            <div className="text-xs text-[#9EA8B6] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#9EA8B6]" />
                              <span>Serien är avslutad</span>
                            </div>
                          ) : (
                            <div className="text-xs text-[#9EA8B6] flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-[#9EA8B6]" />
                              <span>Nästa säsong ej bekräftad ännu</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Informative muted button */}
                    <div className="mt-3 pt-3 border-t border-[#2B3443]/60">
                      <div className="w-full py-2 px-3 rounded-xl bg-[#0F1218] border border-[#2B3443] text-xs font-semibold text-[#9EA8B6] text-center flex items-center justify-center gap-1.5 select-none">
                        <Clock className="w-3.5 h-3.5 text-[#9EA8B6]" />
                        <span>
                          {isWaitingForEpisode
                            ? `S${curSeason} A${waitingEpisodeNumber} ${rel.label.toLowerCase()}`
                            : rel.label
                            ? `Säsong ${nextSeasonNumber} ${rel.label.toLowerCase()}`
                            : isEnded
                            ? 'Alla avsnitt sedda'
                            : 'Väntar på ny säsong'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </section>
      )}
    </div>
  );
}
