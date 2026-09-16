import { NextResponse } from 'next/server';
import { discoverMedia } from '@/lib/tmdb';
import { DiscoverFilters } from '@/lib/types';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const mediaType = (searchParams.get('mediaType') as any) || 'all';
  const providerId = searchParams.get('providerId') ? parseInt(searchParams.get('providerId')!, 10) : undefined;
  const genreId = searchParams.get('genreId') ? parseInt(searchParams.get('genreId')!, 10) : undefined;
  const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
  const year = searchParams.get('year') ? parseInt(searchParams.get('year')!, 10) : undefined;
  const sortBy = searchParams.get('sortBy') || 'popularity.desc';
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!, 10) : 1;

  const filters: DiscoverFilters = {
    mediaType,
    providerId,
    genreId,
    minRating,
    year,
    sortBy,
    page,
  };

  try {
    const results = await discoverMedia(filters);
    return NextResponse.json({ results });
  } catch (err: any) {
    console.error('Discover API route error:', err);
    return NextResponse.json({ results: [], error: err?.message }, { status: 500 });
  }
}
