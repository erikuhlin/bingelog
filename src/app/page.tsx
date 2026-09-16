import React from 'react';
import Link from 'next/link';
import { Sparkles, Film, Tv, ArrowRight } from 'lucide-react';
import { getTrendingMedia, getPopularMovies, getPopularShows } from '@/lib/tmdb';
import HeroBanner from '@/components/HeroBanner';
import MediaCard from '@/components/MediaCard';
import ContinueWatchingSection from '@/components/ContinueWatchingSection';
import UserWelcomeBanner from '@/components/UserWelcomeBanner';
import ExploreFeed from '@/components/ExploreFeed';

export default async function HomePage() {
  const trending = await getTrendingMedia();
  const popularMovies = await getPopularMovies();
  const popularShows = await getPopularShows();

  const featuredItem = trending[0];
  const trendingList = trending.slice(1, 13);

  return (
    <div>
      {/* Personalized Welcome Banner for Logged In User */}
      <UserWelcomeBanner />

      {/* Featured Hero Banner */}
      {featuredItem && <HeroBanner item={featuredItem} />}

      {/* Continue Watching Section (Active Series) */}
      <ContinueWatchingSection />

      {/* Dynamic Explore & Streaming Filter Feed */}
      <ExploreFeed initialTrending={trendingList} />

      {/* Popular Movies Section */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Populära filmer
            </h2>
          </div>
          <Link
            href="/movies"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <span>Visa fler filmer</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {popularMovies.slice(0, 8).map((item) => (
            <MediaCard key={`movie-${item.id}`} item={item} />
          ))}
        </div>
      </section>

      {/* Popular TV Shows Section */}
      <section className="mb-14">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Tv className="w-5 h-5 text-sky-400" />
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Populära serier
            </h2>
          </div>
          <Link
            href="/shows"
            className="text-xs font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
          >
            <span>Visa fler serier</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4 md:gap-6">
          {popularShows.slice(0, 8).map((item) => (
            <MediaCard key={`show-${item.id}`} item={item} />
          ))}
        </div>
      </section>
    </div>
  );
}
