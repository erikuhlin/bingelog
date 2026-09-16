import { NextResponse } from 'next/server';

interface SeriesMetadata {
  tmdb_id: number;
  runtime?: number;
  seasons: {
    season_number: number;
    episode_count: number;
    name?: string;
  }[];
  status?: string;
  next_episode_to_air?: {
    air_date: string;
    episode_number: number;
    season_number: number;
    name?: string;
  } | null;
}

// In-memory cache for serverless invocation reuse
const memoryCache: Record<number, { data: SeriesMetadata; timestamp: number }> = {};
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const idsParam = searchParams.get('ids');

  if (!idsParam) {
    return NextResponse.json({ results: {} });
  }

  const ids = idsParam
    .split(',')
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id) && id > 0)
    .slice(0, 30); // Cap at 30 items per batch

  const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const now = Date.now();
  const results: Record<number, SeriesMetadata> = {};
  const idsToFetch: number[] = [];

  for (const id of ids) {
    const cached = memoryCache[id];
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      results[id] = cached.data;
    } else {
      idsToFetch.push(id);
    }
  }

  if (idsToFetch.length > 0 && apiKey) {
    await Promise.all(
      idsToFetch.map(async (id) => {
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=sv-SE`,
            { next: { revalidate: 3600 } }
          );

          if (res.ok) {
            const data = await res.json();
            const seriesInfo: SeriesMetadata = {
              tmdb_id: id,
              runtime: (data.episode_run_time && data.episode_run_time[0]) || 45,
              status: data.status,
              next_episode_to_air: data.next_episode_to_air
                ? {
                    air_date: data.next_episode_to_air.air_date,
                    episode_number: data.next_episode_to_air.episode_number,
                    season_number: data.next_episode_to_air.season_number,
                    name: data.next_episode_to_air.name,
                  }
                : null,
              seasons: (data.seasons || [])
                .filter((s: any) => s.season_number > 0)
                .map((s: any) => ({
                  season_number: s.season_number,
                  episode_count: s.episode_count || 0,
                  name: s.name,
                })),
            };

            memoryCache[id] = { data: seriesInfo, timestamp: now };
            results[id] = seriesInfo;
          }
        } catch (err) {
          console.error(`Failed to fetch series info for ${id}:`, err);
        }
      })
    );
  }

  return NextResponse.json({ results });
}
