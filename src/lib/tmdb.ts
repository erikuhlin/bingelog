import { MediaItem, MediaDetail, Season, MediaType } from './types';
import { MOCK_TRENDING, MOCK_GENRES, MOCK_DETAILS } from './mock-data';

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

async function tmdbFetch<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T | null> {
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
  { id: 350, name: 'Apple TV', logo_path: '/9icYBfYFcwgCbky5VdGUIKJ4C5i.png', bg: 'bg-zinc-700' },
  { id: 76, name: 'Viaplay', logo_path: '/c1J9PGGowXwW5AxAaZaGipeFu7U.png', bg: 'bg-rose-700' },
  { id: 1944, name: 'TV4 Play', logo_path: '/8sxwkXfXhlIHkAlkZ64kTU9BNyT.png', bg: 'bg-red-700' },
  { id: 493, name: 'SVT Play', logo_path: '/vMU9xqjyIsOplkdSCRveond8fxV.png', bg: 'bg-emerald-600' },
];

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

export async function discoverMedia(filters: import('./types').DiscoverFilters): Promise<MediaItem[]> {
  const {
    mediaType = 'all',
    providerId,
    genreId,
    minRating,
    year,
    sortBy = 'popularity.desc',
    page = 1,
  } = filters;

  const baseParams: Record<string, string | number> = {
    page,
    sort_by: sortBy,
    'vote_count.gte': 10,
  };

  if (genreId) {
    baseParams.with_genres = genreId;
  }
  if (minRating) {
    baseParams['vote_average.gte'] = minRating;
  }
  if (providerId) {
    baseParams.watch_region = 'SE';
    baseParams.with_watch_providers = providerId;
    baseParams.with_watch_monetization_types = 'flatrate';
  }

  const selectedProvider = providerId
    ? SWEDISH_STREAMING_PROVIDERS.find((p) => p.id === providerId)
    : null;

  const attachSelectedProvider = (items: MediaItem[]) => {
    if (!selectedProvider) return items;
    return items.map((item) => ({
      ...item,
      watch_providers: [
        {
          provider_id: selectedProvider.id,
          provider_name: selectedProvider.name,
          logo_path: selectedProvider.logo_path,
        },
      ],
    }));
  };

  if (mediaType === 'movie') {
    const params = { ...baseParams };
    if (year) params.primary_release_year = year;
    const data = await tmdbFetch<{ results: any[] }>('/discover/movie', params);
    const items = (data?.results || []).map((m) => normalizeMediaItem({ ...m, media_type: 'movie' }));
    return attachSelectedProvider(items);
  }

  if (mediaType === 'tv') {
    const params = { ...baseParams };
    if (year) params.first_air_date_year = year;
    const data = await tmdbFetch<{ results: any[] }>('/discover/tv', params);
    const items = (data?.results || []).map((t) => normalizeMediaItem({ ...t, media_type: 'tv' }));
    return attachSelectedProvider(items);
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
  return attachSelectedProvider(merged.slice(0, 20));
}

export async function searchMedia(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const data = await tmdbFetch<{ results: any[] }>('/search/multi', { query: query.trim() });
  if (data?.results) {
    const list = data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(normalizeMediaItem);
    return enrichItemsWithProviders(list);
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

export async function getMediaDetails(mediaType: MediaType, id: number): Promise<MediaDetail | null> {
  const endpoint = `/${mediaType}/${id}`;
  const data = await tmdbFetch<any>(endpoint, {
    append_to_response: 'credits,videos,watch/providers,recommendations',
  });

  if (data) {
    const swedishProviders = data['watch/providers']?.results?.SE;
    const trailers = data.videos?.results?.filter(
      (v: any) => v.site === 'YouTube' && (v.type === 'Trailer' || v.type === 'Teaser')
    ) || [];

    const directors = data.credits?.crew
      ?.filter((c: any) => c.job === 'Director')
      ?.map((c: any) => ({ id: c.id, name: c.name })) || [];

    const createdBy = data.created_by?.map((c: any) => ({
      id: c.id,
      name: c.name,
      profile_path: c.profile_path,
    })) || [];

    const recommendations = data.recommendations?.results
      ?.slice(0, 8)
      ?.map(normalizeMediaItem) || [];

    return {
      id: data.id,
      title: data.title || data.name,
      original_title: data.original_title || data.original_name,
      overview: data.overview || 'Ingen beskrivning tillgänglig på svenska.',
      poster_path: data.poster_path,
      backdrop_path: data.backdrop_path,
      media_type: mediaType,
      release_date: data.release_date,
      first_air_date: data.first_air_date,
      vote_average: data.vote_average || 0,
      vote_count: data.vote_count || 0,
      genres: data.genres || [],
      origin_country: data.origin_country || [],
      tagline: data.tagline,
      status: data.status,
      runtime: data.runtime,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      seasons: data.seasons?.filter((s: any) => s.season_number > 0),
      created_by: createdBy.length > 0 ? createdBy : undefined,
      directors: directors.length > 0 ? directors : undefined,
      credits: data.credits ? {
        cast: data.credits.cast?.slice(0, 10).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
        })) || []
      } : undefined,
      videos: trailers.length > 0 ? trailers : undefined,
      watch_providers: swedishProviders?.flatrate?.map((p: any) => ({
        provider_id: p.provider_id,
        provider_name: p.provider_name,
        logo_path: p.logo_path,
      })) || [],
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
    return {
      id: data.id,
      season_number: data.season_number,
      name: data.name,
      overview: data.overview,
      poster_path: data.poster_path,
      air_date: data.air_date,
      episode_count: data.episodes?.length || 0,
      episodes: data.episodes?.map((ep: any) => ({
        id: ep.id,
        episode_number: ep.episode_number,
        season_number: ep.season_number,
        name: ep.name,
        overview: ep.overview,
        air_date: ep.air_date,
        still_path: ep.still_path,
        vote_average: ep.vote_average,
        runtime: ep.runtime,
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

function normalizeMediaItem(item: any): MediaItem {
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
