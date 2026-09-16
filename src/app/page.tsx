import React from 'react';
import { getTrendingMedia, getPopularMovies, getPopularShows } from '@/lib/tmdb';
import HeroCarousel from '@/components/HeroCarousel';
import HorizontalMediaRow from '@/components/HorizontalMediaRow';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import UserWelcomeBanner from '@/components/UserWelcomeBanner';
import ExploreFeed from '@/components/ExploreFeed';

export default async function HomePage() {
  const trending = await getTrendingMedia();
  const popularMovies = await getPopularMovies();
  const popularShows = await getPopularShows();

  // Top 5 trending items for hero carousel
  const carouselItems = trending.slice(0, 5);
  // Remaining trending items for the explore feed
  const trendingList = trending.slice(5);

  return (
    <div>
      {/* Personalized Welcome Banner for Logged In User */}
      <UserWelcomeBanner />

      {/* Hero Carousel with top trending titles */}
      {carouselItems.length > 0 && <HeroCarousel items={carouselItems} />}

      {/* Continue Watching Section (Active Series for authenticated user) */}
      <ContinueWatchingSection />

      {/* Horizontal Scroll Row for Popular Movies */}
      <HorizontalMediaRow
        title="Populära filmer just nu"
        iconType="film"
        iconColor="text-[#E9A23B]"
        items={popularMovies}
        moreLink={{ href: '/movies', label: 'Visa fler filmer' }}
      />

      {/* Horizontal Scroll Row for Popular Shows */}
      <HorizontalMediaRow
        title="Populära serier just nu"
        iconType="tv"
        iconColor="text-[#6FA98A]"
        items={popularShows}
        moreLink={{ href: '/shows', label: 'Visa fler serier' }}
      />

      {/* Dynamic Explore & Streaming Filter Feed with Pagination & Grid/List views */}
      <ExploreFeed initialTrending={trendingList.length > 0 ? trendingList : trending} />
    </div>
  );
}
