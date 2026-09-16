'use client';

import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, ChevronRight, Play, Eye, Sparkles } from 'lucide-react';
import { Season, Episode } from '@/lib/types';
import { getWatchedEpisodes, toggleEpisodeWatched, markSeasonWatched, getUserMediaItem, saveUserMedia } from '@/lib/storage';
import { getImageUrl } from '@/lib/tmdb';

interface EpisodeTrackerProps {
  showId: number;
  showTitle: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasons: Season[];
}

export default function EpisodeTracker({
  showId,
  showTitle,
  posterPath,
  backdropPath,
  seasons,
}: EpisodeTrackerProps) {
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons[0]?.season_number || 1
  );
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const validSeasons = seasons.filter((s) => s.season_number > 0);

  // Load watched episodes
  const refreshWatched = async () => {
    const list = await getWatchedEpisodes(showId);
    const newSet = new Set(list.map((item) => `${item.season_number}-${item.episode_number}`));
    setWatchedSet(newSet);
  };

  useEffect(() => {
    refreshWatched();
    const handleStorageChange = () => refreshWatched();
    window.addEventListener('bingelog_storage_changed', handleStorageChange);
    return () => window.removeEventListener('bingelog_storage_changed', handleStorageChange);
  }, [showId]);

  // Active season data
  const currentSeason = validSeasons.find((s) => s.season_number === selectedSeasonNumber) || validSeasons[0];
  const currentEpisodes: Episode[] = currentSeason?.episodes || [];

  // Total statistics calculation
  let totalShowEpisodes = 0;
  validSeasons.forEach((s) => {
    totalShowEpisodes += s.episode_count || s.episodes?.length || 0;
  });

  const totalWatchedCount = watchedSet.size;
  const progressPercentage = totalShowEpisodes > 0 ? Math.round((totalWatchedCount / totalShowEpisodes) * 100) : 0;
  const remainingCount = Math.max(0, totalShowEpisodes - totalWatchedCount);

  // Find next episode to watch
  let nextEpisode: { season: number; episode: number; name?: string } | null = null;
  let lastWatchedEpisode: { season: number; episode: number } | null = null;

  for (const s of validSeasons) {
    const eps = s.episodes || [];
    for (let i = 1; i <= (s.episode_count || eps.length); i++) {
      const isWatched = watchedSet.has(`${s.season_number}-${i}`);
      if (isWatched) {
        lastWatchedEpisode = { season: s.season_number, episode: i };
      } else if (!nextEpisode) {
        const epData = eps.find((e) => e.episode_number === i);
        nextEpisode = {
          season: s.season_number,
          episode: i,
          name: epData?.name,
        };
      }
    }
  }

  // Handle toggling an episode
  const handleToggle = async (seasonNum: number, episodeNum: number) => {
    // Ensure show is saved in user's list (default to 'watching')
    const existing = await getUserMediaItem(showId, 'tv');
    await toggleEpisodeWatched(showId, seasonNum, episodeNum);

    const isNowWatched = !watchedSet.has(`${seasonNum}-${episodeNum}`);
    await saveUserMedia({
      tmdb_id: showId,
      media_type: 'tv',
      title: showTitle,
      poster_path: posterPath,
      backdrop_path: backdropPath,
      status: existing?.status || 'watching',
      current_season: isNowWatched ? seasonNum : (existing?.current_season || seasonNum),
      current_episode: isNowWatched ? episodeNum : (existing?.current_episode || 0),
    });

    await refreshWatched();
  };

  // Handle marking entire season
  const handleSeasonToggleAll = async () => {
    if (!currentSeason) return;
    const epCount = currentSeason.episode_count || currentEpisodes.length;
    const allSeasonWatched = currentEpisodes.every((ep) =>
      watchedSet.has(`${currentSeason.season_number}-${ep.episode_number}`)
    );

    setLoading(true);
    try {
      // Ensure in watching list
      const existing = await getUserMediaItem(showId, 'tv');
      if (!existing) {
        await saveUserMedia({
          tmdb_id: showId,
          media_type: 'tv',
          title: showTitle,
          poster_path: posterPath,
          backdrop_path: backdropPath,
          status: 'watching',
        });
      }

      await markSeasonWatched(showId, currentSeason.season_number, epCount, !allSeasonWatched);
      await refreshWatched();
    } finally {
      setLoading(false);
    }
  };

  const isCurrentSeasonComplete =
    currentEpisodes.length > 0 &&
    currentEpisodes.every((ep) => watchedSet.has(`${currentSeason?.season_number}-${ep.episode_number}`));

  return (
    <div className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-4 sm:p-6 md:p-8 shadow-xl">
      {/* Overview Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Avsnitts-tracking</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Dina framsteg i {showTitle}
          </h2>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            {lastWatchedEpisode ? (
              <>
                Senast sedda: <strong className="text-zinc-200">Säsong {lastWatchedEpisode.season}, Avsnitt {lastWatchedEpisode.episode}</strong>
              </>
            ) : (
              'Du har inte börjat titta än.'
            )}
          </p>
        </div>

        {/* Progress Stats */}
        <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800/60">
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-black text-white">
              {totalWatchedCount} <span className="text-zinc-500 text-sm sm:text-lg font-normal">/ {totalShowEpisodes}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-zinc-400 font-medium">
              {remainingCount === 0 ? 'Alla avsnitt sedda! 🎉' : `${remainingCount} avsnitt kvar`}
            </div>
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-zinc-800 flex items-center justify-center relative bg-zinc-950 flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold text-rose-500">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Next Up to Watch Banner */}
      {nextEpisode && (
        <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-zinc-900 to-zinc-900 border border-rose-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-rose-400" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-semibold text-rose-400 uppercase tracking-wide">Nästa avsnitt att se</span>
              <p className="text-xs sm:text-sm font-bold text-zinc-100 truncate">
                Säsong {nextEpisode.season}, Avsnitt {nextEpisode.episode}
                {nextEpisode.name ? `: ${nextEpisode.name}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(nextEpisode!.season, nextEpisode!.episode)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-semibold shadow-md shadow-rose-900/40 transition-all flex-shrink-0"
          >
            <Check className="w-4 h-4" />
            <span>Markera som sedd</span>
          </button>
        </div>
      )}

      {/* Seasons Tabs & Actions */}
      <div className="mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {validSeasons.map((season) => {
            const isSelected = season.season_number === selectedSeasonNumber;
            const seasonWatchedCount = (season.episodes || []).filter((ep) =>
              watchedSet.has(`${season.season_number}-${ep.episode_number}`)
            ).length;
            const isComplete = season.episodes?.length
              ? seasonWatchedCount === season.episodes.length
              : false;

            return (
              <button
                key={season.season_number}
                type="button"
                onClick={() => setSelectedSeasonNumber(season.season_number)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-zinc-100 text-zinc-950 shadow-md'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
              >
                <span>Säsong {season.season_number}</span>
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                ) : (
                  <span className="text-[10px] opacity-70">
                    ({seasonWatchedCount}/{season.episode_count || season.episodes?.length || 0})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bulk Action for Active Season */}
        <button
          type="button"
          disabled={loading}
          onClick={handleSeasonToggleAll}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-rose-400" />
          <span>
            {isCurrentSeasonComplete
              ? 'Återställ hela säsongen'
              : 'Markera hela säsongen som sedd'}
          </span>
        </button>
      </div>

      {/* Episode List */}
      <div className="mt-6 space-y-3">
        {currentEpisodes.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm border border-dashed border-zinc-800 rounded-2xl">
            Ingen detaljerad avsnittslista tillgänglig för denna säsong än.
          </div>
        ) : (
          currentEpisodes.map((episode) => {
            const isWatched = watchedSet.has(
              `${episode.season_number}-${episode.episode_number}`
            );

            return (
              <div
                key={episode.id || episode.episode_number}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isWatched
                    ? 'bg-zinc-950/40 border-emerald-950/40 opacity-90'
                    : 'bg-zinc-900/90 border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Episode Still / Number Thumbnail */}
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, 'w300')}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-zinc-500">
                        E{episode.episode_number}
                      </span>
                    )}
                    {isWatched && (
                      <div className="absolute inset-0 bg-emerald-950/70 flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald-400 font-bold" />
                      </div>
                    )}
                  </div>

                  {/* Episode Meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400">
                        Avsnitt {episode.episode_number}
                      </span>
                      {episode.runtime ? (
                        <span className="text-[11px] text-zinc-500">
                          • {episode.runtime} min
                        </span>
                      ) : null}
                      {episode.air_date ? (
                        <span className="text-[11px] text-zinc-500 hidden md:inline">
                          • {episode.air_date}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-sm font-semibold text-zinc-100 mt-0.5 truncate">
                      {episode.name || `Avsnitt ${episode.episode_number}`}
                    </h4>
                    {episode.overview && (
                      <p className="text-xs text-zinc-400 line-clamp-1 mt-0.5">
                        {episode.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggle(episode.season_number, episode.episode_number)}
                  className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold transition-all flex-shrink-0 active:scale-95 ${
                    isWatched
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/25'
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                  }`}
                >
                  <Check className={`w-4 h-4 ${isWatched ? 'text-emerald-400 stroke-[2.5]' : 'text-zinc-500'}`} />
                  <span>{isWatched ? 'Sedd' : 'Markera som sedd'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
