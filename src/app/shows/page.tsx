import React from 'react';
import {
  getPopularShows,
  getUpcomingSeasons,
  getUpcomingNewShows,
  getNewReleasesOnStreaming,
} from '@/lib/tmdb';
import { getCuratedShowRows } from '@/lib/seasonal';
import ShowsPageContent from '@/components/ShowsPageContent';

export const metadata = {
  title: 'Serier | Bingelog',
  description: 'Upptäck serier efter kategorier, säsongstema och streamingtjänster.',
};

export default async function ShowsPage() {
  const [shows, initialNewReleases, upcomingSeasons, upcomingNewShows, curatedRows] =
    await Promise.all([
      getPopularShows(),
      getNewReleasesOnStreaming('tv'),
      getUpcomingSeasons(16),
      getUpcomingNewShows(16),
      getCuratedShowRows(),
    ]);

  return (
    <ShowsPageContent
      popularShows={shows}
      initialNewReleases={initialNewReleases.length > 0 ? initialNewReleases : shows}
      upcomingSeasons={upcomingSeasons}
      upcomingNewShows={upcomingNewShows}
      curatedRows={curatedRows}
    />
  );
}
