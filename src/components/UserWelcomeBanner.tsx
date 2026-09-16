'use client';

import React from 'react';
import Link from 'next/link';
import { Bookmark, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserWelcomeBanner() {
  const { user } = useAuth();

  if (!user) return null;

  const displayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0];

  return (
    <div className="mb-8 p-4 md:p-5 rounded-2xl bg-[#171C25] border border-[#2B3443] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#E9A23B] to-[#7A5A21] flex items-center justify-center text-[#0F1218] font-black text-sm shadow-md">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-bold text-[#ECE9E3] flex items-center gap-2">
            <span>Välkommen tillbaka, {displayName}!</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#6FA98A]/15 text-[#6FA98A] border border-[#6FA98A]/30 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Molnsynkad</span>
            </span>
          </h2>
          <p className="text-xs text-[#8D97A8]">
            Dina sedda avsnitt och filmer sparas direkt i ditt Supabase-konto.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/library"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E2531] hover:bg-[#2B3443] text-[#ECE9E3] text-xs font-semibold transition-colors border border-[#2B3443]"
        >
          <Bookmark className="w-3.5 h-3.5 text-[#E9A23B]" />
          <span>Mitt bibliotek</span>
        </Link>
      </div>
    </div>
  );
}
