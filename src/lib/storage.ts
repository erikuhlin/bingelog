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
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('user_media')
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.error('Supabase getUserMediaList error:', error);
        } else if (data) {
          // Mirror cloud state to local storage so device stays synchronized
          saveLocalMedia(data as UserMediaRecord[]);
          return data as UserMediaRecord[];
        }
      }
    } catch (err) {
      console.error('Error fetching media list from Supabase:', err);
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

  // 1. Optimistically update local storage first so UI reacts immediately
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

  // 2. Persist to Supabase if logged in
  if (supabase) {
    try {
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

        if (error) {
          console.error('Supabase saveUserMedia error:', error);
        } else if (data) {
          const refreshed = getLocalMedia();
          const rIdx = refreshed.findIndex(
            (m) => m.tmdb_id === item.tmdb_id && m.media_type === item.media_type
          );
          if (rIdx >= 0) {
            refreshed[rIdx] = data as UserMediaRecord;
            saveLocalMedia(refreshed);
          }
          return data as UserMediaRecord;
        }
      }
    } catch (err) {
      console.error('Error saving media item to Supabase:', err);
    }
  }

  return updatedRecord;
}

export async function removeUserMedia(tmdbId: number, mediaType: MediaType): Promise<void> {
  const supabase = getSupabaseClient();

  // 1. Always remove from local storage immediately
  const current = getLocalMedia().filter(
    (m) => !(m.tmdb_id === tmdbId && m.media_type === mediaType)
  );
  saveLocalMedia(current);

  // 2. Also remove from Supabase if logged in
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase
          .from('user_media')
          .delete()
          .match({ user_id: user.id, tmdb_id: tmdbId, media_type: mediaType });

        if (error) {
          console.error('Supabase removeUserMedia error:', error);
        }

        // If it's a TV series, also clean up watched episodes in Supabase
        if (mediaType === 'tv') {
          await supabase
            .from('watched_episodes')
            .delete()
            .match({ user_id: user.id, tmdb_id: tmdbId });
        }
      }
    } catch (err) {
      console.error('Error removing media from Supabase:', err);
    }
  }

  // Also remove local watched episodes if TV
  if (mediaType === 'tv') {
    const localEps = getLocalWatchedEpisodes().filter((ep) => ep.tmdb_id !== tmdbId);
    saveLocalWatchedEpisodes(localEps);
  }

  window.dispatchEvent(new Event('bingelog_storage_changed'));
}

export async function getWatchedEpisodes(tmdbId: number): Promise<{ season_number: number; episode_number: number }[]> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('watched_episodes')
          .select('season_number, episode_number')
          .eq('user_id', user.id)
          .eq('tmdb_id', tmdbId);

        if (error) {
          console.error('Supabase getWatchedEpisodes error:', error);
        } else if (data) {
          // Merge into local cache for offline/instant speed
          let local = getLocalWatchedEpisodes().filter((ep) => ep.tmdb_id !== tmdbId);
          data.forEach((d) => {
            local.push({
              tmdb_id: tmdbId,
              season_number: d.season_number,
              episode_number: d.episode_number,
              watched_at: new Date().toISOString(),
            });
          });
          saveLocalWatchedEpisodes(local);
          return data;
        }
      }
    } catch (err) {
      console.error('Error fetching watched episodes from Supabase:', err);
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
  const nextWatched = !isWatched;
  const now = new Date().toISOString();

  // 1. Optimistically update local storage
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
      watched_at: now,
    });
  }
  saveLocalWatchedEpisodes(all);

  // 2. Persist to Supabase if logged in
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (isWatched) {
          const { error } = await supabase
            .from('watched_episodes')
            .delete()
            .match({
              user_id: user.id,
              tmdb_id: tmdbId,
              season_number: seasonNumber,
              episode_number: episodeNumber,
            });
          if (error) console.error('Supabase delete watched_episodes error:', error);
        } else {
          const { error } = await supabase.from('watched_episodes').upsert({
            user_id: user.id,
            tmdb_id: tmdbId,
            season_number: seasonNumber,
            episode_number: episodeNumber,
            watched_at: now,
          }, { onConflict: 'user_id,tmdb_id,season_number,episode_number' });
          if (error) console.error('Supabase insert watched_episodes error:', error);
        }
      }
    } catch (err) {
      console.error('Error toggling episode in Supabase:', err);
    }
  }

  window.dispatchEvent(new Event('bingelog_storage_changed'));
  return nextWatched;
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
  const now = new Date().toISOString();

  // 1. Update local storage
  let all = getLocalWatchedEpisodes();
  all = all.filter((ep) => !(ep.tmdb_id === tmdbId && ep.season_number === seasonNumber));
  if (markAll) {
    for (let i = 1; i <= episodeCount; i++) {
      all.push({
        tmdb_id: tmdbId,
        season_number: seasonNumber,
        episode_number: i,
        watched_at: now,
      });
    }
  }
  saveLocalWatchedEpisodes(all);

  // 2. Persist to Supabase
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        if (markAll) {
          const rows = Array.from({ length: episodeCount }, (_, i) => ({
            user_id: user.id,
            tmdb_id: tmdbId,
            season_number: seasonNumber,
            episode_number: i + 1,
            watched_at: now,
          }));
          const { error } = await supabase.from('watched_episodes').upsert(rows, {
            onConflict: 'user_id,tmdb_id,season_number,episode_number',
          });
          if (error) console.error('Supabase markSeasonWatched error:', error);
        } else {
          const { error } = await supabase
            .from('watched_episodes')
            .delete()
            .match({ user_id: user.id, tmdb_id: tmdbId, season_number: seasonNumber });
          if (error) console.error('Supabase unmarkSeasonWatched error:', error);
        }
      }
    } catch (err) {
      console.error('Error updating season in Supabase:', err);
    }
  }

  window.dispatchEvent(new Event('bingelog_storage_changed'));
}

export async function markNextEpisodeWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number,
  isEndedSeries: boolean = false,
  isLastEpisodeInShow: boolean = false
): Promise<UserMediaRecord | null> {
  const supabase = getSupabaseClient();
  const now = new Date().toISOString();

  // 1. Mark episode in watched_episodes
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('watched_episodes').upsert({
          user_id: user.id,
          tmdb_id: tmdbId,
          season_number: seasonNumber,
          episode_number: episodeNumber,
          watched_at: now,
        }, { onConflict: 'user_id,tmdb_id,season_number,episode_number' });

        // Determine next status
        let nextStatus: WatchStatus = 'watching';
        if (isEndedSeries && isLastEpisodeInShow) {
          nextStatus = 'completed';
        }

        // Update user_media current position
        const { data } = await supabase
          .from('user_media')
          .update({
            current_season: seasonNumber,
            current_episode: episodeNumber,
            status: nextStatus,
            updated_at: now,
          })
          .match({ user_id: user.id, tmdb_id: tmdbId, media_type: 'tv' })
          .select()
          .single();

        window.dispatchEvent(new Event('bingelog_storage_changed'));
        return (data as UserMediaRecord) || null;
      }
    } catch (err) {
      console.error('Error in markNextEpisodeWatched:', err);
    }
  }

  // Local storage fallback
  let allEps = getLocalWatchedEpisodes();
  const exists = allEps.some(
    (ep) => ep.tmdb_id === tmdbId && ep.season_number === seasonNumber && ep.episode_number === episodeNumber
  );
  if (!exists) {
    allEps.push({
      tmdb_id: tmdbId,
      season_number: seasonNumber,
      episode_number: episodeNumber,
      watched_at: now,
    });
    saveLocalWatchedEpisodes(allEps);
  }

  const mediaList = getLocalMedia();
  const idx = mediaList.findIndex((m) => m.tmdb_id === tmdbId && m.media_type === 'tv');
  let updatedRecord: UserMediaRecord | null = null;

  if (idx >= 0) {
    let nextStatus = mediaList[idx].status;
    if (nextStatus === 'watchlist') {
      nextStatus = 'watching';
    }
    if (isEndedSeries && isLastEpisodeInShow) {
      nextStatus = 'completed';
    }

    updatedRecord = {
      ...mediaList[idx],
      current_season: seasonNumber,
      current_episode: episodeNumber,
      status: nextStatus,
      updated_at: now,
    };
    mediaList[idx] = updatedRecord;
    saveLocalMedia(mediaList);
  }

  return updatedRecord;
}

export async function getAllWatchedEpisodesCount(): Promise<number> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { count, error } = await supabase
          .from('watched_episodes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (!error && count !== null) {
          return count;
        }
      }
    } catch (err) {
      console.error('Error in getAllWatchedEpisodesCount:', err);
    }
  }

  return getLocalWatchedEpisodes().length;
}

export async function syncLocalDataToSupabase(userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase || !userId) return;

  try {
    const localMedia = getLocalMedia();
    if (localMedia.length > 0) {
      const rows = localMedia.map((m) => ({
        user_id: userId,
        tmdb_id: m.tmdb_id,
        media_type: m.media_type,
        title: m.title,
        poster_path: m.poster_path,
        backdrop_path: m.backdrop_path,
        status: m.status,
        user_rating: m.user_rating,
        current_season: m.current_season || 1,
        current_episode: m.current_episode || 0,
        runtime: m.runtime,
        updated_at: m.updated_at || new Date().toISOString(),
      }));

      await supabase.from('user_media').upsert(rows, {
        onConflict: 'user_id,tmdb_id,media_type',
      });
    }

    const localEpisodes = getLocalWatchedEpisodes();
    if (localEpisodes.length > 0) {
      const epRows = localEpisodes.map((ep) => ({
        user_id: userId,
        tmdb_id: ep.tmdb_id,
        season_number: ep.season_number,
        episode_number: ep.episode_number,
        watched_at: ep.watched_at || new Date().toISOString(),
      }));

      await supabase.from('watched_episodes').upsert(epRows, {
        onConflict: 'user_id,tmdb_id,season_number,episode_number',
      });
    }

    // Now pull full cloud library into local storage so devices match completely
    const { data: cloudMedia } = await supabase
      .from('user_media')
      .select('*')
      .order('updated_at', { ascending: false });

    if (cloudMedia && cloudMedia.length > 0) {
      saveLocalMedia(cloudMedia as UserMediaRecord[]);
    }

    window.dispatchEvent(new Event('bingelog_storage_changed'));
  } catch (err) {
    console.error('Error syncing local data to Supabase:', err);
  }
}
