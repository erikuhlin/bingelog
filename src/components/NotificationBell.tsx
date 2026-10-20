'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Sparkles, Check, Clock, ChevronRight, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserMediaList } from '@/lib/storage';
import { ReleaseNotification } from '@/app/api/notifications/check/route';
import { getImageUrl } from '@/lib/tmdb';

export default function NotificationBell() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<ReleaseNotification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const storageKey = user ? `bingelog_read_notifications_${user.id}` : 'bingelog_read_notifications';

  // Load read notifications from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)));
      } else {
        setReadIds(new Set());
      }
    } catch {
      setReadIds(new Set());
    }
  }, [storageKey]);

  // Save read notifications to localStorage
  const markAsRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  const markAllAsRead = () => {
    setReadIds((prev) => {
      const next = new Set(prev);
      notifications.forEach((n) => next.add(n.id));
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      }
      return next;
    });
  };

  // Check notifications against user library
  const checkNotifications = async () => {
    if (!user) return;
    try {
      const library = await getUserMediaList();
      if (!library || library.length === 0) {
        setNotifications([]);
        return;
      }

      const res = await fetch('/api/notifications/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ libraryItems: library }),
      });

      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (err) {
      console.warn('Could not check release notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      checkNotifications();
    } else {
      setNotifications([]);
    }

    const handler = () => checkNotifications();
    window.addEventListener('bingelog_storage_changed', handler);
    return () => window.removeEventListener('bingelog_storage_changed', handler);
  }, [user]);

  // Close dropdown on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Lock body scroll on mobile when notification drawer is open
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined' && window.innerWidth < 640) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const activeNotifications = notifications.filter((n) => !readIds.has(n.id));
  const unreadCount = activeNotifications.length;

  const handleNotificationClick = (item: ReleaseNotification) => {
    markAsRead(item.id);
    setIsOpen(false);
    router.push(`/${item.media_type}/${item.tmdb_id}`);
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const diffDays = Math.round((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 0) return 'Idag!';
        if (diffDays === 1) return 'Imorgon';
        if (diffDays === -1) return 'Igår';
        return d.toLocaleDateString('sv-SE', {
          year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      {/* Bell Button with Unread Badge */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notiser"
        className="relative p-2 rounded-full hover:bg-[#1E2531] border border-[#2B3443] text-[#8D97A8] hover:text-[#ECE9E3] transition-all cursor-pointer focus:outline-none"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E9A23B] text-[#0F1218] text-[10px] font-black flex items-center justify-center shadow-md shadow-[#E9A23B]/30 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel & Mobile Backdrop */}
      {isOpen && (
        <>
          {/* Mobile backdrop dimming the background for maximum readability */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 sm:hidden animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Notification Card / Dropdown */}
          <div className="fixed inset-x-3 top-[68px] max-h-[calc(100vh-150px)] sm:max-h-[520px] sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 sm:w-96 bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="px-4 py-3 sm:py-3.5 border-b border-[#2B3443] flex items-center justify-between gap-2 bg-[#171C25] flex-shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#E9A23B]/10 text-[#E9A23B]">
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-[#ECE9E3] truncate">Premiärnotiser</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E9A23B] text-[#0F1218] flex-shrink-0">
                      {unreadCount} {unreadCount === 1 ? 'ny' : 'nya'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-xs font-semibold text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[#1E2531] whitespace-nowrap"
                  >
                    Markera alla lästa
                  </button>
                )}
                {/* Mobile close button */}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#1E2531] transition-colors sm:hidden cursor-pointer"
                  aria-label="Stäng notiser"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#2B3443]/50">
              {activeNotifications.length > 0 ? (
                activeNotifications.map((item) => {
                  const isUpcoming = new Date(item.release_date).getTime() > Date.now();
                  const isNewSeason = item.season_number && item.season_number > 1;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          handleNotificationClick(item);
                        }
                      }}
                      className="w-full text-left p-3 sm:p-3.5 flex items-start gap-3 transition-colors hover:bg-[#1E2531]/80 cursor-pointer bg-[#E9A23B]/5 group"
                    >
                      {/* Poster thumbnail */}
                      <div className="w-12 sm:w-12 aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0 shadow-sm">
                        <img
                          src={getImageUrl(item.poster_path, 'w300')}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                              isUpcoming
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                : isNewSeason
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                : 'bg-[#E9A23B]/20 text-[#E9A23B] border border-[#E9A23B]/30'
                            }`}
                          >
                            {isUpcoming ? 'Kommande' : isNewSeason ? 'Ny säsong' : 'Premiär!'}
                          </span>
                          <span className="text-[11px] font-medium text-[#8D97A8]">
                            {formatDisplayDate(item.release_date)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-[#ECE9E3] truncate group-hover:text-[#E9A23B] transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] sm:text-xs text-[#8D97A8] mt-0.5 line-clamp-2 leading-relaxed">
                          {item.message}
                        </p>
                      </div>

                      {/* Dismiss / Mark as read button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(item.id);
                        }}
                        className="p-1.5 rounded-lg text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#2B3443] transition-colors flex-shrink-0 cursor-pointer self-start"
                        title="Markera som läst"
                        aria-label="Markera som läst"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E2531] border border-[#2B3443] flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-[#8D97A8]" />
                  </div>
                  <p className="text-sm font-bold text-[#ECE9E3]">
                    Inga nya premiärnotiser
                  </p>
                  <p className="text-xs text-[#8D97A8] mt-1 max-w-[260px] mx-auto leading-relaxed">
                    När titlar i din bevakningslista eller serier du tittar på har premiär dyker de upp här!
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[#2B3443] bg-[#0F1218]/60 flex items-center justify-between text-xs flex-shrink-0">
              <Link
                href="/upcoming"
                onClick={() => setIsOpen(false)}
                className="text-[#E9A23B] hover:underline font-semibold flex items-center gap-1 text-[11px] sm:text-xs"
              >
                <span>Visa alla kommande</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <span className="text-[10px] text-[#8D97A8]">
                Från ditt bibliotek
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
