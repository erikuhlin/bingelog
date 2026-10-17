import React from 'react';
import { Film } from 'lucide-react';
import { getPopularMovies, getUpcomingMovies } from '@/lib/tmdb';
import { getCuratedMovieRows } from '@/lib/seasonal';
import ExploreFeed from '@/components/ExploreFeed';
import HorizontalMediaRow from '@/components/HorizontalMediaRow';

export const metadata = {
  title: 'Filmer | Bingelog',
  description: 'Upptäck filmer efter kategorier, säsongstema och streamingtjänster.',
};

export default async function MoviesPage() {
  const [movies, upcomingMovies, curatedRows] = await Promise.all([
    getPopularMovies(),
    getUpcomingMovies(16),
    getCuratedMovieRows(),
  ]);

  return (
    <div className="space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Film className="w-7 h-7 sm:w-8 sm:h-8 text-[#E9A23B]" />
          <span>Utforska Filmer</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Bläddra bland säsongsteman, handplockade kategorier, biopremiärer och filtrera efter din streamingtjänst.
        </p>
      </div>

      {/* 1. Kommande filmer med länk till samtliga */}
      {upcomingMovies.length > 0 && (
        <HorizontalMediaRow
          title="Kommande filmer"
          description="Biopremiärer och filmer som släpps snart"
          iconType="calendar"
          iconColor="text-[#E9A23B]"
          items={upcomingMovies}
          moreLink={{
            href: '/upcoming?tab=movies',
            label: 'Visa alla kommande',
          }}
        />
      )}

      {/* 2. Netflix-liknande kategorier (inklusive säsongsanpassad sektion) */}
      <div className="space-y-2">
        {curatedRows.map((row) => (
          <HorizontalMediaRow
            key={`movie-row-${row.id}`}
            title={row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 3. Utforska hela filmkatalogen med streamingtjänstfilter */}
      <div className="pt-6 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={movies}
          defaultMediaType="movie"
          title="Filtrera efter streamingtjänst & genre"
        />
      </div>
    </div>
  );
}
