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
  const [seasonEpisodesCache, setSeasonEpisodesCache] = useState<Record<number, Episode[]>>({});
  const [loadingSeason, setLoadingSeason] = useState(false);
  const [loading, setLoading] = useState(false);

  const validSeasons = seasons.filter((s) => s.season_number > 0);

  // Fetch detailed episodes for the selected season if not already loaded
  useEffect(() => {
    const active = validSeasons.find((s) => s.season_number === selectedSeasonNumber);
    if (!active) return;

    // If season already has episodes from props or cache, no fetch needed
    if (active.episodes && active.episodes.length > 0) return;
    if (seasonEpisodesCache[selectedSeasonNumber]) return;

    let isMounted = true;
    setLoadingSeason(true);

    fetch(`/api/tv/${showId}/season/${selectedSeasonNumber}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data?.episodes) return;
        setSeasonEpisodesCache((prev) => ({
          ...prev,
          [selectedSeasonNumber]: data.episodes,
        }));
      })
      .catch((err) => console.warn('Could not fetch season episodes:', err))
      .finally(() => {
        if (isMounted) setLoadingSeason(false);
      });

    return () => {
      isMounted = false;
    };
  }, [showId, selectedSeasonNumber, validSeasons, seasonEpisodesCache]);

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
  }, [showId, user]);

  // Active season data
  const currentSeason = validSeasons.find((s) => s.season_number === selectedSeasonNumber) || validSeasons[0];

  // Resolve current episodes: 1. From cache, 2. From props, 3. Generated fallback 1..count
  const fetchedEpisodes = seasonEpisodesCache[selectedSeasonNumber] || currentSeason?.episodes || [];
  const epCount = currentSeason?.episode_count || fetchedEpisodes.length || 8;
  const currentEpisodes: Episode[] =
    fetchedEpisodes.length > 0
      ? fetchedEpisodes
      : Array.from({ length: epCount }, (_, idx) => ({
          id: idx + 1,
          name: `Avsnitt ${idx + 1}`,
          episode_number: idx + 1,
          season_number: selectedSeasonNumber,
          overview: '',
          air_date: null,
          still_path: null,
          vote_average: 0,
        }));

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
    const eps = seasonEpisodesCache[s.season_number] || s.episodes || [];
    const count = s.episode_count || eps.length || 0;
    for (let i = 1; i <= count; i++) {
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
    const key = `${seasonNum}-${episodeNum}`;
    const willBeWatched = !watchedSet.has(key);

    // Optimistically update local watchedSet state immediately so checkbox and progress are instant
    const updatedSet = new Set(watchedSet);
    if (willBeWatched) {
      updatedSet.add(key);
    } else {
      updatedSet.delete(key);
    }
    setWatchedSet(updatedSet);

    try {
      const existing = await getUserMediaItem(showId, 'tv');
      await toggleEpisodeWatched(showId, seasonNum, episodeNum);

      // Compute latest watched episode across all watched episodes
      let latestSeason = 1;
      let latestEp = 0;
      updatedSet.forEach((epKey) => {
        const [s, ep] = epKey.split('-').map(Number);
        if (s > latestSeason || (s === latestSeason && ep > latestEp)) {
          latestSeason = s;
          latestEp = ep;
        }
      });

      const isShowCompleted = totalShowEpisodes > 0 && updatedSet.size >= totalShowEpisodes;
      const nextStatus = isShowCompleted
        ? 'completed'
        : updatedSet.size > 0
        ? (existing?.status === 'watchlist' || !existing ? 'watching' : existing.status)
        : (existing?.status || 'watching');

      await saveUserMedia({
        tmdb_id: showId,
        media_type: 'tv',
        title: showTitle,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        status: nextStatus,
        current_season: latestSeason,
        current_episode: latestEp,
      });
    } catch (err) {
      console.error('Error toggling episode:', err);
    }
  };

  // Handle marking entire season
  const handleSeasonToggleAll = async () => {
    if (!currentSeason) return;
    const count = currentSeason.episode_count || currentEpisodes.length;
    const allSeasonWatched = currentEpisodes.every((ep) =>
      watchedSet.has(`${currentSeason.season_number}-${ep.episode_number}`)
    );
    const targetState = !allSeasonWatched;

    // Optimistically update UI
    const updatedSet = new Set(watchedSet);
    currentEpisodes.forEach((ep) => {
      const key = `${currentSeason.season_number}-${ep.episode_number}`;
      if (targetState) {
        updatedSet.add(key);
      } else {
        updatedSet.delete(key);
      }
    });
    setWatchedSet(updatedSet);

    setLoading(true);
    try {
      const existing = await getUserMediaItem(showId, 'tv');
      await markSeasonWatched(showId, currentSeason.season_number, count, targetState);

      let latestSeason = 1;
      let latestEp = 0;
      updatedSet.forEach((epKey) => {
        const [s, ep] = epKey.split('-').map(Number);
        if (s > latestSeason || (s === latestSeason && ep > latestEp)) {
          latestSeason = s;
          latestEp = ep;
        }
      });

      const isShowCompleted = totalShowEpisodes > 0 && updatedSet.size >= totalShowEpisodes;
      const nextStatus = isShowCompleted
        ? 'completed'
        : updatedSet.size > 0
        ? (existing?.status === 'watchlist' || !existing ? 'watching' : existing.status)
        : (existing?.status || 'watching');

      await saveUserMedia({
        tmdb_id: showId,
        media_type: 'tv',
        title: showTitle,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        status: nextStatus,
        current_season: latestSeason,
        current_episode: latestEp,
      });
    } catch (err) {
      console.error('Error marking season:', err);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#2B3443]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#E9A23B] uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Avsnitts-tracker</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#ECE9E3] tracking-tight">
            Dina framsteg i {showTitle}
          </h2>
          <p className="text-xs sm:text-sm text-[#8D97A8] mt-0.5">
            {lastWatchedEpisode ? (
              <>
                Senast sedda: <strong className="text-[#ECE9E3]">Säsong {lastWatchedEpisode.season}, Avsnitt {lastWatchedEpisode.episode}</strong>
              </>
            ) : (
              'Du har inte börjat titta än.'
            )}
          </p>
        </div>

        {/* Compact Progress Stats */}
        <div className="flex items-center gap-4 bg-[#1E2531]/60 px-4 py-2.5 rounded-2xl border border-[#2B3443]/60 self-start sm:self-auto w-full sm:w-auto justify-between sm:justify-start">
          <div>
            <div className="text-lg sm:text-xl font-black text-[#ECE9E3] leading-none">
              {totalWatchedCount} <span className="text-[#8D97A8] text-xs font-normal">/ {totalShowEpisodes} sedda</span>
            </div>
            <div className="text-[11px] text-[#8D97A8] mt-0.5">
              {remainingCount === 0 ? 'Hela serien sedd! 🎉' : `${remainingCount} avsnitt kvar`}
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-10 h-10 rounded-full border-2 border-[#E9A23B] flex items-center justify-center bg-[#0F1218] text-xs font-bold text-[#E9A23B]">
              {progressPercentage}%
            </div>
          </div>
        </div>
      </div>

      {/* Guest sync callout banner (if not logged in) */}
      {!user && (
        <div className="mt-4 p-3 rounded-2xl bg-[#1E2531]/60 border border-[#2B3443] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-[#8D97A8]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#E9A23B] flex-shrink-0" />
            <span>Dina sedda avsnitt sparas i din webbläsare. Logga in för att molnsynka till andra enheter.</span>
          </div>
          <button
            type="button"
            onClick={() => openAuthModal('signup')}
            className="text-[#E9A23B] hover:text-[#F2B04E] font-bold underline whitespace-nowrap cursor-pointer"
          >
            Skapa gratis konto
          </button>
        </div>
      )}

      {/* Next Up to Watch Banner */}
      {nextEpisode && (
        <div className="mt-4 sm:mt-5 p-3.5 rounded-2xl bg-[#1E2531] border border-[#2B3443] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B] flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#E9A23B] uppercase tracking-wide block">Nästa avsnitt att se</span>
              <p className="text-xs sm:text-sm font-bold text-[#ECE9E3] truncate">
                Säsong {nextEpisode.season}, Avsnitt {nextEpisode.episode}
                {nextEpisode.name ? `: ${nextEpisode.name}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleToggle(nextEpisode!.season, nextEpisode!.episode)}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-1.5 rounded-xl bg-[#E9A23B] hover:bg-[#F2B04E] active:scale-95 text-[#0F1218] text-xs font-bold shadow-md shadow-[#E9A23B]/20 transition-all cursor-pointer flex-shrink-0"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Markera som sedd</span>
          </button>
        </div>
      )}

      {/* Seasons Tabs & Bulk Action */}
      <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none w-full sm:w-auto">
          {validSeasons.map((season) => {
            const isSelected = season.season_number === selectedSeasonNumber;
            const seasonWatchedCount = Array.from(watchedSet).filter((key) =>
              key.startsWith(`${season.season_number}-`)
            ).length;
            const isComplete = season.episode_count
              ? seasonWatchedCount >= season.episode_count
              : false;

            return (
              <button
                key={season.season_number}
                type="button"
                onClick={() => setSelectedSeasonNumber(season.season_number)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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
                    ({seasonWatchedCount}/{season.episode_count || 0})
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
          className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#2B3443] bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] transition-colors flex items-center justify-center gap-1.5 w-full sm:w-auto cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-[#E9A23B]" />
          <span>
            {isCurrentSeasonComplete
              ? 'Återställ hela säsongen'
              : 'Markera säsongen som sedd'}
          </span>
        </button>
      </div>

      {/* Episode List */}
      <div className="mt-4 space-y-2.5">
        {currentEpisodes.map((episode) => {
          const isWatched = watchedSet.has(
            `${episode.season_number}-${episode.episode_number}`
          );

          return (
            <div
              key={episode.id || episode.episode_number}
              className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                isWatched
                  ? 'bg-[#171C25]/60 border-[#6FA98A]/30 opacity-90'
                  : 'bg-[#171C25] border-[#2B3443] hover:border-[#E9A23B]/40'
              }`}
            >
              {/* Left: Thumbnail & Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Episode Still / Number Thumbnail */}
                <div className="relative w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0 flex items-center justify-center">
                  {episode.still_path ? (
                    <img
                      src={getImageUrl(episode.still_path, 'w300')}
                      alt={episode.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[11px] sm:text-xs font-black text-[#8D97A8]">
                      E{episode.episode_number}
                    </span>
                  )}
                  {isWatched && (
                    <div className="absolute inset-0 bg-[#0F1218]/70 flex items-center justify-center">
                      <Check className="w-4 h-4 text-[#6FA98A] font-bold" />
                    </div>
                  )}
                </div>

                {/* Episode Meta */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] sm:text-xs font-bold text-[#8D97A8]">
                      Avsnitt {episode.episode_number}
                    </span>
                    {episode.runtime ? (
                      <span className="text-[10px] sm:text-[11px] text-[#8D97A8]/70">
                        • {episode.runtime} min
                      </span>
                    ) : null}
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-[#ECE9E3] truncate">
                    {episode.name || `Avsnitt ${episode.episode_number}`}
                  </h4>
                  {episode.overview && (
                    <p className="text-[11px] text-[#8D97A8] line-clamp-1 mt-0.5 hidden sm:block">
                      {episode.overview}
                    </p>
                  )}
                </div>
              </div>

              {/* Right: Mark as watched button */}
              <button
                type="button"
                onClick={() => handleToggle(episode.season_number, episode.episode_number)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                  isWatched
                    ? 'bg-[#6FA98A]/15 text-[#6FA98A] border border-[#6FA98A]/30 hover:bg-[#6FA98A]/25'
                    : 'bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] border border-[#2B3443] hover:border-[#E9A23B]/40'
                }`}
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden xs:inline">{isWatched ? 'Sedd' : 'Markera sedd'}</span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
