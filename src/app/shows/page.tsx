import React from 'react';
import { Tv } from 'lucide-react';
import { getPopularShows, getGenres } from '@/lib/tmdb';
import MediaCard from '@/components/MediaCard';

export default async function ShowsPage() {
  const [shows, genres] = await Promise.all([
    getPopularShows(),
    getGenres(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Tv className="w-8 h-8 text-sky-400" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Hitta nästa serie att sträckkolla på och håll koll på alla dina avsnitt.
        </p>
      </div>

      {/* Genres Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {genres.slice(0, 10).map((genre) => (
          <span
            key={genre.id}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 whitespace-nowrap"
          >
            {genre.name}
          </span>
        ))}
      </div>

      {/* Shows Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {shows.map((show) => (
          <MediaCard key={`show-page-${show.id}`} item={show} />
        ))}
      </div>
    </div>
  );
}
