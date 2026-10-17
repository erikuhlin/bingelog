import {
  MediaItem,
  MediaDetail,
  Season,
  MediaType,
  PersonSearchResult,
  PersonDetails,
  PersonCreditItem,
  PersonGroupedCredits,
  LiveSearchResults,
} from './types';
import {
  MOCK_TRENDING,
  MOCK_GENRES,
  MOCK_DETAILS,
  MOCK_UPCOMING_MOVIES,
  MOCK_UPCOMING_NEW_SHOWS,
  MOCK_UPCOMING_SEASONS,
} from './mock-data';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function getImageUrl(path: string | null, size: 'w300' | 'w500' | 'w780' | 'w1280' | 'original' = 'w500'): string {
  if (!path) return '/placeholder-poster.svg';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path: string | null, size: 'w780' | 'w1280' | 'original' = 'w1280'): string {
  if (!path) return '/placeholder-backdrop.svg';
  if (path.startsWith('http')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

function getApiKey(): string | null {
  return process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || null;
}

export async function tmdbFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return null;
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('language', 'sv-SE');
  url.searchParams.set('include_adult', 'false');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 }, // Cache for 1 hour in Next.js
    });

    if (!res.ok) {
      console.warn(`TMDb request error [${res.status}]:`, await res.text());
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error('TMDb fetch error:', error);
    return null;
  }
}

export const SWEDISH_STREAMING_PROVIDERS = [
  { id: 8, name: 'Netflix', logo_path: '/rK1KljqmbvO9HQa1PBFLILWah72.png', bg: 'bg-red-600' },
  { id: 1899, name: 'Max', logo_path: '/skypuy7SXuugIQeYg0IglmzoKaS.png', bg: 'bg-blue-600' },
  { id: 337, name: 'Disney+', logo_path: '/5eZ872CghnHFLB1j8grszbrx0dx.png', bg: 'bg-indigo-700' },
  { id: 119, name: 'Prime Video', logo_path: '/gMZdpavHmxFNnLpMHwVxfqeux2g.png', bg: 'bg-sky-600' },
  { id: 1773, name: 'SkyShowtime', logo_path: '/ube1pVpP3FklRkeyQjlDkkC3tL2.png', bg: 'bg-indigo-600' },
  { id: 76, name: 'Viaplay', logo_path: '/c1J9PGGowXwW5AxAaZaGipeFu7U.png', bg: 'bg-rose-700' },
  { id: 1944, name: 'TV4 Play', logo_path: '/8sxwkXfXhlIHkAlkZ64kTU9BNyT.png', bg: 'bg-red-700' },
  { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png', bg: 'bg-emerald-600' },
  { id: 350, name: 'Apple TV', logo_path: '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png', bg: 'bg-zinc-700' },
];

export const NETWORK_TO_SWEDISH_PROVIDER: Record<string, { id: number; name: string; logo_path: string }> = {
  Netflix: { id: 8, name: 'Netflix', logo_path: '/rK1KljqmbvO9HQa1PBFLILWah72.png' },
  HBO: { id: 1899, name: 'Max', logo_path: '/skypuy7SXuugIQeYg0IglmzoKaS.png' },
  Max: { id: 1899, name: 'Max', logo_path: '/skypuy7SXuugIQeYg0IglmzoKaS.png' },
  'HBO Max': { id: 1899, name: 'Max', logo_path: '/skypuy7SXuugIQeYg0IglmzoKaS.png' },
  'Disney+': { id: 337, name: 'Disney+', logo_path: '/5eZ872CghnHFLB1j8grszbrx0dx.png' },
  Hulu: { id: 337, name: 'Disney+', logo_path: '/5eZ872CghnHFLB1j8grszbrx0dx.png' },
  FX: { id: 337, name: 'Disney+', logo_path: '/5eZ872CghnHFLB1j8grszbrx0dx.png' },
  'FX on Hulu': { id: 337, name: 'Disney+', logo_path: '/5eZ872CghnHFLB1j8grszbrx0dx.png' },
  Amazon: { id: 119, name: 'Prime Video', logo_path: '/gMZdpavHmxFNnLpMHwVxfqeux2g.png' },
  'Prime Video': { id: 119, name: 'Prime Video', logo_path: '/gMZdpavHmxFNnLpMHwVxfqeux2g.png' },
  'Apple TV+': { id: 350, name: 'Apple TV', logo_path: '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png' },
  'Apple TV': { id: 350, name: 'Apple TV', logo_path: '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png' },
  Viaplay: { id: 76, name: 'Viaplay', logo_path: '/c1J9PGGowXwW5AxAaZaGipeFu7U.png' },
  TV4: { id: 1944, name: 'TV4 Play', logo_path: '/8sxwkXfXhlIHkAlkZ64kTU9BNyT.png' },
  'TV4 Play': { id: 1944, name: 'TV4 Play', logo_path: '/8sxwkXfXhlIHkAlkZ64kTU9BNyT.png' },
  SVT: { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png' },
  SVT1: { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png' },
  SVT2: { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png' },
  'SVT Play': { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png' },
  SkyShowtime: { id: 1773, name: 'SkyShowtime', logo_path: '/ube1pVpP3FklRkeyQjlDkkC3tL2.png' },
  Peacock: { id: 1773, name: 'SkyShowtime', logo_path: '/ube1pVpP3FklRkeyQjlDkkC3tL2.png' },
  'Paramount+': { id: 1773, name: 'SkyShowtime', logo_path: '/ube1pVpP3FklRkeyQjlDkkC3tL2.png' },
  Showtime: { id: 1773, name: 'SkyShowtime', logo_path: '/ube1pVpP3FklRkeyQjlDkkC3tL2.png' },
};

export async function getItemWatchProviders(mediaType: MediaType, id: number): Promise<any[]> {
  const data = await tmdbFetch<any>(`/${mediaType}/${id}/watch/providers`);
  return data?.results?.SE?.flatrate || [];
}

export async function enrichItemsWithProviders(items: MediaItem[]): Promise<MediaItem[]> {
  // Fetch providers for items in parallel
  const enriched = await Promise.all(
    items.map(async (item) => {
      if (item.watch_providers && item.watch_providers.length > 0) return item;
      try {
        const providers = await getItemWatchProviders(item.media_type, item.id);
        return {
          ...item,
          watch_providers: providers.map((p: any) => ({
            provider_id: p.provider_id,
            provider_name: p.provider_name,
            logo_path: p.logo_path,
          })),
        };
      } catch {
        return item;
      }
    })
  );
  return enriched;
}

export async function getTrendingMedia(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/trending/all/week');
  if (data?.results) {
    const list = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(normalizeMediaItem);
    return enrichItemsWithProviders(list);
  }
  return MOCK_TRENDING;
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/movie/popular');
  if (data?.results) {
    const list = data.results.map((item) => normalizeMediaItem({ ...item, media_type: 'movie' }));
    return enrichItemsWithProviders(list);
  }
  return MOCK_TRENDING.filter((item) => item.media_type === 'movie');
}

export async function getPopularShows(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/tv/popular');
  if (data?.results) {
    const list = data.results.map((item) => normalizeMediaItem({ ...item, media_type: 'tv' }));
    return enrichItemsWithProviders(list);
  }
  return MOCK_TRENDING.filter((item) => item.media_type === 'tv');
}

export function formatUpcomingDateLabel(
  dateStr?: string | null,
  type?: 'movie' | 'tv' | 'season',
  seasonNumber?: number,
  service?: string
): string {
  if (!dateStr) {
    if (seasonNumber) {
      return service ? `Säsong ${seasonNumber} • ${service}` : `Säsong ${seasonNumber} • Kommer snart`;
    }
    return service ? `${service} • Kommer snart` : 'Kommer snart';
  }

  let formattedDate = dateStr;
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const now = new Date();
      const isDifferentYear = d.getFullYear() !== now.getFullYear();
      formattedDate = d.toLocaleDateString('sv-SE', {
        day: 'numeric',
        month: 'short',
        ...(isDifferentYear ? { year: 'numeric' } : {}),
      });
    }
  } catch {
    // Keep dateStr
  }

  if (seasonNumber) {
    if (service) {
      return `Säsong ${seasonNumber} • ${service} • ${formattedDate}`;
    }
    return `Säsong ${seasonNumber} • ${formattedDate}`;
  }

  if (service) {
    return `${service} • ${formattedDate}`;
  }

  return `Premiär ${formattedDate}`;
}

export async function getUpcomingMovies(limit = 16): Promise<MediaItem[]> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const todayEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  const fetchP1 = tmdbFetch<{ results: any[] }>('/movie/upcoming', {
    page: 1,
    region: 'SE',
  });
  const fetchP2 = limit > 16 ? tmdbFetch<{ results: any[] }>('/movie/upcoming', {
    page: 2,
    region: 'SE',
  }) : Promise.resolve(null);

  const [dataP1, dataP2] = await Promise.all([fetchP1, fetchP2]);
  let results = [...(dataP1?.results || []), ...(dataP2?.results || [])];

  if (results.length < 6) {
    const discoverData = await tmdbFetch<{ results: any[] }>('/discover/movie', {
      'primary_release_date.gte': today,
      sort_by: 'popularity.desc',
      page: 1,
    });
    if (discoverData?.results) {
      const existingIds = new Set(results.map((r: any) => r.id));
      for (const item of discoverData.results) {
        if (!existingIds.has(item.id)) {
          results.push(item);
          existingIds.add(item.id);
        }
      }
    }
  }

  if (results.length > 0) {
    const list = results
      .map((item) => normalizeMediaItem({ ...item, media_type: 'movie' }))
      // Only movies that have strictly NOT premiered yet
      .filter((item) => {
        if (!item.release_date) return false;
        return new Date(item.release_date).getTime() > todayEndMs;
      })
      .sort((a, b) => {
        const dateA = new Date(a.release_date!).getTime();
        const dateB = new Date(b.release_date!).getTime();
        return dateA - dateB;
      })
      .map((item) => {
        const service = item.watch_providers?.[0]?.provider_name || 'Biopremiär';
        return {
          ...item,
          release_service: service,
          upcoming_date: item.release_date,
          upcoming_label: formatUpcomingDateLabel(item.release_date, 'movie', undefined, service),
        };
      });

    if (list.length > 0) {
      return list.slice(0, limit);
    }
  }

  return MOCK_UPCOMING_MOVIES.filter((item) => {
    if (!item.upcoming_date) return false;
    return new Date(item.upcoming_date).getTime() > todayEndMs;
  }).slice(0, limit);
}

export async function getUpcomingNewShows(limit = 16): Promise<MediaItem[]> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const todayEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  const fetchP1 = tmdbFetch<{ results: any[] }>('/discover/tv', {
    'first_air_date.gte': today,
    without_genres: '10763,10767,10764,10766',
    sort_by: 'popularity.desc',
    page: 1,
  });
  const fetchP2 = limit > 16 ? tmdbFetch<{ results: any[] }>('/discover/tv', {
    'first_air_date.gte': today,
    without_genres: '10763,10767,10764,10766',
    sort_by: 'popularity.desc',
    page: 2,
  }) : Promise.resolve(null);

  const [dataP1, dataP2] = await Promise.all([fetchP1, fetchP2]);
  const results = [...(dataP1?.results || []), ...(dataP2?.results || [])];

  if (results.length > 0) {
    const filtered = results.filter((item) => {
      if (!item.first_air_date) return false;
      return new Date(item.first_air_date).getTime() > todayEndMs;
    });

    const candidates = filtered.slice(0, limit);
    const detailPromises = candidates.map((c) => getMediaDetails('tv', c.id));
    const details = await Promise.all(detailPromises);

    const list: MediaItem[] = candidates.map((item, idx) => {
      const d = details[idx];
      const norm = normalizeMediaItem({ ...item, media_type: 'tv' });
      const service = d?.release_service || d?.watch_providers?.[0]?.provider_name;
      const date = d?.first_air_date || item.first_air_date;
      return {
        ...norm,
        overview: d?.overview || norm.overview,
        watch_providers: d?.watch_providers && d.watch_providers.length > 0 ? d.watch_providers : norm.watch_providers,
        networks: d?.networks,
        release_service: service,
        upcoming_date: date,
        upcoming_label: formatUpcomingDateLabel(date, 'tv', undefined, service),
      };
    });

    list.sort((a, b) => {
      const dateA = new Date(a.first_air_date!).getTime();
      const dateB = new Date(b.first_air_date!).getTime();
      return dateA - dateB;
    });

    if (list.length > 0) {
      return list.slice(0, limit);
    }
  }

  return MOCK_UPCOMING_NEW_SHOWS.filter((item) => {
    if (!item.upcoming_date) return false;
    return new Date(item.upcoming_date).getTime() > todayEndMs;
  }).slice(0, limit);
}

export async function getUpcomingSeasons(limit = 16): Promise<MediaItem[]> {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayEndMs = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  // Discover returning shows, excluding daily soaps, news, talk shows, reality
  const fetchP1 = tmdbFetch<{ results: any[] }>('/discover/tv', {
    'air_date.gte': today,
    'first_air_date.lte': yesterday,
    without_genres: '10763,10767,10764,10766',
    sort_by: 'popularity.desc',
    page: 1,
  });
  const fetchP2 = limit > 16 ? tmdbFetch<{ results: any[] }>('/discover/tv', {
    'air_date.gte': today,
    'first_air_date.lte': yesterday,
    without_genres: '10763,10767,10764,10766',
    sort_by: 'popularity.desc',
    page: 2,
  }) : Promise.resolve(null);

  const [dataP1, dataP2] = await Promise.all([fetchP1, fetchP2]);
  const results = [...(dataP1?.results || []), ...(dataP2?.results || [])];

  if (results.length > 0) {
    const candidateLimit = limit > 16 ? 40 : 25;
    const candidates = results.slice(0, candidateLimit);
    const enrichedList: MediaItem[] = [];

    // Fetch details to find exact upcoming season
    const detailPromises = candidates.map((item) => getMediaDetails('tv', item.id));
    const details = await Promise.all(detailPromises);

    for (const d of details) {
      if (!d) continue;

      // In TMDB, d.last_episode_to_air indicates the most recent episode that already aired
      const lastAiredSeasonNum = d.last_episode_to_air?.season_number || 0;

      // A season is ONLY upcoming if its season premiere has NOT aired yet:
      // 1. Season number must be strictly greater than last aired season (s.season_number > lastAiredSeasonNum)
      // 2. Season air_date must be strictly in the future (> todayEndMs)
      const futureSeason = d.seasons?.find((s) => {
        if (!s.air_date || s.season_number <= 0) return false;
        if (s.season_number <= lastAiredSeasonNum) return false; // Already has aired episodes!
        const seasonAirTime = new Date(s.air_date).getTime();
        return seasonAirTime > todayEndMs;
      });

      let seasonNum: number | null = null;
      let airDate: string | null = null;

      if (futureSeason) {
        seasonNum = futureSeason.season_number;
        airDate = futureSeason.air_date;
      } else if (
        d.next_episode_to_air &&
        d.next_episode_to_air.episode_number === 1 && // Must be episode 1 (season premiere) of a future season
        d.next_episode_to_air.season_number > lastAiredSeasonNum &&
        d.next_episode_to_air.air_date &&
        new Date(d.next_episode_to_air.air_date).getTime() > todayEndMs
      ) {
        seasonNum = d.next_episode_to_air.season_number;
        airDate = d.next_episode_to_air.air_date;
      }

      if (seasonNum && airDate) {
        const service = d.release_service || d.watch_providers?.[0]?.provider_name;
        enrichedList.push({
          ...d,
          upcoming_season: seasonNum,
          upcoming_date: airDate,
          release_service: service,
          upcoming_label: formatUpcomingDateLabel(airDate, 'season', seasonNum, service),
        });
      }
    }

    if (enrichedList.length > 0) {
      enrichedList.sort((a, b) => {
        const dateA = a.upcoming_date ? new Date(a.upcoming_date).getTime() : Infinity;
        const dateB = b.upcoming_date ? new Date(b.upcoming_date).getTime() : Infinity;
        return dateA - dateB;
      });
      return enrichedList.slice(0, limit);
    }
  }

  return MOCK_UPCOMING_SEASONS.filter((item) => {
    if (!item.upcoming_date) return false;
    return new Date(item.upcoming_date).getTime() > todayEndMs;
  }).slice(0, limit);
}

export async function discoverMedia(filters: import('./types').DiscoverFilters): Promise<MediaItem[]> {
  const {
    mediaType = 'all',
    providerIds,
    genreId,
    minRating,
    year,
    sortBy = 'popularity.desc',
    page = 1,
    originalLanguage,
  } = filters;

  const hasProviders = providerIds && providerIds.length > 0;

  const baseParams: Record<string, string | number> = {
    page,
    sort_by: sortBy,
    'vote_count.gte': sortBy === 'vote_average.desc' ? 100 : 15,
  };

  if (genreId) {
    baseParams.with_genres = genreId;
  }
  if (minRating) {
    baseParams['vote_average.gte'] = minRating;
  }
  if (originalLanguage) {
    baseParams.with_original_language = originalLanguage;
  }
  if (hasProviders) {
    baseParams.watch_region = 'SE';
    // TMDB uses | (OR) to join multiple provider IDs
    baseParams.with_watch_providers = providerIds!.join('|');
    baseParams.with_watch_monetization_types = 'flatrate';
  }

  const attachSelectedProviders = (items: MediaItem[]) => {
    if (!hasProviders) return items;
    const selectedProviders = SWEDISH_STREAMING_PROVIDERS.filter((p) => providerIds!.includes(p.id));
    if (selectedProviders.length === 0) return items;
    return items.map((item) => ({
      ...item,
      watch_providers: selectedProviders.map((p) => ({
        provider_id: p.id,
        provider_name: p.name,
        logo_path: p.logo_path,
      })),
    }));
  };

  if (mediaType === 'movie') {
    const params = { ...baseParams };
    if (year) params.primary_release_year = year;
    const data = await tmdbFetch<{ results: any[] }>('/discover/movie', params);
    const items = (data?.results || []).map((m) => normalizeMediaItem({ ...m, media_type: 'movie' }));
    return attachSelectedProviders(items);
  }

  if (mediaType === 'tv') {
    const params = { ...baseParams };
    if (year) params.first_air_date_year = year;
    const data = await tmdbFetch<{ results: any[] }>('/discover/tv', params);
    const items = (data?.results || []).map((t) => normalizeMediaItem({ ...t, media_type: 'tv' }));
    return attachSelectedProviders(items);
  }

  // If 'all': fetch movie and tv in parallel
  const movieParams = { ...baseParams };
  const tvParams = { ...baseParams };
  if (year) {
    movieParams.primary_release_year = year;
    tvParams.first_air_date_year = year;
  }

  const [movieRes, tvRes] = await Promise.all([
    tmdbFetch<{ results: any[] }>('/discover/movie', movieParams),
    tmdbFetch<{ results: any[] }>('/discover/tv', tvParams),
  ]);

  const movies = (movieRes?.results || []).map((m) => normalizeMediaItem({ ...m, media_type: 'movie' }));
  const tvs = (tvRes?.results || []).map((t) => normalizeMediaItem({ ...t, media_type: 'tv' }));

  const merged = [...movies, ...tvs].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  return attachSelectedProviders(merged.slice(0, 24));
}

export async function searchMedia(query: string, enrich = false): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const data = await tmdbFetch<{ results: any[] }>('/search/multi', { query: query.trim() });
  if (data?.results) {
    const list = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(normalizeMediaItem);
    return enrich ? enrichItemsWithProviders(list) : list;
  }

  // Fallback search in mock data
  const lowerQuery = query.toLowerCase();
  return MOCK_TRENDING.filter(
    (item) =>
      item.title.toLowerCase().includes(lowerQuery) ||
      (item.original_title && item.original_title.toLowerCase().includes(lowerQuery)) ||
      item.overview.toLowerCase().includes(lowerQuery)
  );
}

export async function searchMultiLive(query: string): Promise<LiveSearchResults> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { titles: [], actors: [] };
  }

  const data = await tmdbFetch<{ results: any[] }>('/search/multi', { query: trimmed });
  if (!data?.results) {
    return { titles: [], actors: [] };
  }

  const titles: MediaItem[] = [];
  const actors: PersonSearchResult[] = [];

  for (const item of data.results) {
    if (item.media_type === 'movie' || item.media_type === 'tv') {
      if (titles.length < 8) {
        titles.push(normalizeMediaItem(item));
      }
    } else if (item.media_type === 'person') {
      if (actors.length < 3) {
        actors.push({
          id: item.id,
          name: item.name,
          profile_path: item.profile_path,
          known_for_department: item.known_for_department,
          known_for: (item.known_for || []).map((k: any) => ({
            id: k.id,
            title: k.title || k.name,
            name: k.name || k.title,
            media_type: k.media_type,
            poster_path: k.poster_path,
          })),
        });
      }
    }
  }

  return { titles, actors };
}

export async function getPersonDetails(personId: number): Promise<PersonDetails | null> {
  const data = await tmdbFetch<any>(`/person/${personId}`);
  if (!data) {
    // Basic mock fallbacks for common demos
    if (personId === 525) {
      return {
        id: 525,
        name: 'Christopher Nolan',
        profile_path: '/xuAIuYSmsUzKlUMBFGVZaWsY3Z5.jpg',
        known_for_department: 'Directing',
        place_of_birth: 'London, England, UK',
        birthday: '1970-07-30',
        biography: 'Christopher Edward Nolan är en brittisk-amerikansk filmregissör, manusförfattare och producent känd för filmer som Oppenheimer, Inception, Interstellar och The Dark Knight-trilogin.',
        imdb_id: 'nm0634240',
      };
    }
    if (personId === 1190668) {
      return {
        id: 1190668,
        name: 'Timothée Chalamet',
        profile_path: '/BE2sdjpgsa2rNTFa66f7upkaOP.jpg',
        known_for_department: 'Acting',
        place_of_birth: 'New York City, New York, USA',
        birthday: '1995-12-27',
        biography: 'Timothée Hal Chalamet är en amerikansk skådespelare känd för sina roller i Dune, Wonka och Call Me by Your Name.',
        imdb_id: 'nm3154303',
      };
    }
    return null;
  }
  return {
    id: data.id,
    name: data.name,
    profile_path: data.profile_path,
    biography: data.biography,
    known_for_department: data.known_for_department,
    place_of_birth: data.place_of_birth,
    birthday: data.birthday,
    deathday: data.deathday,
    imdb_id: data.imdb_id,
    also_known_as: data.also_known_as,
  };
}

export async function getPersonGroupedCredits(personId: number): Promise<PersonGroupedCredits> {
  const data = await tmdbFetch<any>(`/person/${personId}/combined_credits`);
  if (!data) {
    return { all: [], acting: [], directing: [], writing: [] };
  }

  const actingList: PersonCreditItem[] = [];
  const directingList: PersonCreditItem[] = [];
  const writingList: PersonCreditItem[] = [];

  // Track combined roles per media item: `${media_type}-${id}` -> PersonCreditItem & { rolesSet: Set<string> }
  const allMap = new Map<string, PersonCreditItem & { rolesSet: Set<string> }>();

  // Helper to ensure media item in allMap
  const recordInAllMap = (baseItem: PersonCreditItem, roleText: string) => {
    const key = `${baseItem.media_type}-${baseItem.id}`;
    if (!allMap.has(key)) {
      allMap.set(key, {
        ...baseItem,
        rolesSet: new Set([roleText]),
      });
    } else {
      const existing = allMap.get(key)!;
      existing.rolesSet.add(roleText);
      // Keep higher popularity/ratings if available
      if ((baseItem.popularity || 0) > (existing.popularity || 0)) {
        existing.popularity = baseItem.popularity;
      }
    }
  };

  // 1. Process Cast (Acting)
  if (Array.isArray(data.cast)) {
    const seenActing = new Set<string>();

    for (const c of data.cast) {
      if (!c.id) continue;
      const key = `${c.media_type || 'movie'}-${c.id}`;

      // Filter noise: Talk shows (10767), News (10763), Reality (10764), and roles containing 'Self'/'Himself'/'Herself'/'Host'/'Guest'
      const charLower = (c.character || '').toLowerCase();
      const isSelf =
        charLower.includes('self') ||
        charLower.includes('himself') ||
        charLower.includes('herself') ||
        charLower === 'host' ||
        charLower === 'guest';

      const genreIds: number[] = c.genre_ids || [];
      const isTalkOrNews = genreIds.includes(10767) || genreIds.includes(10763);

      if (isSelf || isTalkOrNews) {
        continue;
      }

      const normalized = normalizeMediaItem(c);
      const character = c.character?.trim() || undefined;
      const roleLabel = character || 'Skådespelare';

      const item: PersonCreditItem = {
        ...normalized,
        character,
        department: 'Acting',
        roles: [roleLabel],
      };

      if (!seenActing.has(key)) {
        seenActing.add(key);
        actingList.push(item);
      }

      recordInAllMap(item, roleLabel);
    }
  }

  // 2. Process Crew (Directing & Writing)
  if (Array.isArray(data.crew)) {
    const seenDirecting = new Set<string>();
    const seenWriting = new Set<string>();

    for (const c of data.crew) {
      if (!c.id) continue;
      const key = `${c.media_type || 'movie'}-${c.id}`;
      const job = (c.job || '').trim();
      const dept = (c.department || '').trim();

      // Check Directing
      const isDirecting = dept === 'Directing' && (job === 'Director' || job === 'Co-Director');

      // Check Writing
      const isWriting =
        dept === 'Writing' ||
        ['Screenplay', 'Writer', 'Story', 'Original Story', 'Author', 'Co-Writer', 'Creator'].includes(job);

      if (isDirecting) {
        const normalized = normalizeMediaItem(c);
        const roleLabel = job === 'Co-Director' ? 'Medregissör' : 'Regissör';
        const item: PersonCreditItem = {
          ...normalized,
          job: roleLabel,
          department: 'Directing',
          roles: [roleLabel],
        };

        if (!seenDirecting.has(key)) {
          seenDirecting.add(key);
          directingList.push(item);
        }

        recordInAllMap(item, roleLabel);
      }

      if (isWriting) {
        const normalized = normalizeMediaItem(c);
        let roleLabel = 'Manus';
        if (job === 'Writer') roleLabel = 'Författare';
        else if (job === 'Screenplay') roleLabel = 'Manus';
        else if (job === 'Story' || job === 'Original Story') roleLabel = 'Berättelse';
        else if (job === 'Creator') roleLabel = 'Skapare';

        const item: PersonCreditItem = {
          ...normalized,
          job: roleLabel,
          department: 'Writing',
          roles: [roleLabel],
        };

        if (!seenWriting.has(key)) {
          seenWriting.add(key);
          writingList.push(item);
        }

        recordInAllMap(item, roleLabel);
      }
    }
  }

  const sortByPopularity = (list: PersonCreditItem[]) =>
    list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));

  const allList: PersonCreditItem[] = Array.from(allMap.values()).map((val) => ({
    ...val,
    roles: Array.from(val.rolesSet),
  }));

  return {
    all: sortByPopularity(allList),
    acting: sortByPopularity(actingList),
    directing: sortByPopularity(directingList),
    writing: sortByPopularity(writingList),
  };
}

export async function getPersonCombinedCredits(personId: number): Promise<MediaItem[]> {
  const grouped = await getPersonGroupedCredits(personId);
  return grouped.all;
}

export async function fetchImdbRating(imdbId: string, mediaType: MediaType = 'movie'): Promise<number | null> {
  if (!imdbId) return null;

  // 1. If OMDB API key is configured
  const omdbKey = process.env.OMDB_API_KEY;
  if (omdbKey) {
    try {
      const res = await fetch(`https://www.omdbapi.com/?i=${imdbId}&apikey=${omdbKey}`, {
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const json = await res.json();
        const val = parseFloat(json.imdbRating);
        if (!isNaN(val) && val > 0) return val;
      }
    } catch {
      // fallback to Cinemeta
    }
  }

  // 2. Cinemeta (free public API powered by Stremio, mirrors IMDb scores)
  try {
    const typeSegment = mediaType === 'tv' ? 'series' : 'movie';
    const res = await fetch(`https://v3-cinemeta.strem.io/meta/${typeSegment}/${imdbId}.json`, {
      next: { revalidate: 86400 },
    });
    if (res.ok) {
      const json = await res.json();
      const ratingRaw = json.meta?.imdbRating;
      const val = typeof ratingRaw === 'number' ? ratingRaw : parseFloat(ratingRaw);
      if (!isNaN(val) && val > 0) return val;
    }
  } catch {
    // ignore
  }

  return null;
}

export async function getMediaDetails(mediaType: MediaType, id: number): Promise<MediaDetail | null> {
  const endpoint = `/${mediaType}/${id}`;
  const data = await tmdbFetch<any>(endpoint, {
    append_to_response: 'credits,videos,watch/providers,recommendations,translations,external_ids',
    include_video_language: 'sv,en,null',
  });

  if (data) {
    let overview = data.overview?.trim() || '';
    let isEnglishOverview = false;
    let tagline = data.tagline?.trim() || '';

    // Check if overview exists in requested language (sv-SE).
    // If not, find English overview from translations or fallback fetch
    const englishTranslation = data.translations?.translations?.find(
      (t: any) => t.iso_639_1 === 'en'
    );

    if (!overview && englishTranslation?.data?.overview?.trim()) {
      overview = englishTranslation.data.overview.trim();
      isEnglishOverview = true;
    }

    if (!tagline && englishTranslation?.data?.tagline?.trim()) {
      tagline = englishTranslation.data.tagline.trim();
    }

    // If still no overview, fallback fetch directly with language: 'en-US'
    if (!overview) {
      try {
        const enData = await tmdbFetch<any>(endpoint, { language: 'en-US' });
        if (enData?.overview?.trim()) {
          overview = enData.overview.trim();
          isEnglishOverview = true;
        }
        if (!tagline && enData?.tagline?.trim()) {
          tagline = enData.tagline.trim();
        }
      } catch {
        // ignore fallback failure
      }
    }

    const swedishProviders = data['watch/providers']?.results?.SE;

    // Filter and sort trailers
    let trailers = data.videos?.results?.filter(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip')
    ) || [];

    if (trailers.length === 0) {
      try {
        const enVideos = await tmdbFetch<any>(`/${mediaType}/${id}/videos`, { language: 'en-US' });
        const fallbackTrailers = enVideos?.results?.filter(
          (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser' || v.type === 'Clip')
        ) || [];
        if (fallbackTrailers.length > 0) {
          trailers = fallbackTrailers;
        }
      } catch {
        // ignore fallback failure
      }
    }

    const imdbId: string | null = data.external_ids?.imdb_id || data.imdb_id || null;
    let imdbRating: number | null = null;

    if (imdbId) {
      imdbRating = await fetchImdbRating(imdbId, mediaType);

      // Fallback trailer from Cinemeta if TMDb had 0 trailers
      if (trailers.length === 0) {
        try {
          const typeSegment = mediaType === 'tv' ? 'series' : 'movie';
          const cinRes = await fetch(`https://v3-cinemeta.strem.io/meta/${typeSegment}/${imdbId}.json`, {
            next: { revalidate: 86400 },
          });
          if (cinRes.ok) {
            const cinJson = await cinRes.json();
            const cinTrailers = cinJson.meta?.trailers;
            if (Array.isArray(cinTrailers) && cinTrailers.length > 0) {
              cinTrailers.forEach((ct: any) => {
                if (ct.source) {
                  trailers.push({
                    id: ct.source,
                    key: ct.source,
                    name: `${data.title || data.name} Trailer`,
                    site: 'YouTube',
                    type: 'Trailer',
                  });
                }
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }

    // Sort trailers: Swedish first, Trailer before Teaser/Clip, official first
    trailers.sort((a: any, b: any) => {
      const aIsSv = a.iso_639_1 === 'sv' ? 1 : 0;
      const bIsSv = b.iso_639_1 === 'sv' ? 1 : 0;
      if (aIsSv !== bIsSv) return bIsSv - aIsSv;

      const aIsTrailer = a.type === 'Trailer' ? 1 : 0;
      const bIsTrailer = b.type === 'Trailer' ? 1 : 0;
      if (aIsTrailer !== bIsTrailer) return bIsTrailer - aIsTrailer;

      const aOfficial = a.official ? 1 : 0;
      const bOfficial = b.official ? 1 : 0;
      if (aOfficial !== bOfficial) return bOfficial - aOfficial;

      return 0;
    });

    const directorsMap = new Map<number, { id: number; name: string; profile_path: string | null }>();
    data.credits?.crew
      ?.filter((c: any) => c.job === 'Director')
      ?.forEach((c: any) => {
        if (!directorsMap.has(c.id)) {
          directorsMap.set(c.id, { id: c.id, name: c.name, profile_path: c.profile_path || null });
        }
      });
    const directors = Array.from(directorsMap.values());

    const writersMap = new Map<number, { id: number; name: string; job?: string; profile_path: string | null }>();
    data.credits?.crew
      ?.filter((c: any) =>
        c.department === 'Writing' ||
        ['Screenplay', 'Writer', 'Story', 'Original Story', 'Author', 'Co-Writer'].includes(c.job)
      )
      ?.forEach((c: any) => {
        if (!writersMap.has(c.id)) {
          let jobLabel = 'Manus';
          if (c.job === 'Writer') jobLabel = 'Författare';
          else if (c.job === 'Story' || c.job === 'Original Story') jobLabel = 'Berättelse';
          writersMap.set(c.id, { id: c.id, name: c.name, job: jobLabel, profile_path: c.profile_path || null });
        }
      });
    const writers = Array.from(writersMap.values());

    const createdBy = data.created_by?.map((c: any) => ({
      id: c.id,
      name: c.name,
      profile_path: c.profile_path || null,
    })) || [];

    const recommendations = data.recommendations?.results
      ?.slice(0, 8)
      ?.map(normalizeMediaItem) || [];

    const networks = data.networks?.map((n: any) => ({
      id: n.id,
      name: n.name,
      logo_path: n.logo_path || null,
    })) || [];

    let resolvedProviders = swedishProviders?.flatrate?.map((p: any) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      logo_path: p.logo_path,
    })) || [];

    let releaseService: string | undefined = undefined;

    if (resolvedProviders.length === 0 && networks.length > 0) {
      for (const net of networks) {
        const matched = NETWORK_TO_SWEDISH_PROVIDER[net.name];
        if (matched) {
          resolvedProviders.push({
            provider_id: matched.id,
            provider_name: matched.name,
            logo_path: matched.logo_path,
          });
          releaseService = matched.name;
          break;
        } else if (net.logo_path) {
          resolvedProviders.push({
            provider_id: net.id,
            provider_name: net.name,
            logo_path: net.logo_path,
          });
          releaseService = net.name;
          break;
        }
      }
    }

    if (resolvedProviders.length > 0 && !releaseService) {
      releaseService = resolvedProviders[0].provider_name;
    } else if (!releaseService && mediaType === 'movie') {
      releaseService = 'Biopremiär';
    }

    return {
      id: data.id,
      title: data.title || data.name,
      original_title: data.original_title || data.original_name,
      overview: overview || 'Ingen handling tillgänglig på svenska eller engelska.',
      is_english_overview: isEnglishOverview,
      release_service: releaseService,
      networks: networks.length > 0 ? networks : undefined,
      imdb_id: imdbId,
      imdb_rating: imdbRating,
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      media_type: mediaType,
      release_date: data.release_date,
      first_air_date: data.first_air_date,
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      genres: data.genres || [],
      origin_country: data.origin_country || [],
      tagline: tagline || undefined,
      status: data.status,
      runtime: data.runtime,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      seasons: data.seasons?.filter((s: any) => s.season_number > 0),
      created_by: createdBy.length > 0 ? createdBy : undefined,
      directors: directors.length > 0 ? directors : undefined,
      writers: writers.length > 0 ? writers : undefined,
      credits: data.credits ? {
        cast: data.credits.cast?.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
        })) || []
      } : undefined,
      videos: trailers.length > 0 ? trailers : undefined,
      watch_providers: resolvedProviders,
      streaming_info: swedishProviders ? {
        link: swedishProviders.link,
        flatrate: swedishProviders.flatrate?.map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
        rent: swedishProviders.rent?.map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
        buy: swedishProviders.buy?.map((p: any) => ({
          provider_id: p.provider_id,
          provider_name: p.provider_name,
          logo_path: p.logo_path,
        })),
      } : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
      next_episode_to_air: data.next_episode_to_air
        ? {
            id: data.next_episode_to_air.id,
            name: data.next_episode_to_air.name,
            overview: data.next_episode_to_air.overview,
            air_date: data.next_episode_to_air.air_date,
            episode_number: data.next_episode_to_air.episode_number,
            season_number: data.next_episode_to_air.season_number,
            still_path: data.next_episode_to_air.still_path,
          }
        : null,
      last_episode_to_air: data.last_episode_to_air
        ? {
            id: data.last_episode_to_air.id,
            name: data.last_episode_to_air.name,
            overview: data.last_episode_to_air.overview,
            air_date: data.last_episode_to_air.air_date,
            episode_number: data.last_episode_to_air.episode_number,
            season_number: data.last_episode_to_air.season_number,
            still_path: data.last_episode_to_air.still_path,
          }
        : null,
    };
  }

  // Check mock data
  if (MOCK_DETAILS[id]) {
    return MOCK_DETAILS[id];
  }

  // Search trending mock for basic detail
  const basic = MOCK_TRENDING.find((m) => m.id === id);
  if (basic) {
    return {
      ...basic,
      tagline: '',
      status: 'Släppt',
    };
  }

  return null;
}

export async function getSeasonDetails(showId: number, seasonNumber: number): Promise<Season | null> {
  const data = await tmdbFetch<any>(`/tv/${showId}/season/${seasonNumber}`);
  if (data) {
    let overview = data.overview?.trim() || '';
    let isEnglishOverview = false;
    let episodes = data.episodes || [];

    // Fallback missing overviews to English
    if (!overview || episodes.some((ep: any) => !ep.overview?.trim())) {
      try {
        const enData = await tmdbFetch<any>(`/tv/${showId}/season/${seasonNumber}`, { language: 'en-US' });
        if (enData) {
          if (!overview && enData.overview?.trim()) {
            overview = enData.overview.trim();
            isEnglishOverview = true;
          }
          if (enData.episodes) {
            const enEpMap = new Map(enData.episodes.map((ep: any) => [ep.episode_number, ep]));
            episodes = episodes.map((ep: any) => {
              if (!ep.overview?.trim()) {
                const enEp: any = enEpMap.get(ep.episode_number);
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
      } catch {
        // ignore fallback failure
      }
    }

    return {
      id: data.id,
      season_number: data.season_number,
      name: data.name,
      overview,
      poster_path: data.poster_path,
      air_date: data.air_date,
      episode_count: episodes.length,
      is_english_overview: isEnglishOverview,
      episodes: episodes.map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        season_number: ep.season_number,
        name: ep.name,
        overview: ep.overview,
        air_date: ep.air_date,
        still_path: ep.still_path,
        vote_average: ep.vote_average,
        runtime: ep.runtime,
        is_english_overview: ep.is_english_overview,
      })),
    };
  }

  // Mock details fallback
  const mockShow = MOCK_DETAILS[showId];
  if (mockShow?.seasons) {
    const season = mockShow.seasons.find((s) => s.season_number === seasonNumber);
    if (season) return season;
  }

  return null;
}

export async function getGenres(): Promise<{ id: number; name: string }[]> {
  const movieGenres = await tmdbFetch<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
  if (movieGenres?.genres) {
    return movieGenres.genres;
  }
  return MOCK_GENRES;
}

export function normalizeMediaItem(item: any): MediaItem {
  return {
    id: item.id,
    title: item.title || item.name,
    original_title: item.original_title || item.original_name,
    overview: item.overview || '',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    media_type: (item.media_type === 'tv' || !item.title && item.name) ? 'tv' : 'movie',
    release_date: item.release_date,
    first_air_date: item.first_air_date,
    vote_average: Math.round((item.vote_average || 0) * 10) / 10,
    vote_count: item.vote_count || 0,
    genre_ids: item.genre_ids || [],
    origin_country: item.origin_country || [],
    original_language: item.original_language,
  };
}
