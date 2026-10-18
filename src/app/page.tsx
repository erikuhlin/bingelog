import React from 'react';
import {
  getTrendingMedia,
  getPopularMovies,
  getPopularShows,
  getNewReleasesOnStreaming,
  getTheatricalMovies,
  getRentBuyMovies,
  getUpcomingMovies,
  getUpcomingSeasons,
  getUpcomingNewShows,
} from '@/lib/tmdb';
import { getCuratedHomeRows } from '@/lib/seasonal';
import HomePageContent from '@/components/HomePageContent';
import { MediaItem } from '@/lib/types';

export default async function HomePage() {
  const [
    trending,
    popularMovies,
    popularShows,
    initialNewReleases,
    theatricalMovies,
    rentBuyMovies,
    upcomingMovies,
    upcomingSeasons,
    upcomingNewShows,
    curatedRows,
  ] = await Promise.all([
    getTrendingMedia(),
    getPopularMovies(),
    getPopularShows(),
    getNewReleasesOnStreaming('all'),
    getTheatricalMovies(),
    getRentBuyMovies(),
    getUpcomingMovies(10),
    getUpcomingSeasons(10),
    getUpcomingNewShows(10),
    getCuratedHomeRows(),
  ]);

  // Top 5 trending items for hero carousel
  const carouselItems = trending.slice(0, 5);
  // Remaining trending items for dedicated "Trendar i veckan" carousel
  const trendingList = trending.slice(5);

  // Combine popular movies and shows for initial streaming catalog feed
  const popularCombined: MediaItem[] = [];
  const maxLen = Math.max(popularMovies.length, popularShows.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < popularMovies.length) popularCombined.push(popularMovies[i]);
    if (i < popularShows.length) popularCombined.push(popularShows[i]);
  }

  // Combine upcoming movies, seasons, and new shows sorted by date
  const initialUpcoming = [...upcomingSeasons, ...upcomingNewShows, ...upcomingMovies].sort(
    (a, b) => {
      const dateA = a.upcoming_date ? new Date(a.upcoming_date).getTime() : Infinity;
      const dateB = b.upcoming_date ? new Date(b.upcoming_date).getTime() : Infinity;
      return dateA - dateB;
    }
  );

  return (
    <HomePageContent
      carouselItems={carouselItems}
      trendingList={trendingList}
      initialNewReleases={initialNewReleases.length > 0 ? initialNewReleases : trending}
      theatricalMovies={theatricalMovies}
      initialRentBuyMovies={rentBuyMovies}
      initialUpcoming={initialUpcoming}
      initialCuratedRows={curatedRows}
      popularCombined={popularCombined.length > 0 ? popularCombined : trending}
    />
  );
}
