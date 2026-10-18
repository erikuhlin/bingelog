import { NextResponse } from 'next/server';
import { tmdbFetch, normalizeMediaItem, discoverMedia, enrichItemsWithProviders } from '@/lib/tmdb';
import { MediaItem, UserMediaRecord } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const libraryItems: UserMediaRecord[] = body.libraryItems || [];
    const providerIds: number[] = Array.isArray(body.providerIds)
      ? body.providerIds.map(Number).filter((n: number) => !isNaN(n) && n > 0)
      : [];

    if (!Array.isArray(libraryItems) || libraryItems.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const libraryIds = new Set<number>(libraryItems.map((item) => item.tmdb_id));
    const hasProviders = providerIds.length > 0;

    // Sort items by priority:
    // 1. High rating (7-10)
    // 2. Watching or Completed
    // 3. Watchlist
    const sortedLibrary = [...libraryItems].sort((a, b) => {
      const scoreA =
        (a.user_rating || 0) * 2 +
        (a.status === 'watching' ? 3 : a.status === 'completed' ? 2 : 1);
      const scoreB =
        (b.user_rating || 0) * 2 +
        (b.status === 'watching' ? 3 : b.status === 'completed' ? 2 : 1);
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
      if (!item || libraryIds.has(item.id)) return;
      if (frequencyMap.has(item.id)) {
        frequencyMap.get(item.id)!.count += 1;
      } else {
        frequencyMap.set(item.id, { item, count: 1 });
      }
    });

    let candidates = Array.from(frequencyMap.values());
    candidates.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return (b.item.popularity || 0) - (a.item.popularity || 0);
    });

    // Enrich top 24 candidates with Swedish watch providers
    const enrichedItems = await enrichItemsWithProviders(
      candidates.slice(0, 24).map((c) => c.item),
      false,
      24
    );

    let filtered = hasProviders
      ? enrichedItems.filter((item) =>
          item.watch_providers?.some((p) => providerIds.includes(p.provider_id))
        )
      : enrichedItems;

    // Backfill if fewer than 12 recommendations (especially when specific providers are selected)
    if (filtered.length < 12) {
      try {
        const backfill = await discoverMedia({
          mediaType: 'all',
          providerIds: hasProviders ? providerIds : undefined,
          minRating: 7.0,
          sortBy: 'popularity.desc',
          page: 1,
        });
        const existingIds = new Set(filtered.map((i) => i.id));
        for (const item of backfill) {
          if (!libraryIds.has(item.id) && !existingIds.has(item.id)) {
            filtered.push(item);
            existingIds.add(item.id);
          }
        }
      } catch {
        // ignore
      }
    }

    return NextResponse.json({ recommendations: filtered.slice(0, 20) });
  } catch (err) {
    console.error('Error generating for-you recommendations:', err);
    return NextResponse.json({ recommendations: [] }, { status: 500 });
  }
}
