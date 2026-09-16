'use client';

import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, Play, Sparkles } from 'lucide-react';
import { Season, Episode } from '@/lib/types';
import { getWatchedEpisodes, toggleEpisodeWatched, markSeasonWatched, getUserMediaItem, saveUserMedia } from '@/lib/storage';
import { getImageUrl } from '@/lib/tmdb';
import { useAuth } from '@/context/AuthContext';

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
  const { user, openAuthModal } = useAuth();
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    seasons[0]?.season_number || 1
  );
  const [watchedSet, setWatchedSet] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const validSeasons = seasons.filter((s) => s.season_number > 0);

  // Load watched episodes
  const refreshWatched = async () => {
    if (!user) {
      setWatchedSet(new Set());
      return;
    }
    const list = await getWatchedEpisodes(showId);
    const newSet = new Set(list.map((item) => `${item.season_number}-${item.episode_number}`));
    setWatchedSet(newSet);
  };

  useEffect(() => {
    refreshWatched();
    const handleStorageChange = () => refreshWatched();
    window.addEventListener('bingelog_storage_changed', handleStorageChange);
    return () => window.removeEventListener('bingelog_storage_changed', handleStorageChange);
  }, [showId, user]);

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
    if (!user) {
      openAuthModal('signup');
      return;
    }

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
    if (!user) {
      openAuthModal('signup');
      return;
    }

    if (!currentSeason) return;
    const epCount = currentSeason.episode_count || currentEpisodes.length;
    const allSeasonWatched = currentEpisodes.every((ep) =>
      watchedSet.has(`${currentSeason.season_number}-${ep.episode_number}`)
    );

    setLoading(true);
    try {
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
    <div className="bg-[#171C25] rounded-3xl border border-[#2B3443] p-4 sm:p-6 md:p-8 shadow-xl">
      {/* Overview Progress Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-[#2B3443]">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E9A23B] uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Avsnitts-tracking</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#ECE9E3] tracking-tight">
            Dina framsteg i {showTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#8D97A8] mt-1">
            {lastWatchedEpisode ? (
              <>
                Senast sedda: <strong className="text-[#ECE9E3]">Säsong {lastWatchedEpisode.season}, Avsnitt {lastWatchedEpisode.episode}</strong>
              </>
            ) : (
              'Du har inte börjat titta än.'
            )}
          </p>
        </div>

        {/* Progress Stats */}
        <div className="flex items-center justify-between sm:justify-end gap-5 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#2B3443]/60">
          <div className="text-left sm:text-right">
            <div className="text-2xl sm:text-3xl font-black text-[#ECE9E3]">
              {totalWatchedCount} <span className="text-[#8D97A8] text-sm sm:text-lg font-normal">/ {totalShowEpisodes}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-[#8D97A8] font-medium">
              {remainingCount === 0 ? 'Alla avsnitt sedda! 🎉' : `${remainingCount} avsnitt kvar`}
            </div>
          </div>
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-4 border-[#2B3443] flex items-center justify-center relative bg-[#0F1218] flex-shrink-0">
            <span className="text-xs sm:text-sm font-bold text-[#E9A23B]">{progressPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Next Up to Watch Banner */}
      {nextEpisode && (
        <div className="mt-5 sm:mt-6 p-3.5 sm:p-4 rounded-2xl bg-[#1E2531] border border-[#2B3443] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B] flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-[#E9A23B] uppercase tracking-wide">Nästa avsnitt att se</span>
              <p className="text-xs sm:text-sm font-bold text-[#ECE9E3] truncate">
                Säsong {nextEpisode.season}, Avsnitt {nextEpisode.episode}
                {nextEpisode.name ? `: ${nextEpisode.name}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(nextEpisode!.season, nextEpisode!.episode)}
            className="flex items-center justify-center gap-2 px-4 py-2 sm:py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] active:scale-95 text-[#0F1218] text-xs font-bold shadow-md shadow-[#E9A23B]/20 transition-all flex-shrink-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
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
                    ? 'bg-[#E9A23B] text-[#0F1218] shadow-md'
                    : 'bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#2B3443]'
                }`}
              >
                <span>Säsong {season.season_number}</span>
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#6FA98A] fill-[#6FA98A]/20" />
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
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#2B3443] bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#E9A23B]" />
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
          <div className="p-8 text-center text-[#8D97A8] text-sm border border-dashed border-[#2B3443] rounded-2xl bg-[#0F1218]/40">
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
                    ? 'bg-[#171C25]/60 border-[#6FA98A]/30 opacity-90'
                    : 'bg-[#171C25] border-[#2B3443] hover:border-[#E9A23B]/40'
                }`}
              >
                <div className="flex items-start sm:items-center gap-4">
                  {/* Episode Still / Number Thumbnail */}
                  <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0 flex items-center justify-center">
                    {episode.still_path ? (
                      <img
                        src={getImageUrl(episode.still_path, 'w300')}
                        alt={episode.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-black text-[#8D97A8]">
                        E{episode.episode_number}
                      </span>
                    )}
                    {isWatched && (
                      <div className="absolute inset-0 bg-[#0F1218]/70 flex items-center justify-center">
                        <Check className="w-5 h-5 text-[#6FA98A] font-bold" />
                      </div>
                    )}
                  </div>

                  {/* Episode Meta */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#8D97A8]">
                        Avsnitt {episode.episode_number}
                      </span>
                      {episode.runtime ? (
                        <span className="text-[11px] text-[#8D97A8]/70">
                          • {episode.runtime} min
                        </span>
                      ) : null}
                      {episode.air_date ? (
                        <span className="text-[11px] text-[#8D97A8]/70 hidden md:inline">
                          • {episode.air_date}
                        </span>
                      ) : null}
                    </div>
                    <h4 className="text-sm font-semibold text-[#ECE9E3] mt-0.5 truncate">
                      {episode.name || `Avsnitt ${episode.episode_number}`}
                    </h4>
                    {episode.overview && (
                      <p className="text-xs text-[#8D97A8] line-clamp-1 mt-0.5">
                        {episode.overview}
                      </p>
                    )}
                  </div>
                </div>

                {/* Mark as watched button */}
                <button
                  type="button"
                  onClick={() => handleToggle(episode.season_number, episode.episode_number)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all self-end sm:self-auto flex-shrink-0 ${
                    isWatched
                      ? 'bg-[#6FA98A]/15 text-[#6FA98A] border border-[#6FA98A]/30 hover:bg-[#6FA98A]/25'
                      : 'bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] border border-[#2B3443] hover:border-[#E9A23B]/40'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isWatched ? 'Sedd' : 'Markera sedd'}</span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
