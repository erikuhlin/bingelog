'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Bookmark, Eye, CheckCircle2, XCircle, Trash2, Star, X, Check } from 'lucide-react';
import { WatchStatus, MediaType } from '@/lib/types';
import { getUserMediaItem, saveUserMedia, removeUserMedia } from '@/lib/storage';
import { getImageUrl } from '@/lib/tmdb';
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Lock body scroll while modal is open & listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      openAuthModal('signup');
      return;
    }
    setIsOpen(true);
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

  const statusConfigs: Record<WatchStatus, { label: string; desc: string; icon: any; color: string; border: string; bg: string }> = {
    watchlist: {
      label: 'Vill se',
      desc: 'Lägg i din personliga bevakningslista',
      icon: Bookmark,
      color: 'text-[#ECE9E3]',
      border: 'border-[#2B3443]',
      bg: 'bg-[#1E2531]',
    },
    watching: {
      label: 'Tittar på',
      desc: 'Aktivt pågående film eller serie',
      icon: Eye,
      color: 'text-[#E9A23B]',
      border: 'border-[#E9A23B]/40',
      bg: 'bg-[#E9A23B]/15',
    },
    completed: {
      label: 'Har sett',
      desc: 'Avslutad eller sedd titel',
      icon: CheckCircle2,
      color: 'text-[#6FA98A]',
      border: 'border-[#6FA98A]/40',
      bg: 'bg-[#6FA98A]/15',
    },
    dropped: {
      label: 'Avbruten',
      desc: 'Slutat titta eller pausad',
      icon: XCircle,
      color: 'text-[#8D97A8]',
      border: 'border-[#2B3443]',
      bg: 'bg-[#171C25]',
    },
  };

  const modalContent = isOpen && mounted && typeof document !== 'undefined' ? (
    createPortal(
      <div
        className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      >
        <div
          className="w-full sm:max-w-md bg-[#171C25] border border-[#2B3443] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 text-left max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with media thumbnail & title */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#2B3443]">
            <div className="flex items-center gap-3 min-w-0">
              {posterPath ? (
                <img
                  src={getImageUrl(posterPath, 'w300')}
                  alt={title}
                  className="w-11 h-16 rounded-xl object-cover bg-[#0F1218] border border-[#2B3443] flex-shrink-0 shadow-md"
                />
              ) : (
                <div className="w-11 h-16 rounded-xl bg-[#0F1218] border border-[#2B3443] flex items-center justify-center text-[#8D97A8] flex-shrink-0">
                  <Bookmark className="w-5 h-5 text-[#E9A23B]" />
                </div>
              )}
              <div className="min-w-0">
                <span className="text-[11px] font-semibold text-[#8D97A8] uppercase tracking-wider block">
                  {mediaType === 'movie' ? 'Film' : 'Serie'} · Välj status
                </span>
                <h3 className="text-sm sm:text-base font-bold text-[#ECE9E3] truncate mt-0.5" title={title}>
                  {title}
                </h3>
                {currentStatus && (
                  <span className={`inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border}`}>
                    {statusConfigs[currentStatus].label}
                  </span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-full bg-[#1E2531] text-[#8D97A8] hover:text-[#ECE9E3] border border-[#2B3443] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Selection Options */}
          <div className="space-y-2 py-4">
            {(['watchlist', 'watching', 'completed', 'dropped'] as WatchStatus[]).map((status) => {
              const config = statusConfigs[status];
              const Icon = config.icon;
              const isSelected = currentStatus === status;

              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatusChange(status)}
                  disabled={loading}
                  className={`w-full p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? `${config.bg} ${config.border} ring-2 ring-[#E9A23B]/40 shadow-md`
                      : 'bg-[#0F1218]/60 border-[#2B3443] hover:bg-[#1E2531] hover:border-[#2B3443]/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${isSelected ? config.border : 'border-[#2B3443]'} ${config.bg}`}>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="text-left">
                      <p className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-[#ECE9E3]' : 'text-[#ECE9E3]/90'}`}>
                        {config.label}
                      </p>
                      <p className="text-[11px] text-[#8D97A8]">{config.desc}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#E9A23B] text-[#0F1218] flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Rating Section (accessible inside modal whenever active) */}
          {currentStatus && (
            <div className="pt-3 pb-4 border-t border-[#2B3443]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#8D97A8]">Ditt betyg:</span>
                {userRating && (
                  <span className="text-xs font-bold text-[#E9A23B] bg-[#E9A23B]/10 px-2 py-0.5 rounded-md border border-[#E9A23B]/30">
                    ★ {userRating}/10
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 bg-[#0F1218]/60 p-2 rounded-xl border border-[#2B3443]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleRatingChange(star)}
                    className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    title={`Betygsätt ${star}/10`}
                  >
                    <Star
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        userRating && userRating >= star
                          ? 'text-[#E9A23B] fill-[#E9A23B]'
                          : 'text-[#2B3443] hover:text-[#E9A23B]/60'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Remove from list option */}
          {currentStatus && (
            <div className="pt-2 border-t border-[#2B3443]">
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-400 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/40 hover:border-rose-700/60 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ta bort från listan</span>
              </button>
            </div>
          )}
        </div>
      </div>,
      document.body
    )
  ) : null;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 w-full">
        {currentStatus ? (
          <button
            type="button"
            onClick={handleButtonClick}
            className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${statusConfigs[currentStatus].bg} ${statusConfigs[currentStatus].color} ${statusConfigs[currentStatus].border} hover:opacity-90 shadow-sm cursor-pointer`}
          >
            {React.createElement(statusConfigs[currentStatus].icon, { className: 'w-3.5 h-3.5' })}
            <span>{statusConfigs[currentStatus].label}</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#171C25] hover:bg-[#1E2531] text-[#ECE9E3] border border-[#2B3443] transition-all shadow-sm hover:border-[#E9A23B]/40 cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-[#E9A23B]" />
            <span>Lägg till</span>
          </button>
        )}
      </div>

      {/* Global Portaled Modal - Never clipped by any card or scroll container */}
      {modalContent}
    </div>
  );
}

