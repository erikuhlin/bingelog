import { NextResponse } from 'next/server';
import { tmdbFetch, normalizeMediaItem, discoverMedia } from '@/lib/tmdb';
import { MediaItem, MediaType, UserMediaRecord } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const libraryItems: UserMediaRecord[] = body.libraryItems || [];

    if (!Array.isArray(libraryItems) || libraryItems.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const libraryIds = new Set<number>(libraryItems.map((item) => item.tmdb_id));

    // Sort items by priority:
    // 1. High rating (7-10)
    // 2. Watching or Completed
    // 3. Watchlist
    const sortedLibrary = [...libraryItems].sort((a, b) => {
      const scoreA = (a.user_rating || 0) * 2 + (a.status === 'watching' ? 3 : a.status === 'completed' ? 2 : 1);
      const scoreB = (b.user_rating || 0) * 2 + (b.status === 'watching' ? 3 : b.status === 'completed' ? 2 : 1);
      return scoreB - scoreA;
    });

    // Select up to 5 seed items
    const seedItems = sortedLibrary.slice(0, 5);

    // Fetch TMDB recommendations for each seed item
    const recPromises = seedItems.map(async (seed) => {
      try {
        const data = await tmdbFetch<{ results: any[] }>(
          `/${seed.media_type}/${seed.tmdb_id}/recommendations`,
          { page: 1 }
        );
        if (data?.results && data.results.length > 0) {
          return data.results.map((r: any) =>
            normalizeMediaItem({ ...r, media_type: seed.media_type })
          );
        }
      } catch (err) {
        console.warn(`Could not fetch recommendations for ${seed.tmdb_id}:`, err);
      }
      return [];
    });

    const recResults = await Promise.all(recPromises);

    // Count frequency of recommendations across seeds to boost items recommended multiple times
    const frequencyMap = new Map<number, { item: MediaItem; count: number }>();

    recResults.flat().forEach((item: MediaItem) => {
      if (!item || libraryIds.has(item.id)) return; // Exclude items already in library!
      if (frequencyMap.has(item.id)) {
        frequencyMap.get(item.id)!.count += 1;
      } else {
        frequencyMap.set(item.id, { item, count: 1 });
      }
    });

    let candidates = Array.from(frequencyMap.values());

    // If we have fewer than 10 recommendations, backfill with top-rated discover
    if (candidates.length < 10) {
      try {
        const backfill = await discoverMedia({
          mediaType: 'all',
          sortBy: 'popularity.desc',
          page: 1,
        });
        backfill.forEach((item) => {
          if (!libraryIds.has(item.id) && !frequencyMap.has(item.id)) {
            frequencyMap.set(item.id, { item, count: 0.5 });
          }
        });
        candidates = Array.from(frequencyMap.values());
      } catch {
        // ignore
      }
    }

    // Sort by frequency (relevance) then by popularity
    candidates.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (b.item.popularity || 0) - (a.item.popularity || 0);
    });

    const finalRecommendations = candidates.map((c) => c.item).slice(0, 20);

    return NextResponse.json({ recommendations: finalRecommendations });
  } catch (err) {
    console.error('Error generating for-you recommendations:', err);
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}
