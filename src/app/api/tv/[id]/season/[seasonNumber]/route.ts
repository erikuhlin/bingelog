import { NextResponse } from 'next/server';

interface SeasonCacheEntry {
  data: any;
  timestamp: number;
}

const seasonMemoryCache: Record<string, SeasonCacheEntry> = {};
const CACHE_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; seasonNumber: string }> }
) {
  const { id, seasonNumber } = await params;
  const showId = parseInt(id, 10);
  const sNum = parseInt(seasonNumber, 10);

  if (isNaN(showId) || isNaN(sNum)) {
    return NextResponse.json({ error: 'Invalid ID or season number' }, { status: 400 });
  }

  const cacheKey = `${showId}_s${sNum}`;
  const now = Date.now();
  if (seasonMemoryCache[cacheKey] && now - seasonMemoryCache[cacheKey].timestamp < CACHE_TTL_MS) {
    return NextResponse.json(seasonMemoryCache[cacheKey].data);
  }

  const apiKey = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'TMDB API key missing' }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://api.themoviedb.org/3/tv/${showId}/season/${sNum}?api_key=${apiKey}&language=sv-SE`,
      { next: { revalidate: 3600 * 6 } }
    );

    if (!res.ok) {
      // Fallback to en-US if sv-SE is empty/fails
      const fallbackRes = await fetch(
        `https://api.themoviedb.org/3/tv/${showId}/season/${sNum}?api_key=${apiKey}&language=en-US`,
        { next: { revalidate: 3600 * 6 } }
      );
      if (!fallbackRes.ok) {
        return NextResponse.json({ episodes: [] });
      }
      const data = await fallbackRes.json();
      data.is_english_overview = true;
      if (data.episodes) {
        data.episodes = data.episodes.map((ep: any) => ({ ...ep, is_english_overview: true }));
      }
      seasonMemoryCache[cacheKey] = { data, timestamp: now };
      return NextResponse.json(data);
    }

    const data = await res.json();
    const missingSeasonOverview = !data.overview?.trim();
    const missingEpisodesOverview = data.episodes?.some((e: any) => !e.overview?.trim());

    if (missingSeasonOverview || missingEpisodesOverview) {
      try {
        const fallbackRes = await fetch(
          `https://api.themoviedb.org/3/tv/${showId}/season/${sNum}?api_key=${apiKey}&language=en-US`,
          { next: { revalidate: 3600 * 6 } }
        );
        if (fallbackRes.ok) {
          const enData = await fallbackRes.json();
          if (missingSeasonOverview && enData.overview?.trim()) {
            data.overview = enData.overview.trim();
            data.is_english_overview = true;
          }
          if (data.episodes && enData.episodes) {
            const enEpMap = new Map<number, any>(
              enData.episodes.map((ep: any) => [ep.episode_number, ep])
            );
            data.episodes = data.episodes.map((ep: any) => {
              if (!ep.overview?.trim()) {
                const enEp = enEpMap.get(ep.episode_number);
                if (enEp?.overview?.trim()) {
                  return {
                    ...ep,
                    overview: enEp.overview.trim(),
                    is_english_overview: true,
                  };
                }
              }
              return ep;
            });
          }
        }
      } catch (err) {
        console.warn(`Error fetching English fallback for show ${showId} s${sNum}:`, err);
      }
    }

    seasonMemoryCache[cacheKey] = { data, timestamp: now };
    return NextResponse.json(data);
  } catch (err) {
    console.error(`Error fetching season data for show ${showId} s${sNum}:`, err);
    return NextResponse.json({ episodes: [] });
  }
}
