import { NextResponse } from 'next/server';
import {
  discoverMedia,
  getRentBuyMovies,
} from '@/lib/tmdb';
import {
  getCuratedHomeRows,
  getCuratedMovieRows,
  getCuratedShowRows,
} from '@/lib/seasonal';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageType = searchParams.get('pageType') || 'home';
  const rawProviderIds = searchParams.get('providerIds');
  const providerIds = rawProviderIds
    ? rawProviderIds
        .split(',')
        .map(Number)
        .filter((n) => !isNaN(n) && n > 0)
    : [];

  try {
    if (pageType === 'movies') {
      const [popularMovies, rentBuyMovies, curatedRows] = await Promise.all([
        discoverMedia({
          mediaType: 'movie',
          providerIds: providerIds.length > 0 ? providerIds : undefined,
          sortBy: 'popularity.desc',
          page: 1,
        }),
        getRentBuyMovies(providerIds.length > 0 ? providerIds : undefined),
        getCuratedMovieRows(providerIds.length > 0 ? providerIds : undefined),
      ]);

      return NextResponse.json({
        popularMovies,
        rentBuyMovies,
        curatedRows,
      });
    }

    if (pageType === 'shows') {
      const [popularShows, curatedRows] = await Promise.all([
        discoverMedia({
          mediaType: 'tv',
          providerIds: providerIds.length > 0 ? providerIds : undefined,
          sortBy: 'popularity.desc',
          page: 1,
        }),
        getCuratedShowRows(providerIds.length > 0 ? providerIds : undefined),
      ]);

      return NextResponse.json({
        popularShows,
        curatedRows,
      });
    }

    // Default: 'home'
    const [trending, rentBuyMovies, curatedRows] = await Promise.all([
      discoverMedia({
        mediaType: 'all',
        providerIds: providerIds.length > 0 ? providerIds : undefined,
        sortBy: 'popularity.desc',
        page: 1,
      }),
      getRentBuyMovies(providerIds.length > 0 ? providerIds : undefined),
      getCuratedHomeRows(providerIds.length > 0 ? providerIds : undefined),
    ]);

    return NextResponse.json({
      trending,
      rentBuyMovies,
      curatedRows,
    });
  } catch (err: any) {
    console.error('Error fetching page sections:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to load page sections' },
      { status: 500 }
    );
  }
}
