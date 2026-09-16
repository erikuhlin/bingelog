import React from 'react';
import { Film } from 'lucide-react';
import { getPopularMovies } from '@/lib/tmdb';
import ExploreFeed from '@/components/ExploreFeed';

export default async function MoviesPage() {
  const movies = await getPopularMovies();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-rose-500" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Hitta de mest populära långfilmerna och filtrera efter streamingtjänst.
        </p>
      </div>

      <ExploreFeed
        initialTrending={movies}
        defaultMediaType="movie"
        title="Populära filmer"
      />
    </div>
  );
}
