'use client';

import React, { useState, useEffect } from 'react';
import { Bookmark, Eye, CheckCircle2, XCircle, Trash2, Star } from 'lucide-react';
import { WatchStatus, MediaType } from '@/lib/types';
import { getUserMediaItem, saveUserMedia, removeUserMedia } from '@/lib/storage';
import { useAuth } from '@/context/AuthContext';

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
  const { user, openAuthModal } = useAuth();
  const [currentStatus, setCurrentStatus] = useState<WatchStatus | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      if (!user) {
        setCurrentStatus(null);
        setUserRating(null);
        return;
      }
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
  }, [tmdbId, mediaType, user]);

  const handleButtonClick = () => {
    if (!user) {
      openAuthModal('signup');
      return;
    }
    setIsOpen(!isOpen);
  };

  const handleStatusChange = async (status: WatchStatus) => {
    if (!user) {
      openAuthModal('signup');
      return;
    }

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
    if (!user) return;
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
    if (!user) {
      openAuthModal('signup');
      return;
    }

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
      color: 'bg-[#1E2531] text-[#ECE9E3]',
      border: 'border-[#2B3443]',
    },
    watching: {
      label: 'Tittar på',
      icon: Eye,
      color: 'bg-[#E9A23B]/15 text-[#E9A23B]',
      border: 'border-[#E9A23B]/40',
    },
    completed: {
      label: 'Har sett',
      icon: CheckCircle2,
      color: 'bg-[#6FA98A]/15 text-[#6FA98A]',
      border: 'border-[#6FA98A]/40',
    },
    dropped: {
      label: 'Avbruten',
      icon: XCircle,
      color: 'bg-[#171C25] text-[#8D97A8]',
      border: 'border-[#2B3443]',
    },
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {currentStatus ? (
          <button
            type="button"
            onClick={handleButtonClick}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border} hover:opacity-90 shadow-sm`}
          >
            {React.createElement(statusConfigs[currentStatus].icon, { className: 'w-3.5 h-3.5' })}
            <span>{statusConfigs[currentStatus].label}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#171C25] hover:bg-[#1E2531] text-[#ECE9E3] border border-[#2B3443] transition-all shadow-sm hover:border-[#E9A23B]/40"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Lägg till</span>
          </button>
        )}
      </div>

      {/* Dropdown menu */}
      {isOpen && user && (
        <div className="absolute right-0 mt-2 w-48 bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95">
          <div className="text-[11px] font-semibold text-[#8D97A8] px-2.5 py-1 uppercase tracking-wider">
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
                  isSelected ? `${config.color} font-semibold` : 'text-[#ECE9E3] hover:bg-[#1E2531]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{config.label}</span>
              </button>
            );
          })}

          {currentStatus && (
            <>
              <div className="my-1 border-t border-[#2B3443]" />
              <button
                type="button"
                onClick={handleRemove}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ta bort från listan</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Optional Rating Stars if in detail page */}
      {showRating && currentStatus && user && (
        <div className="mt-3 flex items-center gap-1">
          <span className="text-xs text-[#8D97A8] mr-1.5">Ditt betyg:</span>
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
                    ? 'text-[#E9A23B] fill-[#E9A23B]'
                    : 'text-[#2B3443]'
                }`}
              />
            </button>
          ))}
          {userRating && (
            <span className="text-xs font-bold text-[#E9A23B] ml-1">{userRating}/10</span>
          )}
        </div>
      )}
    </div>
  );
}
