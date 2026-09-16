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
import BrandLogo from './BrandLogo';

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
      <header className="sticky top-0 z-40 w-full border-b border-[#2B3443] bg-[#0F1218]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-4 md:gap-6 flex-shrink-0">
            <Link href="/" className="flex items-center gap-2.5 group">
              <BrandLogo size="md" />
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#ECE9E3] flex items-center gap-0.5">
                  Binge<span className="text-[#E9A23B]">log</span>
                </span>
                <span className="text-[10px] text-[#8D97A8] font-medium -mt-1 hidden sm:inline">
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
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[#1E2531] text-[#E9A23B] shadow-sm font-semibold border border-[#2B3443]'
                        : 'text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#171C25]'
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
          <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end max-w-md min-w-0">
            <div ref={searchRef} className="relative w-full min-w-0 max-w-[160px] xs:max-w-[200px] sm:max-w-xs">
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 xs:left-3 w-3.5 h-3.5 text-[#8D97A8] pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.trim() && setShowDropdown(true)}
                  placeholder="Sök film el. serie..."
                  className="w-full bg-[#171C25] border border-[#2B3443] rounded-full pl-7 xs:pl-8 pr-7 xs:pr-8 py-1.5 text-xs text-[#ECE9E3] placeholder-[#8D97A8] focus:outline-none focus:border-[#E9A23B] focus:ring-1 focus:ring-[#E9A23B] transition-all truncate"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 xs:right-2.5 text-[#8D97A8] hover:text-[#ECE9E3]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Live Search Dropdown */}
              {showDropdown && (
                <div className="absolute top-full right-0 sm:left-0 sm:right-0 mt-2 w-72 sm:w-auto bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl overflow-hidden z-50">
                  {isSearching ? (
                    <div className="p-4 text-center text-xs text-[#8D97A8]">Söker...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-2 divide-y divide-[#2B3443]/60 max-h-96 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={`${item.media_type}-${item.id}`}
                          onClick={() => handleSelectMedia(item)}
                          className="w-full px-4 py-2 flex items-center gap-3 hover:bg-[#1E2531] transition-colors text-left"
                        >
                          <img
                            src={getImageUrl(item.poster_path, 'w300')}
                            alt={item.title}
                            className="w-9 h-12 object-cover rounded-md bg-[#0F1218] flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#ECE9E3] truncate">{item.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#8D97A8]">
                              <span className="capitalize px-1.5 py-0.5 rounded bg-[#1E2531] text-[10px] text-[#ECE9E3]">
                                {item.media_type === 'movie' ? 'Film' : 'Serie'}
                              </span>
                              <span>{item.release_date?.slice(0, 4) || item.first_air_date?.slice(0, 4) || '–'}</span>
                              <span className="text-[#E9A23B]">★ {item.vote_average.toFixed(1)}</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[#8D97A8]">Inga resultat hittades</div>
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
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ECE9E3] hover:bg-[#171C25] border border-transparent hover:border-[#2B3443] transition-colors whitespace-nowrap"
                    >
                      Logga in
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 transition-all whitespace-nowrap"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#2B3443] bg-[#0F1218]/95 backdrop-blur-xl px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-1 py-1 px-3 text-[11px] font-semibold transition-all active:scale-95 ${
                isActive ? 'text-[#E9A23B] font-bold' : 'text-[#8D97A8] hover:text-[#ECE9E3]'
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
