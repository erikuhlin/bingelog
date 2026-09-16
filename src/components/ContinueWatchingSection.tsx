'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Play, ArrowRight, Tv } from 'lucide-react';
import { getUserMediaList, getWatchedEpisodes } from '@/lib/storage';
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
          <div className="p-1.5 rounded-lg bg-rose-600/20 text-rose-500">
            <Play className="w-4 h-4 fill-rose-500" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Fortsätt titta</h2>
        </div>
        <Link
          href="/lists"
          className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
        >
          <span>Visa alla i listan</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchingShows.map((show) => (
          <Link
            key={show.tmdb_id}
            href={`/tv/${show.tmdb_id}`}
            className="group p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-all flex items-center gap-3.5 hover:shadow-lg hover:shadow-black/40"
          >
            <img
              src={getImageUrl(show.poster_path, 'w300')}
              alt={show.title}
              className="w-14 h-20 object-cover rounded-xl bg-zinc-800 flex-shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wide">
                Tittar på just nu
              </span>
              <h3 className="text-sm font-bold text-white truncate mt-0.5 group-hover:text-rose-400 transition-colors">
                {show.title}
              </h3>
              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                <Tv className="w-3 h-3 text-zinc-500" />
                <span>Öppna avsnitts-tracker</span>
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-rose-600 group-hover:text-white transition-colors flex-shrink-0 mr-1">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
