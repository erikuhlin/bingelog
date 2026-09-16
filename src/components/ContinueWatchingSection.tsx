'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Tv } from 'lucide-react';
import { getUserMediaList, getShowProgress } from '@/lib/storage';
import { UserMediaRecord } from '@/lib/types';
import { getImageUrl } from '@/lib/tmdb';

export default function ContinueWatchingSection() {
  const [watchingShows, setWatchingShows] = useState<UserMediaRecord[]>([]);

  const loadWatching = async () => {
    const list = await getUserMediaList();
    const active = list.filter((item) => item.media_type === 'tv' && item.status === 'watching');
    setWatchingShows(active);
  };

  useEffect(() => {
    loadWatching();
    const handler = () => loadWatching();
    window.addEventListener('bingelog_storage_changed', handler);
    return () => window.removeEventListener('bingelog_storage_changed', handler);
  }, []);

  if (watchingShows.length === 0) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-[#E9A23B]/15 text-[#E9A23B]">
            <Play className="w-4 h-4 fill-current" />
          </div>
          <h2 className="text-xl font-bold text-[#ECE9E3] tracking-tight">Fortsätt titta</h2>
        </div>
        <Link
          href="/library"
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

          return (
            <Link
              key={show.tmdb_id}
              href={`/tv/${show.tmdb_id}`}
              className="group p-3 rounded-2xl bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/50 transition-all flex items-center gap-3.5 hover:shadow-lg"
            >
              <img
                src={getImageUrl(show.poster_path, 'w300')}
                alt={show.title}
                className="w-14 h-20 object-cover rounded-xl bg-[#0F1218] flex-shrink-0 group-hover:scale-105 transition-transform border border-[#2B3443]"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-[#E9A23B] uppercase tracking-wide">
                  {curEpisode > 0 ? `S${curSeason} · Avsnitt ${curEpisode}` : 'Tittar på'}
                </span>
                <h3 className="text-sm font-bold text-[#ECE9E3] truncate mt-0.5 group-hover:text-[#E9A23B] transition-colors">
                  {show.title}
                </h3>
                <p className="text-xs text-[#8D97A8] mt-1 flex items-center gap-1">
                  <Tv className="w-3 h-3 text-[#8D97A8]" />
                  <span>Öppna avsnitts-tracker</span>
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#1E2531] border border-[#2B3443] flex items-center justify-center text-[#ECE9E3] group-hover:bg-[#E9A23B] group-hover:text-[#0F1218] transition-colors flex-shrink-0 mr-1">
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
