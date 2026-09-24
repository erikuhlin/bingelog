import { UserMediaRecord, WatchedEpisodeRecord, MediaType, WatchStatus } from './types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase/client';

const LOCAL_STORAGE_MEDIA_KEY = 'bingelog_user_media';
const LOCAL_STORAGE_EPISODES_KEY = 'bingelog_watched_episodes';

// Helper for local state
export function getLocalMedia(): UserMediaRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MEDIA_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMedia(items: UserMediaRecord[], emitEvent: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_MEDIA_KEY, JSON.stringify(items));
    if (emitEvent) {
      window.dispatchEvent(new Event('bingelog_storage_changed'));
    }
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function getLocalWatchedEpisodes(): WatchedEpisodeRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_EPISODES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalWatchedEpisodes(episodes: WatchedEpisodeRecord[], emitEvent: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_EPISODES_KEY, JSON.stringify(episodes));
    if (emitEvent) {
      window.dispatchEvent(new Event('bingelog_storage_changed'));
    }
  } catch (err) {
    console.error('Failed to save watched episodes to localStorage:', err);
  }
}

export function clearLocalData(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LOCAL_STORAGE_MEDIA_KEY);
    localStorage.removeItem(LOCAL_STORAGE_EPISODES_KEY);
  } catch (err) {
    console.error('Failed to clear local storage:', err);
  }
}

export function getShowProgress(tmdbId: number): {
  watchedCount: number;
  latestSeason: number;
  latestEpisode: number;
  watchedSet: Set<string>;
} {
  const allWatched = getLocalWatchedEpisodes().filter((ep) => ep.tmdb_id === tmdbId);
  let latestSeason = 1;
  let latestEpisode = 0;
  const watchedSet = new Set<string>();

  allWatched.forEach((ep) => {
    watchedSet.add(`${ep.season_number}-${ep.episode_number}`);
    if (
      ep.season_number > latestSeason ||
      (ep.season_number === latestSeason && ep.episode_number > latestEpisode)
    ) {
      latestSeason = ep.season_number;
      latestEpisode = ep.episode_number;
    }
  });

  return {
    watchedCount: allWatched.length,
    latestSeason,
    latestEpisode,
    watchedSet,
  };
}

export async function getUserMediaList(): Promise<UserMediaRecord[]> {
  const localItems = getLocalMedia();
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return localItems;
      }
      const { data, error } = await supabase
        .from('user_media')
        .select('*')
        .order('updated_at', { ascending: false });

        if (error) {
          console.error('Supabase getUserMediaList error:', error);
        } else if (data) {
          // Merge cloud data with local items to avoid wiping out recent optimistic local writes
          const cloudMap = new Map<string, UserMediaRecord>();
          (data as UserMediaRecord[]).forEach((item) => {
            cloudMap.set(`${item.media_type}-${item.tmdb_id}`, item);
          });

          // Keep local record if it was updated more recently than cloud, or if newly added
          const merged: UserMediaRecord[] = [];
          const seen = new Set<string>();

          localItems.forEach((local) => {
            const key = `${local.media_type}-${local.tmdb_id}`;
            seen.add(key);
            const cloud = cloudMap.get(key);
            if (!cloud) {
              merged.push(local);
            } else {
              const localTime = new Date(local.updated_at || 0).getTime();
              const cloudTime = new Date(cloud.updated_at || 0).getTime();
              merged.push(localTime >= cloudTime ? local : cloud);
            }
          });

          // Add any remaining cloud items
          cloudMap.forEach((cloud, key) => {
            if (!seen.has(key)) {
              merged.push(cloud);
            }
          });

          // Save merged cache WITHOUT firing storage event (prevents infinite loop)
          saveLocalMedia(merged, false);
          return merged;
        }
      }
    } catch (err) {
      console.error('Error fetching media list from Supabase:', err);
    }
  }
  return localItems;
}

export function getLocalMediaItem(tmdbId: number, mediaType: MediaType): UserMediaRecord | null {
  const list = getLocalMedia();
  return list.find((m) => m.tmdb_id === tmdbId && m.media_type === mediaType) || null;
}

export async function getUserMediaItem(tmdbId: number, mediaType: MediaType): Promise<UserMediaRecord | null> {
  const localItem = getLocalMediaItem(tmdbId, mediaType);
  if (localItem) return localItem;

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return localItem;
    } catch {
      return localItem;
    }
  }
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

  const existingItem = existingIdx >= 0 ? current[existingIdx] : undefined;

  // For TV shows, derive latest progress from actual watched episodes if available
  const progress = item.media_type === 'tv' ? getShowProgress(item.tmdb_id) : null;
  const resolvedSeason = item.current_season ?? existingItem?.current_season ?? (progress && progress.latestEpisode > 0 ? progress.latestSeason : 1);
  const resolvedEpisode = item.current_episode ?? existingItem?.current_episode ?? (progress && progress.latestEpisode > 0 ? progress.latestEpisode : 0);

  const updatedRecord: UserMediaRecord = {
    ...existingItem,
    ...item,
    current_season: resolvedSeason,
    current_episode: resolvedEpisode,
    created_at: existingItem?.created_at || now,
    updated_at: now,
  };

  if (existingIdx >= 0) {
    current[existingIdx] = updatedRecord;
  } else {
    current.unshift(updatedRecord);
  }
  saveLocalMedia(current, true);

  // 2. Persist to Supabase if logged in
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const payload: Record<string, any> = {
          ...updatedRecord,
          user_id: user.id,
          updated_at: now,
        };

        let { data, error } = await supabase
          .from('user_media')
          .upsert(payload, { onConflict: 'user_id,tmdb_id,media_type' })
          .select()
          .single();

        // If error due to missing columns in older database migrations, retry with base columns
        if (error && (error.message?.includes('current_season') || error.message?.includes('current_episode'))) {
          const fallbackPayload = {
            user_id: user.id,
            tmdb_id: updatedRecord.tmdb_id,
            media_type: updatedRecord.media_type,
            title: updatedRecord.title,
            poster_path: updatedRecord.poster_path,
            backdrop_path: updatedRecord.backdrop_path,
            status: updatedRecord.status,
            user_rating: updatedRecord.user_rating,
            notes: updatedRecord.notes,
            updated_at: now,
          };
          const fallbackRes = await supabase
            .from('user_media')
            .upsert(fallbackPayload, { onConflict: 'user_id,tmdb_id,media_type' })
            .select()
            .single();
          data = fallbackRes.data;
          error = fallbackRes.error;
        }

        if (error) {
          console.error('Supabase saveUserMedia error:', error);
        } else if (data) {
          const refreshed = getLocalMedia();
          const rIdx = refreshed.findIndex(
            (m) => m.tmdb_id === item.tmdb_id && m.media_type === item.media_type
          );
          if (rIdx >= 0) {
            refreshed[rIdx] = { ...refreshed[rIdx], id: data.id };
            saveLocalMedia(refreshed, false);
          }
          return { ...updatedRecord, id: data.id };
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
  saveLocalMedia(current, true);

  // Also remove local watched episodes if TV
  if (mediaType === 'tv') {
    const localEps = getLocalWatchedEpisodes().filter((ep) => ep.tmdb_id !== tmdbId);
    saveLocalWatchedEpisodes(localEps, false);
  }

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
}

export async function syncAllWatchedEpisodes(): Promise<WatchedEpisodeRecord[]> {
  const supabase = getSupabaseClient();
  if (!supabase) return getLocalWatchedEpisodes();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getLocalWatchedEpisodes();

    const { data, error } = await supabase
      .from('watched_episodes')
      .select('tmdb_id, season_number, episode_number, watched_at')
      .eq('user_id', user.id);

    if (error) {
      console.error('Supabase syncAllWatchedEpisodes error:', error);
      return getLocalWatchedEpisodes();
    }

    if (data) {
      const local = getLocalWatchedEpisodes();
      if (local.length === 0) {
        saveLocalWatchedEpisodes(data as WatchedEpisodeRecord[], false);
        return data as WatchedEpisodeRecord[];
      }

      // Merge: union with cloud records taking precedence
      const map = new Map<string, WatchedEpisodeRecord>();
      (data as WatchedEpisodeRecord[]).forEach((ep) => {
        map.set(`${ep.tmdb_id}-${ep.season_number}-${ep.episode_number}`, ep);
      });
      local.forEach((ep) => {
        const key = `${ep.tmdb_id}-${ep.season_number}-${ep.episode_number}`;
        if (!map.has(key)) {
          map.set(key, ep);
        }
      });

      const merged = Array.from(map.values());
      saveLocalWatchedEpisodes(merged, false);
      return merged;
    }
  } catch (err) {
    console.error('Error syncing all watched episodes:', err);
  }

  return getLocalWatchedEpisodes();
}

export async function getWatchedEpisodes(tmdbId: number): Promise<{ season_number: number; episode_number: number }[]> {
  const allLocal = getLocalWatchedEpisodes();
  const localShow = allLocal.filter((ep) => ep.tmdb_id === tmdbId);

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return localShow.map((ep) => ({ season_number: ep.season_number, episode_number: ep.episode_number }));
      }
      const { data, error } = await supabase
        .from('watched_episodes')
        .select('season_number, episode_number, watched_at')
        .eq('user_id', user.id)
        .eq('tmdb_id', tmdbId);

        if (error) {
          console.error('Supabase getWatchedEpisodes error:', error);
        } else if (data) {
          // If localShow had no records for this show, populate from cloud
          if (localShow.length === 0 && data.length > 0) {
            const newRecords: WatchedEpisodeRecord[] = data.map((d) => ({
              tmdb_id: tmdbId,
              season_number: d.season_number,
              episode_number: d.episode_number,
              watched_at: d.watched_at || new Date().toISOString(),
            }));
            const otherShows = allLocal.filter((ep) => ep.tmdb_id !== tmdbId);
            saveLocalWatchedEpisodes([...otherShows, ...newRecords], false);
            return newRecords.map((ep) => ({
              season_number: ep.season_number,
              episode_number: ep.episode_number,
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching watched episodes from Supabase:', err);
    }
  }

  return localShow.map((ep) => ({ season_number: ep.season_number, episode_number: ep.episode_number }));
}

export async function isEpisodeWatched(
  tmdbId: number,
  seasonNumber: number,
  episodeNumber: number
): Promise<boolean> {
  const local = getLocalWatchedEpisodes();
  return local.some(
    (ep) =>
      ep.tmdb_id === tmdbId &&
      ep.season_number === seasonNumber &&
      ep.episode_number === episodeNumber
  );
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
  saveLocalWatchedEpisodes(all, true);

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

  return nextWatched;
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
  saveLocalWatchedEpisodes(all, true);

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

  // 1. Optimistically update local watched episodes
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
    saveLocalWatchedEpisodes(allEps, false);
  }

  // 2. Optimistically update local user_media record
  const mediaList = getLocalMedia();
  const idx = mediaList.findIndex((m) => m.tmdb_id === tmdbId && m.media_type === 'tv');
  let updatedRecord: UserMediaRecord | null = null;
  let nextStatus: WatchStatus = 'watching';

  if (idx >= 0) {
    nextStatus = mediaList[idx].status;
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
    saveLocalMedia(mediaList, true);
  } else {
    // If not yet in mediaList, trigger storage change for episodes
    window.dispatchEvent(new Event('bingelog_storage_changed'));
  }

  // 3. Persist to Supabase in background if logged in
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

        if (data) {
          return data as UserMediaRecord;
        }
      }
    } catch (err) {
      console.error('Error in markNextEpisodeWatched:', err);
    }
  }

  return updatedRecord;
}

export async function getAllWatchedEpisodesCount(): Promise<number> {
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return getLocalWatchedEpisodes().length;
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

    // Now pull full cloud library into local storage WITH SAFE MERGE
    const { data: cloudMedia } = await supabase
      .from('user_media')
      .select('*')
      .order('updated_at', { ascending: false });

    if (cloudMedia && cloudMedia.length > 0) {
      const cloudMap = new Map<string, UserMediaRecord>();
      (cloudMedia as UserMediaRecord[]).forEach((item) => {
        cloudMap.set(`${item.media_type}-${item.tmdb_id}`, item);
      });

      const mergedMedia: UserMediaRecord[] = [];
      const seen = new Set<string>();

      localMedia.forEach((local) => {
        const key = `${local.media_type}-${local.tmdb_id}`;
        seen.add(key);
        const cloud = cloudMap.get(key);
        if (!cloud) {
          mergedMedia.push(local);
        } else {
          // Keep best episode progress
          const localEp = local.current_episode || 0;
          const cloudEp = cloud.current_episode || 0;
          const bestEp = Math.max(localEp, cloudEp);
          const bestSeason = bestEp === localEp ? (local.current_season || 1) : (cloud.current_season || 1);

          const localTime = new Date(local.updated_at || 0).getTime();
          const cloudTime = new Date(cloud.updated_at || 0).getTime();
          const base = localTime >= cloudTime ? local : cloud;

          mergedMedia.push({
            ...base,
            current_season: bestSeason,
            current_episode: bestEp,
          });
        }
      });

      cloudMap.forEach((cloud, key) => {
        if (!seen.has(key)) {
          mergedMedia.push(cloud);
        }
      });

      saveLocalMedia(mergedMedia, false);
    }

    // Also pull cloud watched episodes into local storage
    const { data: cloudEpisodes } = await supabase
      .from('watched_episodes')
      .select('tmdb_id, season_number, episode_number, watched_at')
      .eq('user_id', userId);

    if (cloudEpisodes && cloudEpisodes.length > 0) {
      const epMap = new Map<string, WatchedEpisodeRecord>();
      (cloudEpisodes as WatchedEpisodeRecord[]).forEach((ep) => {
        epMap.set(`${ep.tmdb_id}-${ep.season_number}-${ep.episode_number}`, ep);
      });
      localEpisodes.forEach((ep) => {
        const key = `${ep.tmdb_id}-${ep.season_number}-${ep.episode_number}`;
        if (!epMap.has(key)) {
          epMap.set(key, ep);
        }
      });
      saveLocalWatchedEpisodes(Array.from(epMap.values()), false);
    }

    window.dispatchEvent(new Event('bingelog_storage_changed'));
  } catch (err) {
    console.error('Error syncing local data to Supabase:', err);
  }
}
