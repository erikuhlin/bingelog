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
  const formatRuntime = (mins: number) => {
    if (!mins || mins <= 0) return null;
    const days = (mins / (60 * 24)).toFixed(1);
    return `${days} dagar`;
  };

  const daysString = formatRuntime(totalRuntimeMinutes);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4 mt-6">
      {/* Stat 1: Titles */}
      <div className="bg-[#171C25] border border-[#2B3443] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-[#E9A23B]/10 text-[#E9A23B] flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#8D97A8] uppercase tracking-wider">Titlar</p>
          <p className="text-xl md:text-2xl font-black text-[#ECE9E3]">{totalTitles}</p>
        </div>
      </div>

      {/* Stat 2: Watched Episodes */}
      <div className="bg-[#171C25] border border-[#2B3443] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-[#6FA98A]/10 text-[#6FA98A] flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#8D97A8] uppercase tracking-wider">Avsnitt sedda</p>
          <p className="text-xl md:text-2xl font-black text-[#ECE9E3]">{totalWatchedEpisodes}</p>
        </div>
      </div>

      {/* Stat 3: Total watch time (days) */}
      <div className="col-span-2 sm:col-span-1 bg-[#171C25] border border-[#2B3443] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-[#B5721E]/15 text-[#E9A23B] flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div>
          <p className="text-[11px] font-semibold text-[#8D97A8] uppercase tracking-wider">Speltid</p>
          <p className="text-xl md:text-2xl font-black text-[#ECE9E3]">
            {daysString ? daysString : `${Math.round(totalWatchedEpisodes * 0.75)} timmar`}
          </p>
        </div>
      </div>
    </div>
  );
}
