'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, Bookmark, Film, Tv } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function UserWelcomeBanner() {
  const { user } = useAuth();

  if (!user) return null;

  const displayName = user.user_metadata?.username || user.user_metadata?.full_name || user.email?.split('@')[0];

  return (
    <div className="mb-8 p-4 md:p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>Välkommen tillbaka, {displayName}!</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
              Molnsynkad
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            Dina sedda avsnitt och filmer sparas direkt i ditt Supabase-konto.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href="/lists"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
        >
          <Bookmark className="w-3.5 h-3.5 text-rose-500" />
          <span>Öppna samling</span>
        </Link>
      </div>
    </div>
  );
}
