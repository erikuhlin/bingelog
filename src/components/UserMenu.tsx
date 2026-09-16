'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { User, LogOut, Bookmark, CloudCheck, ChevronDown, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const email = user.email || '';
  const displayName = user.user_metadata?.username || user.user_metadata?.full_name || email.split('@')[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-zinc-800/80 border border-zinc-800 transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
          {initial}
        </div>
        <span className="text-xs font-semibold text-zinc-200 hidden sm:inline max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 mr-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-zinc-800 mb-1">
            <p className="text-sm font-bold text-white truncate">{displayName}</p>
            <p className="text-xs text-zinc-400 truncate">{email}</p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Molnsynkad med Supabase</span>
            </div>
          </div>

          {/* Links */}
          <Link
            href="/library"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Bookmark className="w-4 h-4 text-rose-500" />
            <span>Mitt bibliotek</span>
          </Link>

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Utforska</span>
          </Link>

          <div className="my-1 border-t border-zinc-800" />

          {/* Sign out */}
          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/40 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logga ut</span>
          </button>
        </div>
      )}
    </div>
  );
}
