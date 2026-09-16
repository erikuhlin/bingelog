'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, Eye, CheckCircle2, XCircle, Trash2, Star } from 'lucide-react';
import { WatchStatus, MediaType, UserMediaRecord } from '@/lib/types';
import { getUserMediaItem, saveUserMedia, removeUserMedia } from '@/lib/storage';

interface StatusSelectorProps {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  className?: string;
  showRating?: boolean;
}

export default function StatusSelector({
  tmdbId,
  mediaType,
  title,
  posterPath,
  backdropPath,
  className = '',
  showRating = false,
}: StatusSelectorProps) {
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      const item = await getUserMediaItem(tmdbId, mediaType);
      if (item) {
        setCurrentStatus(item.status);
        setUserRating(item.user_rating || null);
      } else {
        setCurrentStatus(null);
        setUserRating(null);
      }
    }

    loadStatus();

    const handleStorageChange = () => loadStatus();
    window.addEventListener('bingelog_storage_changed', handleStorageChange);
    return () => window.removeEventListener('bingelog_storage_changed', handleStorageChange);
  }, [tmdbId, mediaType]);

  const handleStatusChange = async (status: WatchStatus) => {
    setLoading(true);
    try {
      await saveUserMedia({
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        status,
        user_rating: userRating,
      });
      setCurrentStatus(status);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      await removeUserMedia(tmdbId, mediaType);
      setCurrentStatus(null);
      setUserRating(null);
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = async (rating: number) => {
    const newRating = userRating === rating ? null : rating;
    setUserRating(newRating);
    if (currentStatus) {
      await saveUserMedia({
        tmdb_id: tmdbId,
        media_type: mediaType,
        title,
        poster_path: posterPath,
        backdrop_path: backdropPath,
        status: currentStatus,
        user_rating: newRating,
      });
    }
  };

  const statusConfigs: Record<WatchStatus, { label: string; icon: any; color: string; border: string }> = {
    watchlist: {
      label: 'Vill se',
      icon: Bookmark,
      color: 'bg-blue-900/30 text-blue-400',
      border: 'border-blue-800/40',
    },
    watching: {
      label: 'Tittar på',
      icon: Eye,
      color: 'bg-amber-900/30 text-amber-400',
      border: 'border-amber-800/40',
    },
    completed: {
      label: 'Har sett',
      icon: CheckCircle2,
      color: 'bg-emerald-900/30 text-emerald-400',
      border: 'border-emerald-800/40',
    },
    dropped: {
      label: 'Avbruten',
      icon: XCircle,
      color: 'bg-zinc-800 text-zinc-400',
      border: 'border-zinc-700',
    },
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {currentStatus ? (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border} hover:opacity-90 shadow-sm`}
          >
            {React.createElement(statusConfigs[currentStatus].icon, { className: 'w-3.5 h-3.5' })}
            <span>{statusConfigs[currentStatus].label}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all shadow-sm"
          >
            <Bookmark className="w-3.5 h-3.5 text-rose-500" />
            <span>Lägg till</span>
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
          <div className="text-[11px] font-semibold text-zinc-400 px-2.5 py-1 uppercase tracking-wider">
            Välj status
          </div>
          {(['watchlist', 'watching', 'completed', 'dropped'] as WatchStatus[]).map((status) => {
            const config = statusConfigs[status];
            const Icon = config.icon;
            const isSelected = currentStatus === status;

            return (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusChange(status)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  isSelected ? `${config.color} font-semibold` : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </button>
            );
          })}

          {currentStatus && (
            <>
              <div className="my-1 border-t border-zinc-800" />
              <button
                type="button"
                onClick={handleRemove}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ta bort från listan</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Optional Rating Stars if in detail page */}
      {showRating && currentStatus && (
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs text-zinc-400 mr-1.5">Ditt betyg:</span>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(star * 2)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`w-4 h-4 ${
                  userRating && userRating >= star * 2
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-zinc-600'
                }`}
              />
            </button>
          ))}
          {userRating && (
            <span className="text-xs font-bold text-amber-400 ml-1">{userRating}/10</span>
          )}
        </div>
      )}
    </div>
  );
}
