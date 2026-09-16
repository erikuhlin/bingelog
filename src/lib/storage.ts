import { UserMediaRecord, WatchedEpisodeRecord, MediaType, WatchStatus } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

const LOCAL_STORAGE_MEDIA_KEY = 'bingelog_user_media';
const LOCAL_STORAGE_EPISODES_KEY = 'bingelog_watched_episodes';

// Helper for local state
function getLocalMedia(): UserMediaRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMedia(items: UserMediaRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event('bingelog_storage_changed'));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

function getLocalWatchedEpisodes(): WatchedEpisodeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EPISODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWatchedEpisodes(episodes: WatchedEpisodeRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_EPISODES_KEY, JSON.stringify(episodes));
    window.dispatchEvent(new Event('bingelog_storage_changed'));
  } catch (err) {
    console.error('Failed to save watched episodes to localStorage:', err);
  }
}

export async function getUserMediaList(): Promise<UserMediaRecord[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('user_media')
        .select('*')
        .order('updated_at', { ascending: false });
      if (!error && data) {
        return data as UserMediaRecord[];
      }
    }
  }
  return getLocalMedia();
}

export async function getUserMediaItem(tmdbId: number, mediaType: MediaType): Promise<UserMediaRecord | null> {
  const list = await getUserMediaList();
  return list.find((m) => m.tmdb_id === tmdbId && m.media_type === mediaType) || null;
}

export async function saveUserMedia(
  item: Omit<UserMediaRecord, 'created_at' | 'updated_at'>
): Promise<UserMediaRecord> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const payload = {
        ...item,
        user_id: user.id,
        updated_at: now,
      };

      const { data, error } = await supabase
        .from('user_media')
        .upsert(payload, { onConflict: 'user_id,tmdb_id,media_type' })
        .select()
        .single();

      if (!error && data) {
        window.dispatchEvent(new Event('bingelog_storage_changed'));
        return data as UserMediaRecord;
      }
    }
  }

  // Local storage fallback
  const current = getLocalMedia();
  const existingIdx = current.findIndex(
    (m) => m.tmdb_id === item.tmdb_id && m.media_type === item.media_type
  );

  const updatedRecord: UserMediaRecord = {
    ...item,
    created_at: existingIdx >= 0 ? current[existingIdx].created_at : now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    current[existingIdx] = updatedRecord;
  } else {
    current.unshift(updatedRecord);
  }

  saveLocalMedia(current);
  return updatedRecord;
}

export async function removeUserMedia(tmdbId: number, mediaType: MediaType): Promise<void> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_media')
        .delete()
        .match({ user_id: user.id, tmdb_id: tmdbId, media_type: mediaType });
      window.dispatchEvent(new Event('bingelog_storage_changed'));
      return;
    }
  }

  const current = getLocalMedia().filter(
    (m) => !(m.tmdb_id === tmdbId && m.media_type === mediaType)
  );
  saveLocalMedia(current);
}

export async function getWatchedEpisodes(tmdbId: number): Promise<{ season_number: number; episode_number: number }[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase
        .from('watched_episodes')
        .select('season_number, episode_number')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId);
      if (!error && data) {
        return data;
      }
    }
  }

  const all = getLocalWatchedEpisodes();
  return all
    .filter((ep) => ep.tmdb_id === tmdbId)
    .map((ep) => ({ season_number: ep.season_number, episode_number: ep.episode_number }));
}

export async function toggleEpisodeWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<boolean> {
  const supabase = getSupabaseClient();
  const isWatched = await isEpisodeWatched(tmdbId, seasonNumber, episodeNumber);

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (isWatched) {
        await supabase
          .from('watched_episodes')
          .delete()
          .match({
            user_id: user.id,
            tmdb_id: tmdbId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
          });
      } else {
        await supabase.from('watched_episodes').insert({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          watched_at: new Date().toISOString(),
        });
      }
      window.dispatchEvent(new Event('bingelog_storage_changed'));
      return !isWatched;
    }
  }

  // Local storage fallback
  let all = getLocalWatchedEpisodes();
  if (isWatched) {
    all = all.filter(
      (ep) =>
        !(
          ep.tmdb_id === tmdbId &&
          ep.season_number === seasonNumber &&
          ep.episode_number === episodeNumber
        )
    );
  } else {
    all.push({
      tmdb_id: tmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
      watched_at: new Date().toISOString(),
    });
  }

  saveLocalWatchedEpisodes(all);
  return !isWatched;
}

export async function isEpisodeWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<boolean> {
  const watched = await getWatchedEpisodes(tmdbId);
  return watched.some(
    (ep) => ep.season_number === seasonNumber && ep.episode_number === episodeNumber
  );
}

export async function markSeasonWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeCount: number,
  markAll: boolean
): Promise<void> {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      if (markAll) {
        const rows = Array.from({ length: episodeCount }, (_, i) => ({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: seasonNumber,
          episode_number: i + 1,
          watched_at: new Date().toISOString(),
        }));
        await supabase.from('watched_episodes').upsert(rows, {
          onConflict: 'user_id,tmdb_id,season_number,episode_number',
        });
      } else {
        await supabase
          .from('watched_episodes')
          .delete()
          .match({ user_id: user.id, tmdb_id: tmdbId, season_number: seasonNumber });
      }
      window.dispatchEvent(new Event('bingelog_storage_changed'));
      return;
    }
  }

  let all = getLocalWatchedEpisodes();
  // Remove existing in season
  all = all.filter((ep) => !(ep.tmdb_id === tmdbId && ep.season_number === seasonNumber));

  if (markAll) {
    for (let i = 1; i <= episodeCount; i++) {
      all.push({
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: i,
        watched_at: new Date().toISOString(),
      });
    }
  }

  saveLocalWatchedEpisodes(all);
}
