'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, Sparkles, LogOut, ChevronDown, User } from 'lucide-react';
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

  const displayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Konto';
  const email = user.email || '';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 rounded-full hover:bg-[#1E2531] border border-[#2B3443] transition-colors focus:outline-none"
      >
        <div className="w-8 h-8 rounded-full bg-[#E9A23B] text-[#0F1218] flex items-center justify-center font-black text-xs shadow-md">
          {initial}
        </div>
        <span className="text-xs font-semibold text-[#ECE9E3] hidden sm:inline max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-[#8D97A8] mr-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-[#171C25] border border-[#2B3443] rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
          {/* User info */}
          <div className="px-3 py-2.5 border-b border-[#2B3443] mb-1">
            <p className="text-sm font-bold text-[#ECE9E3] truncate">{displayName}</p>
            <p className="text-xs text-[#8D97A8] truncate">{email}</p>
            <div className="flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-[#6FA98A]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FA98A] animate-pulse"></span>
              <span>Molnsynkad med Supabase</span>
            </div>
          </div>

          {/* Links */}
          <Link
            href="/library"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#ECE9E3] hover:bg-[#1E2531] transition-colors"
          >
            <Bookmark className="w-4 h-4 text-[#E9A23B]" />
            <span>Mitt bibliotek</span>
          </Link>

          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#ECE9E3] hover:bg-[#1E2531] transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#E9A23B]" />
            <span>Utforska</span>
          </Link>

          <div className="my-1 border-t border-[#2B3443]" />

          <button
            onClick={() => {
              setIsOpen(false);
              signOut();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-950/30 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Logga ut</span>
          </button>
        </div>
      )}
    </div>
  );
}
