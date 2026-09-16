import React from 'react';
import { Film } from 'lucide-react';
import { getPopularMovies, getGenres } from '@/lib/tmdb';
import MediaCard from '@/components/MediaCard';

export default async function MoviesPage() {
  const [movies, genres] = await Promise.all([
    getPopularMovies(),
    getGenres(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-rose-500" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Hitta de mest populära och hyllade långfilmerna just nu.
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

      {/* Movies Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {movies.map((movie) => (
          <MediaCard key={`movie-page-${movie.id}`} item={movie} />
        ))}
      </div>
    </div>
  );
}
