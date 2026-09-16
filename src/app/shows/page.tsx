import React from 'react';
import { Tv } from 'lucide-react';
import { getPopularShows } from '@/lib/tmdb';
import ExploreFeed from '@/components/ExploreFeed';

export default async function ShowsPage() {
  const shows = await getPopularShows();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
          <Tv className="w-8 h-8 text-sky-400" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Hitta nästa serie att sträckkolla på och filtrera efter streamingtjänst.
        </p>
      </div>

      <ExploreFeed
        initialTrending={shows}
        defaultMediaType="tv"
        title="Populära serier"
      />
    </div>
  );
}
