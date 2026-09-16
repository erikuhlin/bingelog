export type MediaType = 'movie' | 'tv';

export type WatchStatus = 'watchlist' | 'watching' | 'completed' | 'dropped';

export interface MediaItem {
  id: number;
  title: string; // Movie title or TV name
  original_title?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type: MediaType;
  release_date?: string; // Movies
  first_air_date?: string; // Series
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: { id: number; name: string }[];
  popularity?: number;
  origin_country?: string[];
  original_language?: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  runtime?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  overview: string;
  poster_path: string | null;
  air_date: string | null;
  episode_count: number;
  episodes?: Episode[];
}

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export interface MediaDetail extends MediaItem {
  tagline?: string;
  status?: string;
  runtime?: number; // Movie duration in minutes
  number_of_seasons?: number; // TV
  number_of_episodes?: number; // TV
  seasons?: Season[];
  created_by?: {
    id: number;
    name: string;
    profile_path: string | null;
  }[];
  directors?: {
    id: number;
    name: string;
  }[];
  credits?: {
    cast: {
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }[];
  };
  videos?: Video[];
  watch_providers?: {
    link?: string;
    flatrate?: WatchProvider[];
    rent?: WatchProvider[];
    buy?: WatchProvider[];
  };
  recommendations?: MediaItem[];
}

export interface UserMediaRecord {
  id?: string;
  user_id?: string;
  tmdb_id: number;
  media_type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  status: WatchStatus;
  user_rating?: number | null; // 1-10
  notes?: string;
  created_at?: string;
  updated_at?: string;
  // Computed or cached for TV
  last_season_watched?: number;
  last_episode_watched?: number;
  total_episodes_watched?: number;
  total_episodes?: number;
}

export interface WatchedEpisodeRecord {
  id?: string;
  user_id?: string;
  tmdb_id: number;
  season_number: number;
  episode_number: number;
  watched_at?: string;
}
