'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Eye, ArrowRight, Tv, Play } from 'lucide-react';
import { getUserMediaList, getShowProgress } from '@/lib/storage';
import { UserMediaRecord } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';
import { useAuth } from '@/context/AuthContext';

interface SeriesMeta {
  episode_count: number;
  seasons?: {
    season_number: number;
    episode_count: number;
  }[];
}

export default function ContinueWatchingSection() {
  const { user } = useAuth();
  const [watchingShows, setWatchingShows] = useState<UserMediaRecord[]>([]);
  const [seriesMeta, setSeriesMeta] = useState<Record<number, SeriesMeta>>({});

  const loadWatching = async () => {
    const list = await getUserMediaList();
    const active = list.filter((item) => item.media_type === 'tv' && item.status === 'watching');
    setWatchingShows(active);

    if (active.length > 0) {
      const ids = active.map((s) => s.tmdb_id);
      try {
        const res = await fetch(`/api/library/series-cache?ids=${ids.join(',')}`);
        if (res.ok) {
          const json = await res.json();
          const results = json.results || {};
          const metaMap: Record<number, SeriesMeta> = {};
          Object.entries(results).forEach(([idStr, data]: [string, any]) => {
            const id = parseInt(idStr, 10);
            metaMap[id] = {
              episode_count: data.seasons?.[0]?.episode_count || 10,
              seasons: data.seasons || [],
            };
          });
          setSeriesMeta((prev) => ({ ...prev, ...metaMap }));
        }
      } catch (err) {
        console.warn('Could not fetch series cache for ContinueWatchingSection:', err);
      }
    }
  };

  useEffect(() => {
    loadWatching();
    const handler = () => loadWatching();
    window.addEventListener('bingelog_storage_changed', handler);
    return () => window.removeEventListener('bingelog_storage_changed', handler);
  }, [user]);

  if (watchingShows.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B]">
            <Eye className="w-4 h-4" />
          </div>
          <h2 className="text-xl font-bold text-[#ECE9E3] tracking-tight">Tittar på</h2>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#1E2531] text-[#8D97A8] border border-[#2B3443]">
            {watchingShows.length}
          </span>
        </div>
        <Link
          href="/library?status=watching"
          className="text-xs font-semibold text-[#E9A23B] hover:text-[#F2B04E] flex items-center gap-1 transition-colors"
        >
          <span>Öppna biblioteket</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchingShows.map((show) => {
          const progress = getShowProgress(show.tmdb_id);
          const curSeason = progress.latestEpisode > 0 ? progress.latestSeason : (show.current_season || 1);
          const curEpisode = progress.latestEpisode > 0 ? progress.latestEpisode : (show.current_episode || 0);

          const seasonObj = seriesMeta[show.tmdb_id]?.seasons?.find((s) => s.season_number === curSeason);
          const totalInSeason =
            seasonObj?.episode_count ||
            show.total_episodes_in_season ||
            seriesMeta[show.tmdb_id]?.episode_count ||
            (curEpisode > 0 ? Math.max(curEpisode, 10) : 10);

          const progressPct = totalInSeason > 0 ? Math.min(100, Math.round((curEpisode / totalInSeason) * 100)) : 0;
          const remaining = Math.max(0, totalInSeason - curEpisode);

          return (
            <Link
              key={show.tmdb_id}
              href={`/tv/${show.tmdb_id}`}
              className="group p-3.5 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/50 transition-all flex items-center gap-3.5 hover:shadow-lg"
            >
              <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[#0F1218] flex-shrink-0 border border-[#2B3443]">
                <img
                  src={getImageUrl(show.poster_path, 'w300')}
                  alt={show.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[11px] font-bold text-[#E9A23B] uppercase tracking-wide truncate">
                    {curEpisode > 0
                      ? `S${curSeason} · Avsnitt ${curEpisode} av ${totalInSeason}`
                      : `Börja på säsong ${curSeason}`}
                  </span>
                  <span className="text-[10px] font-semibold text-[#8D97A8] flex-shrink-0">
                    {progressPct}%
                  </span>
                </div>

                <h3 className="text-sm font-bold text-[#ECE9E3] truncate mt-0.5 group-hover:text-[#E9A23B] transition-colors">
                  {show.title}
                </h3>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-[#0F1218] border border-[#2B3443] overflow-hidden my-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#B5721E] to-[#E9A23B] rounded-full transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#8D97A8]">
                  <p className="flex items-center gap-1 truncate">
                    <Tv className="w-3 h-3 text-[#8D97A8] flex-shrink-0" />
                    <span>
                      {remaining === 0
                        ? 'Säsong sedd'
                        : remaining === 1
                        ? '1 avsnitt kvar'
                        : `${remaining} avsnitt kvar`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="w-8 h-8 rounded-full bg-[#1E2531] border border-[#2B3443] flex items-center justify-center text-[#ECE9E3] group-hover:bg-[#E9A23B] group-hover:text-[#0F1218] transition-colors flex-shrink-0 ml-1">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
