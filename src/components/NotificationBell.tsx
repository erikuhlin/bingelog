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
      }
    } catch {
      // ignore
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
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(allIds)));
    }
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
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('sv-SE', {
          year: 'numeric',
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

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
          {/* Header */}
          <div className="px-4 py-3 border-b border-[#2B3443] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#E9A23B]" />
              <h3 className="text-sm font-bold text-[#ECE9E3]">Premiärnotiser</h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#E9A23B]/20 text-[#E9A23B]">
                  {unreadCount} {unreadCount === 1 ? 'ny' : 'nya'}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-[#8D97A8] hover:text-[#ECE9E3] transition-colors cursor-pointer"
              >
                Markera alla som lästa
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-[#2B3443]/50">
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
                    <div className="w-10 sm:w-12 aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1218] border border-[#2B3443] flex-shrink-0">
                      <img
                        src={getImageUrl(item.poster_path, 'w300')}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                            isUpcoming
                              ? 'bg-blue-500/20 text-blue-400'
                              : isNewSeason
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-[#E9A23B]/20 text-[#E9A23B]'
                          }`}
                        >
                          {isUpcoming ? 'Kommande' : isNewSeason ? 'Ny säsong' : 'Premiär!'}
                        </span>
                        <span className="text-[10px] text-[#8D97A8]">
                          {formatDisplayDate(item.release_date)}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-[#ECE9E3] truncate">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-[#8D97A8] mt-0.5 line-clamp-2 leading-relaxed">
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
                      className="p-1 -mr-1 rounded-lg text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#2B3443] transition-colors flex-shrink-0 cursor-pointer"
                      title="Markera som läst"
                      aria-label="Markera som läst"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 px-4">
                <Bell className="w-8 h-8 text-[#8D97A8] mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-[#ECE9E3]">
                  Inga nya premiärnotiser
                </p>
                <p className="text-[11px] text-[#8D97A8] mt-1 max-w-[240px] mx-auto leading-relaxed">
                  När filmer eller serier i ditt bibliotek släpps eller får nya säsonger dyker de upp här!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
