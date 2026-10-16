import React from 'react';
import { Film } from 'lucide-react';
import { getPopularMovies, getUpcomingMovies } from '@/lib/tmdb';
import ExploreFeed from '@/components/ExploreFeed';
import HorizontalMediaRow from '@/components/HorizontalMediaRow';

export default async function MoviesPage() {
  const [movies, upcomingMovies] = await Promise.all([
    getPopularMovies(),
    getUpcomingMovies(),
  ]);

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-8 h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-sm text-[#8D97A8] mt-1">
          Hitta de mest populära långfilmerna och filtrera efter streamingtjänst.
        </p>
      </div>

      {/* Kommande filmer */}
      {upcomingMovies.length > 0 && (
        <HorizontalMediaRow
          title="Kommande filmer"
          description="Se biopremiärer och filmer som släpps snart"
          iconType="calendar"
          iconColor="text-[#E9A23B]"
          items={upcomingMovies}
        />
      )}

      <ExploreFeed
        initialTrending={movies}
        defaultMediaType="movie"
        title="Populära filmer"
      />
    </div>
  );
}
