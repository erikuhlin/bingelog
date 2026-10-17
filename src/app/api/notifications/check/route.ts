import { NextResponse } from 'next/server';
import { tmdbFetch } from '@/lib/tmdb';
import { UserMediaRecord, MediaType } from '@/lib/types';

export interface ReleaseNotification {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  release_date: string;
  message: string;
  season_number?: number;
}

const notificationMemoryCache = new Map<string, { notifications: ReleaseNotification[]; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const libraryItems: UserMediaRecord[] = body.libraryItems || [];

    if (!Array.isArray(libraryItems) || libraryItems.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Only inspect watchlist and watching items (these represent things the user is waiting for or actively tracking)
    const trackedItems = libraryItems.filter(
      (item) => item.status === 'watchlist' || item.status === 'watching'
    );

    if (trackedItems.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Cache key based on tracked item IDs
    const sortedIds = trackedItems.map((i) => `${i.media_type}_${i.tmdb_id}`).sort().join(',');
    const now = Date.now();
    const cached = notificationMemoryCache.get(sortedIds);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ notifications: cached.notifications });
    }

    const sixtyDaysAgoMs = now - 60 * 24 * 60 * 60 * 1000;
    const notifications: ReleaseNotification[] = [];

    // Inspect items in parallel (batch of max 25 to protect rate limits)
    const candidates = trackedItems.slice(0, 25);
    const checks = candidates.map(async (item) => {
      try {
        if (item.media_type === 'movie') {
          const movie = await tmdbFetch<any>(`/movie/${item.tmdb_id}`);
          if (movie?.release_date) {
            const releaseMs = new Date(movie.release_date).getTime();
            // Has it premiered, and was the premiere within the last 60 days?
            if (releaseMs <= now && releaseMs >= sixtyDaysAgoMs) {
              notifications.push({
                id: `rel_movie_${item.tmdb_id}_${movie.release_date}`,
                tmdb_id: item.tmdb_id,
                media_type: 'movie',
                title: movie.title || item.title,
                poster_path: movie.poster_path || item.poster_path,
                release_date: movie.release_date,
                message: `Filmen "${movie.title || item.title}" har nu släppts!`,
              });
            }
          }
        } else if (item.media_type === 'tv') {
          const show = await tmdbFetch<any>(`/tv/${item.tmdb_id}`);
          if (!show) return;

          // Check if a new season premiere aired recently
          const lastEp = show.last_episode_to_air;
          if (lastEp?.air_date) {
            const airMs = new Date(lastEp.air_date).getTime();
            if (airMs <= now && airMs >= sixtyDaysAgoMs) {
              if (lastEp.episode_number === 1 && lastEp.season_number > 0) {
                // Season premiere!
                notifications.push({
                  id: `rel_tv_${item.tmdb_id}_s${lastEp.season_number}_${lastEp.air_date}`,
                  tmdb_id: item.tmdb_id,
                  media_type: 'tv',
                  title: show.name || item.title,
                  poster_path: show.poster_path || item.poster_path,
                  release_date: lastEp.air_date,
                  season_number: lastEp.season_number,
                  message: `Säsong ${lastEp.season_number} av "${show.name || item.title}" har haft premiär!`,
                });
              } else if (show.first_air_date) {
                const firstAirMs = new Date(show.first_air_date).getTime();
                if (firstAirMs <= now && firstAirMs >= sixtyDaysAgoMs) {
                  notifications.push({
                    id: `rel_tv_${item.tmdb_id}_pilot_${show.first_air_date}`,
                    tmdb_id: item.tmdb_id,
                    media_type: 'tv',
                    title: show.name || item.title,
                    poster_path: show.poster_path || item.poster_path,
                    release_date: show.first_air_date,
                    message: `Serien "${show.name || item.title}" har haft premiär!`,
                  });
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Notification check error for ${item.media_type}/${item.tmdb_id}:`, err);
      }
    });

    await Promise.all(checks);

    // Sort notifications with most recent premiere date first
    notifications.sort((a, b) => {
      const dateA = new Date(a.release_date).getTime();
      const dateB = new Date(b.release_date).getTime();
      return dateB - dateA;
    });

    // Cache results
    notificationMemoryCache.set(sortedIds, { notifications, timestamp: now });

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('Error checking release notifications:', err);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
