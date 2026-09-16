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

export async function getTrendingMedia(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/trending/all/week');
  if (data?.results) {
    return data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(normalizeMediaItem);
  }
  return MOCK_TRENDING;
}

export async function getPopularMovies(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/movie/popular');
  if (data?.results) {
    return data.results.map((item) => normalizeMediaItem({ ...item, media_type: 'movie' }));
  }
  return MOCK_TRENDING.filter((item) => item.media_type === 'movie');
}

export async function getPopularShows(): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: any[] }>('/tv/popular');
  if (data?.results) {
    return data.results.map((item) => normalizeMediaItem({ ...item, media_type: 'tv' }));
  }
  return MOCK_TRENDING.filter((item) => item.media_type === 'tv');
}

export async function searchMedia(query: string): Promise<MediaItem[]> {
  if (!query.trim()) return [];

  const data = await tmdbFetch<{ results: any[] }>('/search/multi', { query: query.trim() });
  if (data?.results) {
    return data.results
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map(normalizeMediaItem);
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
  const data = await tmdbFetch<any>(endpoint, { append_to_response: 'credits' });

  if (data) {
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
      credits: data.credits ? {
        cast: data.credits.cast?.slice(0, 8).map((c: any) => ({
          id: c.id,
          name: c.name,
          character: c.character,
          profile_path: c.profile_path,
        })) || []
      } : undefined
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
