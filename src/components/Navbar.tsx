'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Tv, Bookmark, Search, X, Sparkles, UserPlus } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { searchMedia, getImageUrl } from '@/lib/tmdb';
import { MediaItem } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchMedia(searchQuery);
      setSearchResults(results.slice(0, 6));
      setIsSearching(false);
      setShowDropdown(true);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectMedia = (item: MediaItem) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/${item.media_type}/${item.id}`);
  };

  const navLinks = [
    { href: '/', label: 'Utforska', icon: Sparkles },
    { href: '/movies', label: 'Filmer', icon: Film },
    { href: '/shows', label: 'Serier', icon: Tv },
    { href: '/library', label: 'Mitt bibliotek', icon: Bookmark },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform">
                B
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-white flex items-center gap-1">
                  Binge<span className="text-rose-500">log</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-medium -mt-1 hidden sm:inline">
                  Track your watch history
                </span>
              </div>
            </Link>

            {/* Nav links (desktop) */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-800 text-white shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search bar & Auth */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-md">
            <div ref={searchRef} className="relative w-full max-w-[200px] sm:max-w-xs">
              <div className="relative flex items-center">
                <Search className="absolute left-3 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  placeholder="Sök film el. serie..."
                  className="w-full bg-zinc-900/90 border border-zinc-800 rounded-full pl-8 pr-8 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all truncate"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-zinc-400 hover:text-zinc-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-0 mt-2 w-72 sm:w-auto bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-zinc-400">Söker...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2 divide-y divide-zinc-800/50 max-h-96 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => handleSelectMedia(item)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-zinc-800/80 transition-colors text-left"
                        >
                          <img
                            src={getImageUrl(item.poster_path, 'w300')}
                            alt={item.title}
                            className="w-9 h-12 object-cover rounded-md bg-zinc-800 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-zinc-100 truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-zinc-400">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300">
                                {item.media_type === 'movie' ? 'Film' : 'Serie'}
                              </span>
                              <span>{item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '–'}</span>
                              <span>★ {item.vote_average.toFixed(1)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-zinc-400">Inga resultat hittades</div>
                  )}
                </div>
              )}
            </div>

            {/* Auth / Profile Area */}
            {!authLoading && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {user ? (
                  <UserMenu />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800/80 transition-colors whitespace-nowrap"
                    >
                      Logga in
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md shadow-rose-900/30 transition-all whitespace-nowrap"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Skapa konto</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800/90 bg-zinc-950/95 backdrop-blur-xl px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold transition-all active:scale-95 ${
                isActive ? 'text-rose-500 font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Auth Modal */}
      <AuthModal />
    </>
  );
}
