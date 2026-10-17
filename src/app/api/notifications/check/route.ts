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

    // Only inspect watchlist and watching items, plus completed items for TV series (to notify of new seasons)
    const trackedItems = libraryItems.filter(
      (item) =>
        item.status === 'watchlist' ||
        item.status === 'watching' ||
        (item.status === 'completed' && item.media_type === 'tv')
    );

    if (trackedItems.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    // Cache key based on tracked item IDs and statuses
    const sortedIds = trackedItems
      .map((i) => `${i.media_type}_${i.tmdb_id}_${i.status}_${i.current_season || 0}`)
      .sort()
      .join(',');
    const now = Date.now();
    const cached = notificationMemoryCache.get(sortedIds);
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({ notifications: cached.notifications });
    }

    const sixtyDaysAgoMs = now - 60 * 24 * 60 * 60 * 1000;
    const thirtyDaysAheadMs = now + 30 * 24 * 60 * 60 * 1000;
    const notifications: ReleaseNotification[] = [];

    // Prioritize completed TV series and watchlist items
    const prioritized = [...trackedItems].sort((a, b) => {
      const score = (i: UserMediaRecord) => {
        if (i.media_type === 'tv' && i.status === 'completed') return 3;
        if (i.status === 'watchlist') return 2;
        return 1;
      };
      return score(b) - score(a);
    });

    // Inspect items in parallel (batch of max 40 to protect rate limits)
    const candidates = prioritized.slice(0, 40);
    const checks = candidates.map(async (item) => {
      try {
        if (item.media_type === 'movie') {
          const movie = await tmdbFetch<any>(`/movie/${item.tmdb_id}`);
          if (movie?.release_date) {
            const releaseMs = new Date(movie.release_date).getTime();
            if (!isNaN(releaseMs)) {
              // Has it premiered within the last 60 days?
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
              } else if (releaseMs > now && releaseMs <= thirtyDaysAheadMs) {
                // Upcoming premiere within 30 days
                notifications.push({
                  id: `rel_movie_${item.tmdb_id}_up_${movie.release_date}`,
                  tmdb_id: item.tmdb_id,
                  media_type: 'movie',
                  title: movie.title || item.title,
                  poster_path: movie.poster_path || item.poster_path,
                  release_date: movie.release_date,
                  message: `Filmen "${movie.title || item.title}" har premiär den ${movie.release_date}!`,
                });
              }
            }
          }
        } else if (item.media_type === 'tv') {
          const show = await tmdbFetch<any>(`/tv/${item.tmdb_id}`);
          if (!show) return;

          // Check seasons for premieres
          if (Array.isArray(show.seasons) && show.seasons.length > 0) {
            for (const s of show.seasons) {
              if (!s.air_date || s.season_number <= 0) continue;

              // If user marked as completed, only notify about new seasons
              if (item.status === 'completed') {
                const completedSeason = item.current_season || 1;
                if (s.season_number <= completedSeason) {
                  continue;
                }
              }

              const airMs = new Date(s.air_date).getTime();
              if (isNaN(airMs)) continue;

              if (airMs <= now && airMs >= sixtyDaysAgoMs) {
                // Premiered within the last 60 days
                notifications.push({
                  id: `rel_tv_${item.tmdb_id}_s${s.season_number}_${s.air_date}`,
                  tmdb_id: item.tmdb_id,
                  media_type: 'tv',
                  title: show.name || item.title,
                  poster_path: s.poster_path || show.poster_path || item.poster_path,
                  release_date: s.air_date,
                  season_number: s.season_number,
                  message:
                    s.season_number > 1
                      ? `Ny säsong! Säsong ${s.season_number} av "${show.name || item.title}" har haft premiär!`
                      : `Serien "${show.name || item.title}" har haft premiär!`,
                });
              } else if (airMs > now && airMs <= thirtyDaysAheadMs) {
                // Upcoming premiere within 30 days
                notifications.push({
                  id: `rel_tv_${item.tmdb_id}_s${s.season_number}_up_${s.air_date}`,
                  tmdb_id: item.tmdb_id,
                  media_type: 'tv',
                  title: show.name || item.title,
                  poster_path: s.poster_path || show.poster_path || item.poster_path,
                  release_date: s.air_date,
                  season_number: s.season_number,
                  message:
                    s.season_number > 1
                      ? `Säsong ${s.season_number} av "${show.name || item.title}" har premiär den ${s.air_date}!`
                      : `Serien "${show.name || item.title}" har premiär den ${s.air_date}!`,
                });
              }
            }
          } else if (item.status !== 'completed' && show.first_air_date) {
            // Fallback to first_air_date if seasons array is absent
            const firstAirMs = new Date(show.first_air_date).getTime();
            if (!isNaN(firstAirMs)) {
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
              } else if (firstAirMs > now && firstAirMs <= thirtyDaysAheadMs) {
                notifications.push({
                  id: `rel_tv_${item.tmdb_id}_pilot_up_${show.first_air_date}`,
                  tmdb_id: item.tmdb_id,
                  media_type: 'tv',
                  title: show.name || item.title,
                  poster_path: show.poster_path || item.poster_path,
                  release_date: show.first_air_date,
                  message: `Serien "${show.name || item.title}" har premiär den ${show.first_air_date}!`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`Notification check error for ${item.media_type}/${item.tmdb_id}:`, err);
      }
    });

    await Promise.all(checks);

    // Deduplicate notifications by ID
    const uniqueMap = new Map<string, ReleaseNotification>();
    for (const n of notifications) {
      if (!uniqueMap.has(n.id)) {
        uniqueMap.set(n.id, n);
      }
    }
    const uniqueNotifications = Array.from(uniqueMap.values());

    // Sort notifications with most recent premiere date first
    uniqueNotifications.sort((a, b) => {
      const dateA = new Date(a.release_date).getTime() || 0;
      const dateB = new Date(b.release_date).getTime() || 0;
      return dateB - dateA;
    });

    // Cache results
    notificationMemoryCache.set(sortedIds, { notifications: uniqueNotifications, timestamp: now });

    return NextResponse.json({ notifications: uniqueNotifications });
  } catch (err) {
    console.error('Error checking release notifications:', err);
    return NextResponse.json({ notifications: [] }, { status: 500 });
  }
}
