import { NextResponse } from 'next/server';
import { discoverMedia } from '@/lib/tmdb';
import { DiscoverFilters } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mediaType = (searchParams.get('mediaType') as any) || 'all';
  // Support comma-separated provider IDs: ?providerIds=8,76
  const rawProviderIds = searchParams.get('providerIds');
  const providerIds = rawProviderIds
    ? rawProviderIds.split(',').map(Number).filter((n) => !isNaN(n) && n > 0)
    : undefined;
  const genreId = searchParams.get('genreId') ? parseInt(searchParams.get('genreId')!, 10) : undefined;
  const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const sortBy = searchParams.get('sortBy') || 'popularity.desc';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  const originalLanguage = searchParams.get('originalLanguage') || undefined;

  const filters: DiscoverFilters = {
    mediaType,
    providerIds: providerIds && providerIds.length > 0 ? providerIds : undefined,
    genreId,
    minRating,
    year,
    sortBy,
    page,
    originalLanguage,
  };

  try {
    const results = await discoverMedia(filters);
    const hasMore = results.length >= 10;
    return NextResponse.json({ results, page, hasMore });
  } catch (err: any) {
    console.error('Discover API route error:', err);
    return NextResponse.json({ results: [], page: 1, hasMore: false, error: err?.message }, { status: 500 });
  }
}
