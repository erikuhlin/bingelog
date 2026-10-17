import React from 'react';
import {
  getTrendingMedia,
  getPopularMovies,
  getPopularShows,
  getNewReleasesOnStreaming,
} from '@/lib/tmdb';
import HomePageContent from '@/components/HomePageContent';
import { MediaItem } from '@/lib/types';

export default async function HomePage() {
  const [trending, popularMovies, popularShows, initialNewReleases] = await Promise.all([
    getTrendingMedia(),
    getPopularMovies(),
    getPopularShows(),
    getNewReleasesOnStreaming('all'),
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

  return (
    <HomePageContent
      carouselItems={carouselItems}
      trendingList={trendingList}
      initialNewReleases={initialNewReleases.length > 0 ? initialNewReleases : trending}
      popularCombined={popularCombined.length > 0 ? popularCombined : trending}
    />
  );
}
