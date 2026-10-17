import React from 'react';
import {
  getPopularMovies,
  getUpcomingMovies,
  getNewReleasesOnStreaming,
  getTheatricalMovies,
  getRentBuyMovies,
} from '@/lib/tmdb';
import { getCuratedMovieRows } from '@/lib/seasonal';
import MoviesPageContent from '@/components/MoviesPageContent';

export const metadata = {
  title: 'Filmer | Bingelog',
  description: 'Upptäck filmer efter kategorier, bioaktuella, streamingtjänster och hyr/köp.',
};

export default async function MoviesPage() {
  const [
    popularMovies,
    initialNewReleases,
    theatricalMovies,
    rentBuyMovies,
    upcomingMovies,
    curatedRows,
  ] = await Promise.all([
    getPopularMovies(),
    getNewReleasesOnStreaming('movie'),
    getTheatricalMovies(),
    getRentBuyMovies(),
    getUpcomingMovies(16),
    getCuratedMovieRows(),
  ]);

  return (
    <MoviesPageContent
      popularMovies={popularMovies}
      initialNewReleases={initialNewReleases.length > 0 ? initialNewReleases : popularMovies}
      theatricalMovies={theatricalMovies}
      rentBuyMovies={rentBuyMovies}
      upcomingMovies={upcomingMovies}
      curatedRows={curatedRows}
    />
  );
}
