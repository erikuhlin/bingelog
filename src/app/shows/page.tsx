import React from 'react';
import { Tv } from 'lucide-react';
import { getPopularShows, getUpcomingSeasons, getUpcomingNewShows } from '@/lib/tmdb';
import { getCuratedShowRows } from '@/lib/seasonal';
import ExploreFeed from '@/components/ExploreFeed';
import UpcomingShowsSection from '@/components/UpcomingShowsSection';
import HorizontalMediaRow from '@/components/HorizontalMediaRow';

export const metadata = {
  title: 'Serier | Bingelog',
  description: 'Upptäck serier efter kategorier, säsongstema och streamingtjänster.',
};

export default async function ShowsPage() {
  const [shows, upcomingSeasons, upcomingNewShows, curatedRows] = await Promise.all([
    getPopularShows(),
    getUpcomingSeasons(16),
    getUpcomingNewShows(16),
    getCuratedShowRows(),
  ]);

  return (
    <div className="space-y-10 w-full max-w-full overflow-hidden">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#ECE9E3] tracking-tight flex items-center gap-3">
          <Tv className="w-7 h-7 sm:w-8 sm:h-8 text-[#6FA98A]" />
          <span>Utforska Serier</span>
        </h1>
        <p className="text-xs sm:text-sm text-[#8D97A8] mt-1.5 max-w-2xl leading-relaxed">
          Hitta nästa serie att sträckkolla bland säsongsteman, kriminalserier, sci-fi och filtrera efter din streamingtjänst.
        </p>
      </div>

      {/* 1. Kommande serier & nya säsonger */}
      <UpcomingShowsSection
        upcomingSeasons={upcomingSeasons}
        upcomingNewShows={upcomingNewShows}
      />

      {/* 2. Netflix-liknande kategorier (inklusive säsongsanpassad sektion) */}
      <div className="space-y-2">
        {curatedRows.map((row) => (
          <HorizontalMediaRow
            key={`show-row-${row.id}`}
            title={row.title}
            description={row.description}
            badge={row.badge}
            iconType={row.iconType}
            iconColor={row.iconColor}
            items={row.items}
          />
        ))}
      </div>

      {/* 3. Utforska hela seriekatalogen med streamingtjänstfilter */}
      <div className="pt-6 border-t border-[#2B3443]">
        <ExploreFeed
          initialTrending={shows}
          defaultMediaType="tv"
          title="Filtrera efter streamingtjänst & genre"
        />
      </div>
    </div>
  );
}
