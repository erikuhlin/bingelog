import React from 'react';
import { getTrendingMedia, getPopularMovies, getPopularShows } from '@/lib/tmdb';
import HeroCarousel from '@/components/HeroCarousel';
import HorizontalMediaRow from '@/components/HorizontalMediaRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import ExploreFeed from '@/components/ExploreFeed';
import { MediaItem } from '@/lib/types';

export default async function HomePage() {
  const trending = await getTrendingMedia();
  const popularMovies = await getPopularMovies();
  const popularShows = await getPopularShows();

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
    <div className="w-full max-w-full overflow-hidden">
      {/* 1. Hero Carousel with top trending titles (#1–#5) */}
      {carouselItems.length > 0 && <HeroCarousel items={carouselItems} />}

      {/* 2. "Tittar på" - Active Series with progress bar for user */}
      <ContinueWatchingSection />

      {/* 3. Dedicated Horizontal Carousel for "Trendar i veckan" (#6–#20) */}
      {trendingList.length > 0 && (
        <HorizontalMediaRow
          title="Trendar i veckan"
          iconType="sparkles"
          iconColor="text-[#E9A23B]"
          items={trendingList}
        />
      )}

      {/* 4. Streaming Hub & Catalog Discovery (Quick tabs: Alla/Filmer/Serier + Streaming-tjänster) */}
      <ExploreFeed
        initialTrending={popularCombined.length > 0 ? popularCombined : trending}
        title="Populärt på streaming"
      />
    </div>
  );
}
