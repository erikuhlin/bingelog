'use client';

import React from 'react';
import { Film, CheckCircle2, Clock } from 'lucide-react';

interface LibraryStatsHeaderProps {
  totalTitles: number;
  totalWatchedEpisodes: number;
  totalRuntimeMinutes: number;
}

export default function LibraryStatsHeader({
  totalTitles,
  totalWatchedEpisodes,
  totalRuntimeMinutes,
}: LibraryStatsHeaderProps) {
  // Format runtime: convert minutes to days and hours
  const formatRuntime = (mins: number) => {
    if (!mins || mins <= 0) return null;
    const days = (mins / (60 * 24)).toFixed(1);
    return `${days} dagar`;
  };

  const daysString = formatRuntime(totalRuntimeMinutes);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mt-6">
      {/* Stat 1: Titles */}
      <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Titlar</p>
          <p className="text-xl md:text-2xl font-black text-white">{totalTitles}</p>
        </div>
      </div>

      {/* Stat 2: Watched Episodes */}
      <div className="bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Avsnitt sedda</p>
          <p className="text-xl md:text-2xl font-black text-white">{totalWatchedEpisodes}</p>
        </div>
      </div>

      {/* Stat 3: Total watch time (days) */}
      <div className="col-span-2 sm:col-span-1 bg-zinc-900/70 border border-zinc-800/90 rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">Speltid</p>
          <p className="text-xl md:text-2xl font-black text-white">
            {daysString ? daysString : `${Math.round(totalWatchedEpisodes * 0.75)} timmar`}
          </p>
        </div>
      </div>
    </div>
  );
}
