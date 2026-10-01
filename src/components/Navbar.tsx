'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Film, Tv, Bookmark, Search, Sparkles, UserPlus } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import UserMenu from './UserMenu';
import AuthModal from './AuthModal';
import BrandLogo from './BrandLogo';
import SearchOverlay from './SearchOverlay';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, openAuthModal } = useAuth();
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOverlayOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: 'Utforska', icon: Sparkles },
    { href: '/movies', label: 'Filmer', icon: Film },
    { href: '/shows', label: 'Serier', icon: Tv },
    { href: '/library', label: 'Mitt bibliotek', icon: Bookmark },
  ];

  const isLinkActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/movies') {
      return pathname === '/movies' || pathname.startsWith('/movie/');
    }
    if (href === '/shows') {
      return pathname === '/shows' || pathname.startsWith('/tv/');
    }
    if (href === '/library') {
      return pathname === '/library' || pathname.startsWith('/library/');
    }
    return pathname === href;
  };

  const handleNavLinkClick = (href: string, isActive: boolean) => {
    if (typeof window !== 'undefined') {
      if (isActive) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      sessionStorage.removeItem(`bingelog_scroll_${href}`);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full max-w-full border-b border-[#2B3443] bg-[#0F1218]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-3 md:gap-4 min-w-0">
          {/* Brand */}
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 flex-shrink-0">
            <Link
              href="/"
              onClick={() => handleNavLinkClick('/', pathname === '/')}
              className="flex items-center gap-2 group flex-shrink-0"
            >
              <BrandLogo size="md" />
              <div className="flex flex-col">
                <span className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-[#ECE9E3] flex items-center gap-0.5">
                  Binge<span className="text-[#E9A23B]">log</span>
                </span>
                <span className="text-[10px] text-[#8D97A8] font-medium -mt-1 hidden lg:inline">
                  Track your watch history
                </span>
              </div>
            </Link>

            {/* Nav links (desktop & tablet) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 flex-shrink-0">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => handleNavLinkClick(link.href, isActive)}
                    className={`relative flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-1.5 rounded-xl text-xs lg:text-sm transition-all whitespace-nowrap ${
                      isActive
                        ? 'bg-[#E9A23B]/15 text-[#E9A23B] border border-[#E9A23B]/50 shadow-sm shadow-[#E9A23B]/10 font-bold'
                        : 'text-[#8D97A8] hover:text-[#ECE9E3] hover:bg-[#171C25] font-medium border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isActive ? 'text-[#E9A23B] stroke-[2.5]' : 'text-[#8D97A8]'}`} />
                    <span>{link.label}</span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E9A23B] shadow-[0_0_6px_#E9A23B] -ml-0.5" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Search bar & Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 flex-1 justify-end min-w-0">
            {/* Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOverlayOpen(true)}
              className="relative flex items-center justify-between w-full min-w-[110px] max-w-[140px] sm:max-w-[180px] md:max-w-[200px] lg:max-w-xs bg-[#171C25] border border-[#2B3443] hover:border-[#E9A23B]/60 rounded-full pl-3 pr-2 sm:pr-3 py-1.5 text-xs text-[#8D97A8] hover:text-[#ECE9E3] transition-all cursor-pointer group shadow-sm"
              title="Sök (Cmd+K)"
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-3.5 h-3.5 text-[#8D97A8] group-hover:text-[#E9A23B] transition-colors flex-shrink-0" />
                <span className="truncate">Sök...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold text-[#8D97A8] bg-[#0F1218] border border-[#2B3443] rounded-md">
                ⌘K
              </kbd>
            </button>

            {/* Auth / Profile Area */}
            {!authLoading && (
              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                {user ? (
                  <UserMenu />
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openAuthModal('login')}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold text-[#ECE9E3] hover:bg-[#171C25] border border-transparent hover:border-[#2B3443] transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      Logga in
                    </button>
                    <button
                      onClick={() => openAuthModal('signup')}
                      className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#E9A23B] hover:bg-[#F2B04E] text-[#0F1218] shadow-md shadow-[#E9A23B]/20 transition-all whitespace-nowrap flex-shrink-0"
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[#2B3443] bg-[#0F1218]/95 backdrop-blur-xl px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-around shadow-2xl">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = isLinkActive(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => handleNavLinkClick(link.href, isActive)}
              className={`relative flex flex-col items-center gap-1 py-1 px-3 text-[11px] transition-all active:scale-95 ${
                isActive ? 'text-[#E9A23B] font-bold' : 'text-[#8D97A8] hover:text-[#ECE9E3] font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#E9A23B] rounded-full shadow-[0_0_8px_#E9A23B]" />
              )}
              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#E9A23B]/20 text-[#E9A23B] ring-1 ring-[#E9A23B]/40 shadow-sm shadow-[#E9A23B]/20'
                    : 'text-[#8D97A8]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Global Auth Modal */}
      <AuthModal />

      {/* Global Search Overlay */}
      <SearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
      />
    </>
  );
}
