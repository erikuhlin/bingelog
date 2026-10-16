import React from 'react';
import { Tv } from 'lucide-react';
import { getPopularShows, getUpcomingSeasons, getUpcomingNewShows } from '@/lib/tmdb';
import ExploreFeed from '@/components/ExploreFeed';
import UpcomingShowsSection from '@/components/UpcomingShowsSection';

export default async function ShowsPage() {
  const [shows, upcomingSeasons, upcomingNewShows] = await Promise.all([
    getPopularShows(),
    getUpcomingSeasons(),
    getUpcomingNewShows(),
  ]);

  return (
    <div className="space-y-8 w-full max-w-full overflow-hidden">
      <div>
        <h1 className="text-3xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Tv className="w-8 h-8 text-[#6FA98A]" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-sm text-[#8D97A8] mt-1">
          Hitta nästa serie att sträckkolla på och filtrera efter streamingtjänst.
        </p>
      </div>

      {/* Kommande serier & nya säsonger */}
      <UpcomingShowsSection
        upcomingSeasons={upcomingSeasons}
        upcomingNewShows={upcomingNewShows}
      />

      <ExploreFeed
        initialTrending={shows}
        defaultMediaType="tv"
        title="Populära serier"
      />
    </div>
  );
}
